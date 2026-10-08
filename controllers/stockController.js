const db = require('../config/db');
const { getUserAssignedBranches } = require('../middleware/auth');

/**
 * Get initial contextual data for Stock In form (branches, products, units, balances)
 */
async function getStockInInitData(req, res, next) {
    try {
        const user = req.session.user;
        const branchInfo = await getUserAssignedBranches(user);
        const { branch_id, sort, order } = req.query;

        // Determine active selected branch
        let selectedBranchId = branch_id ? parseInt(branch_id, 10) : null;
        if (!selectedBranchId && branchInfo.branches.length > 0) {
            selectedBranchId = branchInfo.branches[0].id;
        }

        const selectedBranch = branchInfo.branches.find(b => b.id === selectedBranchId);
        const branchType = selectedBranch ? parseInt(selectedBranch.type, 10) : null;

        // Fetch products filtered by selected branch category
        let prodSql = `
            SELECT p.id, p.name, p.brand, p.type, p.color, p.description, p.unit_id,
                   u.name AS unit_name, u.symbol AS unit_symbol
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            WHERE p.is_deleted = 0
        `;
        const prodParams = [];
        if (branchType) {
            prodSql += ` AND (p.type = $1 OR p.type = 0)`;
            prodParams.push(branchType);
        }
        prodSql += ` ORDER BY p.brand ASC, p.name ASC`;

        const productsRes = await db.query(prodSql, prodParams);

        // Fetch units
        const unitsRes = await db.query('SELECT * FROM units ORDER BY name ASC');
        let pieceUnitId = 0;
        unitsRes.rows.forEach(u => {
            const sym = u.symbol.toLowerCase();
            const name = u.name.toLowerCase();
            if (['piece', 'pcs'].includes(sym) || name === 'piece') {
                pieceUnitId = u.id;
            }
        });

        // Fetch branch balances if a branch is selected
        let inventoryRows = [];
        if (selectedBranchId) {
            const sortMap = {
                id: 'p.id',
                brand: 'p.brand',
                name: 'p.name',
                type: 'p.type'
            };
            const sortCol = sortMap[sort] || 'p.name';
            const sortOrd = (order && order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

            const invQuery = `
                SELECT 
                    p.id, p.name, p.type, p.brand, p.color, p.description,
                    u.symbol AS unit_symbol,
                    COALESCE(bi.quantity, 0)::numeric(12, 2) AS total_quantity
                FROM products p
                INNER JOIN branch_inventory bi ON p.id = bi.product_id
                LEFT JOIN units u ON p.unit_id = u.id
                WHERE p.is_deleted = 0 AND bi.branch_id = $1
                ORDER BY ${sortCol} ${sortOrd}
            `;
            const invRes = await db.query(invQuery, [selectedBranchId]);
            inventoryRows = invRes.rows;
        }

        return res.json({
            success: true,
            permittedBranches: branchInfo.branches,
            selectedBranchId: selectedBranchId,
            products: productsRes.rows,
            units: unitsRes.rows,
            pieceUnitId: pieceUnitId,
            inventory: inventoryRows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Handle Stock In transaction
 */
async function stockIn(req, res, next) {
    const client = await db.getClient();
    try {
        const user = req.session.user;
        const branchInfo = await getUserAssignedBranches(user);

        const {
            branch_id,
            product_id,
            unit_id,
            quantity,
            purchase_price,
            date,
            conversion_factor
        } = req.body;

        const targetBranchId = parseInt(branch_id, 10);
        const targetProductId = parseInt(product_id, 10);
        const targetUnitId = parseInt(unit_id, 10);
        const bulkQuantity = parseFloat(quantity);
        const totalPurchasePrice = parseFloat(purchase_price);
        const entryDate = date || new Date().toISOString().split('T')[0];
        let factor = parseFloat(conversion_factor) || 1.0;
        if (factor <= 0) factor = 1.0;

        if (!targetBranchId || !targetProductId || !targetUnitId || isNaN(bulkQuantity) || bulkQuantity <= 0 || isNaN(totalPurchasePrice) || totalPurchasePrice < 0) {
            return res.status(400).json({ success: false, message: 'Please provide valid branch, product, positive quantity, and purchase price.' });
        }

        // Security authorization: Ensure user has permission for this branch
        if (!branchInfo.isAdmin && !branchInfo.branchIds.includes(targetBranchId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to this branch.' });
        }

        // Calculate base units
        const quantityInBase = bulkQuantity * factor;

        // Get unit symbol for historical records
        const unitRes = await client.query('SELECT symbol FROM units WHERE id = $1', [targetUnitId]);
        const unitSymbol = unitRes.rows[0]?.symbol || 'pcs';

        await client.query('BEGIN');

        // 1. Insert into stock_in ledger
        const insertStockInQuery = `
            INSERT INTO stock_in (
                branch_id, product_id, quantity, purchase_price, date,
                unit_type, conversion_factor, bulk_quantity, quantity_remaining
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;
        const stockInRes = await client.query(insertStockInQuery, [
            targetBranchId,
            targetProductId,
            quantityInBase,
            totalPurchasePrice,
            entryDate,
            unitSymbol,
            factor,
            bulkQuantity,
            quantityInBase
        ]);

        // 2. Increment branch_inventory
        const upsertInventoryQuery = `
            INSERT INTO branch_inventory (branch_id, product_id, quantity)
            VALUES ($1, $2, $3)
            ON CONFLICT (branch_id, product_id)
            DO UPDATE SET quantity = branch_inventory.quantity + EXCLUDED.quantity
        `;
        await client.query(upsertInventoryQuery, [targetBranchId, targetProductId, quantityInBase]);

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Stock items added successfully into live logs and branch shelf balances!',
            stockInId: stockInRes.rows[0].id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Get initial contextual data for Stock Out form (branches, products, units, conversions, balances)
 */
async function getStockOutInitData(req, res, next) {
    try {
        const user = req.session.user;
        const branchInfo = await getUserAssignedBranches(user);
        const { branch_id } = req.query;

        let selectedBranchId = branch_id ? parseInt(branch_id, 10) : null;
        if (!selectedBranchId && branchInfo.branches.length > 0) {
            selectedBranchId = branchInfo.branches[0].id;
        }

        const selectedBranch = branchInfo.branches.find(b => b.id === selectedBranchId);
        const branchType = selectedBranch ? parseInt(selectedBranch.type, 10) : null;

        // Fetch products filtered by selected branch category with live branch_quantity
        let prodSql = `
            SELECT p.id, p.name, p.brand, p.type, p.color, p.description, p.unit_id,
                   u.name AS unit_name, u.symbol AS unit_symbol,
                   COALESCE(bi.quantity, 0)::numeric(12, 2) AS branch_quantity
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            LEFT JOIN branch_inventory bi ON p.id = bi.product_id AND bi.branch_id = $1
            WHERE p.is_deleted = 0
        `;
        const prodParams = [selectedBranchId];
        let pIdx = 2;
        if (branchType) {
            prodSql += ` AND (p.type = $${pIdx++} OR p.type = 0)`;
            prodParams.push(branchType);
        }
        prodSql += ` ORDER BY p.brand ASC, p.name ASC`;

        const productsRes = await db.query(prodSql, prodParams);

        // Fetch units
        const unitsRes = await db.query('SELECT * FROM units ORDER BY name ASC');
        let pieceUnitId = 0;
        unitsRes.rows.forEach(u => {
            const sym = u.symbol.toLowerCase();
            const name = u.name.toLowerCase();
            if (['piece', 'pcs'].includes(sym) || name === 'piece') {
                pieceUnitId = u.id;
            }
        });

        // Fetch unit conversions table
        const conversionsRes = await db.query('SELECT product_id, from_unit_id, to_unit_id, factor FROM unit_conversions');
        const conversionsMap = {};
        conversionsRes.rows.forEach(r => {
            const key = `${r.product_id}_${r.from_unit_id}_${r.to_unit_id}`;
            conversionsMap[key] = parseFloat(r.factor);
        });

        // Fetch stock balances for selected branch
        let inventoryRows = [];
        if (selectedBranchId) {
            const invQuery = `
                SELECT 
                    p.id, p.name, p.brand, p.type, p.color, p.description,
                    u.symbol AS unit_symbol,
                    COALESCE(bi.quantity, 0)::numeric(12, 2) AS quantity
                FROM products p
                INNER JOIN branch_inventory bi ON p.id = bi.product_id
                LEFT JOIN units u ON p.unit_id = u.id
                WHERE p.is_deleted = 0 AND bi.branch_id = $1
                ORDER BY p.brand ASC, p.name ASC
            `;
            const invRes = await db.query(invQuery, [selectedBranchId]);
            inventoryRows = invRes.rows;
        }

        return res.json({
            success: true,
            permittedBranches: branchInfo.branches,
            selectedBranchId: selectedBranchId,
            products: productsRes.rows,
            units: unitsRes.rows,
            pieceUnitId: pieceUnitId,
            conversions: conversionsMap,
            inventory: inventoryRows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Handle Stock Out / Sales transaction with FIFO Allocation Engine
 */
async function stockOut(req, res, next) {
    const client = await db.getClient();
    try {
        const user = req.session.user;
        const branchInfo = await getUserAssignedBranches(user);

        const {
            branch_id,
            product_id,
            unit_id,
            quantity,
            sold_price,
            date,
            conversion_factor
        } = req.body;

        const targetBranchId = parseInt(branch_id, 10);
        const targetProductId = parseInt(product_id, 10);
        const targetUnitId = parseInt(unit_id, 10);
        const bulkQuantity = parseFloat(quantity);
        const totalSoldRevenue = parseFloat(sold_price);
        const entryDate = date || new Date().toISOString().split('T')[0];
        let factor = parseFloat(conversion_factor) || 1.0;
        if (factor <= 0) factor = 1.0;

        if (!targetBranchId || !targetProductId || !targetUnitId || isNaN(bulkQuantity) || bulkQuantity <= 0 || isNaN(totalSoldRevenue) || totalSoldRevenue < 0) {
            return res.status(400).json({ success: false, message: 'Please provide valid branch, product, positive quantity, and sales price.' });
        }

        // Security authorization check
        if (!branchInfo.isAdmin && !branchInfo.branchIds.includes(targetBranchId)) {
            return res.status(403).json({ success: false, message: 'Unauthorized: You are not assigned to this branch.' });
        }

        // Get product base unit
        const prodRes = await client.query('SELECT unit_id FROM products WHERE id = $1 AND is_deleted = 0', [targetProductId]);
        if (prodRes.rowCount === 0) {
            return res.status(400).json({ success: false, message: 'Selected product is invalid or archived.' });
        }
        const baseUnitId = prodRes.rows[0].unit_id;

        // Upsert conversion if non-base unit
        if (targetUnitId !== baseUnitId) {
            await client.query(`
                INSERT INTO unit_conversions (product_id, from_unit_id, to_unit_id, factor)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (product_id, from_unit_id, to_unit_id)
                DO UPDATE SET factor = EXCLUDED.factor
            `, [targetProductId, targetUnitId, baseUnitId, factor]);
        }

        const quantityInBase = bulkQuantity * factor;

        // Check available on-hand balance in branch_inventory
        const invCheck = await client.query(
            'SELECT COALESCE(quantity, 0) AS available FROM branch_inventory WHERE branch_id = $1 AND product_id = $2',
            [targetBranchId, targetProductId]
        );
        const availableStock = parseFloat(invCheck.rows[0]?.available || 0);

        if (quantityInBase > availableStock) {
            return res.status(400).json({
                success: false,
                message: `Not enough stock! Available on-hand: ${availableStock.toFixed(2)}, Attempted sale: ${quantityInBase.toFixed(2)}.`
            });
        }

        await client.query('BEGIN');

        // 1. Insert into stock_out table
        const insertStockOutQuery = `
            INSERT INTO stock_out (branch_id, product_id, quantity, sold_price, date)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `;
        const stockOutRes = await client.query(insertStockOutQuery, [
            targetBranchId,
            targetProductId,
            quantityInBase,
            totalSoldRevenue,
            entryDate
        ]);
        const stockOutId = stockOutRes.rows[0].id;

        // 2. FIFO BATCH PROCESSING ENGINE
        let quantityToAllocate = quantityInBase;
        const batchesRes = await client.query(`
            SELECT id, quantity_remaining 
            FROM stock_in 
            WHERE branch_id = $1 AND product_id = $2 AND quantity_remaining > 0 
            ORDER BY date ASC, id ASC
        `, [targetBranchId, targetProductId]);

        for (const batch of batchesRes.rows) {
            if (quantityToAllocate <= 0) break;

            const batchId = batch.id;
            const batchRemaining = parseFloat(batch.quantity_remaining);
            let allocated = 0;
            let newRemaining = 0;

            if (batchRemaining >= quantityToAllocate) {
                newRemaining = batchRemaining - quantityToAllocate;
                allocated = quantityToAllocate;
                quantityToAllocate = 0;
            } else {
                newRemaining = 0;
                allocated = batchRemaining;
                quantityToAllocate -= batchRemaining;
            }

            // Update remaining batch quantity in stock_in
            await client.query('UPDATE stock_in SET quantity_remaining = $1 WHERE id = $2', [newRemaining, batchId]);

            // Record link in stock_out_batches
            await client.query(
                'INSERT INTO stock_out_batches (stock_out_id, stock_in_id, quantity_allocated) VALUES ($1, $2, $3)',
                [stockOutId, batchId, allocated]
            );
        }

        // 3. Decrement live balance in branch_inventory
        await client.query(
            'UPDATE branch_inventory SET quantity = quantity - $1 WHERE branch_id = $2 AND product_id = $3',
            [quantityInBase, targetBranchId, targetProductId]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: 'Stock sold successfully using accurate FIFO batch allocations!',
            stockOutId: stockOutId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Get unit conversions for a product
 */
async function getProductConversions(req, res, next) {
    try {
        const productId = parseInt(req.params.productId, 10);
        if (!productId) {
            return res.json({ success: true, conversions: [] });
        }

        const conversionsRes = await db.query(`
            SELECT uc.product_id, uc.from_unit_id AS unit_id, uc.from_unit_id, uc.to_unit_id, uc.factor,
                   u.name AS unit_name, u.symbol AS unit_symbol
            FROM unit_conversions uc
            JOIN units u ON uc.from_unit_id = u.id
            WHERE uc.product_id = $1
            ORDER BY u.name ASC
        `, [productId]);

        return res.json({
            success: true,
            conversions: conversionsRes.rows
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStockInInitData,
    stockIn,
    getStockOutInitData,
    stockOut,
    getProductConversions
};
