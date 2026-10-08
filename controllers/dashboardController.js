const db = require('../config/db');
const { getUserAssignedBranches } = require('../middleware/auth');

/**
 * Global Dashboard Overview (for Admin / authorized roles)
 */
async function getDashboardOverview(req, res, next) {
    try {
        const user = req.session.user;
        const branchInfo = await getUserAssignedBranches(user);

        const branches = branchInfo.branches || [];
        const overview = [];

        for (const branch of branches) {
            const bId = branch.id;

            // 1. Total active inventory quantity and low stock count
            const invRes = await db.query(`
                SELECT 
                    COALESCE(SUM(bi.quantity), 0)::numeric(12, 2) AS total_products,
                    COALESCE(SUM(CASE WHEN bi.quantity <= COALESCE(p.min_stock_alert, 5) THEN 1 ELSE 0 END), 0)::int AS low_stock
                FROM branch_inventory bi
                JOIN products p ON p.id = bi.product_id
                WHERE bi.branch_id = $1 AND p.is_deleted = 0
            `, [bId]);

            // 2. Today's realized sales
            const salesRes = await db.query(`
                SELECT COALESCE(SUM(sold_price), 0)::numeric(12, 2) AS today_sales
                FROM stock_out
                WHERE branch_id = $1 AND date = CURRENT_DATE
            `, [bId]);

            overview.push({
                ...branch,
                totalProducts: parseFloat(invRes.rows[0]?.total_products || 0),
                lowStockCount: parseInt(invRes.rows[0]?.low_stock || 0, 10),
                todaySales: parseFloat(salesRes.rows[0]?.today_sales || 0)
            });
        }

        return res.json({
            success: true,
            branchesOverview: overview,
            userRole: user.role
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Specific Branch Operations Hub (with timeline filters, stock logs, alerts, on-hand table)
 */
async function getBranchOperationsHub(req, res, next) {
    try {
        const branchId = parseInt(req.params.id, 10);
        const { range_type, start_date, end_date } = req.query;

        if (!branchId) {
            return res.status(400).json({ success: false, message: 'Invalid branch ID.' });
        }

        const branchRes = await db.query('SELECT * FROM branches WHERE id = $1', [branchId]);
        if (branchRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Branch not found.' });
        }
        const branch = branchRes.rows[0];

        // Construct date filter condition
        let dateCondition = "date = CURRENT_DATE";
        let displayTitle = "Today";
        const dateParams = [];
        let pIdx = 2; // $1 is branchId

        if (range_type === 'weekly') {
            dateCondition = "EXTRACT(WEEK FROM date) = EXTRACT(WEEK FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)";
            displayTitle = "Current Week";
        } else if (range_type === 'monthly') {
            dateCondition = "EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)";
            displayTitle = "Current Month";
        } else if (range_type === 'custom' && start_date) {
            if (end_date) {
                dateCondition = `date BETWEEN $${pIdx++} AND $${pIdx++}`;
                dateParams.push(start_date, end_date);
                displayTitle = `${start_date} to ${end_date}`;
            } else {
                dateCondition = `date = $${pIdx++}`;
                dateParams.push(start_date);
                displayTitle = `${start_date}`;
            }
        }

        // 1. Total Financial Sales Volume within Range
        const salesRes = await db.query(`
            SELECT COALESCE(SUM(sold_price), 0)::numeric(12, 2) AS range_sales
            FROM stock_out
            WHERE branch_id = $1 AND ${dateCondition}
        `, [branchId, ...dateParams]);

        // 2. Live On-Hand Inventory
        const invRes = await db.query(`
            SELECT p.name, p.brand, p.color, p.type, bi.quantity, u.symbol
            FROM branch_inventory bi
            JOIN products p ON p.id = bi.product_id
            LEFT JOIN units u ON u.id = p.unit_id
            WHERE bi.branch_id = $1 AND p.is_deleted = 0
            ORDER BY p.brand ASC, p.name ASC
        `, [branchId]);

        // 3. Stock In Logs within Range
        const stockInCondition = dateCondition.replace(/date/g, 'si.date');
        const stockInRes = await db.query(`
            SELECT si.id, p.name, si.quantity, si.purchase_price, si.date, u.symbol 
            FROM stock_in si
            JOIN products p ON p.id = si.product_id
            LEFT JOIN units u ON u.id = p.unit_id
            WHERE si.branch_id = $1 AND ${stockInCondition}
            ORDER BY si.date DESC, si.id DESC
        `, [branchId, ...dateParams]);

        // 4. Stock Out Logs within Range
        const stockOutCondition = dateCondition.replace(/date/g, 'so.date');
        const stockOutRes = await db.query(`
            SELECT so.id, p.name, so.quantity, so.sold_price, so.date, u.symbol 
            FROM stock_out so
            JOIN products p ON p.id = so.product_id
            LEFT JOIN units u ON u.id = p.unit_id
            WHERE so.branch_id = $1 AND ${stockOutCondition}
            ORDER BY so.date DESC, so.id DESC
        `, [branchId, ...dateParams]);

        // 5. Damaged Stock Logs within Range
        const damagedCondition = dateCondition.replace(/date/g, 'ds.date');
        const damagedRes = await db.query(`
            SELECT ds.id, p.name, p.brand, ds.quantity, ds.input_quantity, ds.reason, ds.date, ds.reported_by, u.symbol 
            FROM damaged_stock ds
            JOIN products p ON p.id = ds.product_id
            LEFT JOIN units u ON u.id = p.unit_id
            WHERE ds.branch_id = $1 AND ${damagedCondition}
            ORDER BY ds.date DESC, ds.id DESC
        `, [branchId, ...dateParams]);

        // 6. Low Stock Alert Items
        const lowStockRes = await db.query(`
            SELECT p.name, p.brand, bi.quantity, u.symbol, COALESCE(p.min_stock_alert, 5)::numeric(12, 2) AS min_stock_alert
            FROM branch_inventory bi
            JOIN products p ON p.id = bi.product_id
            LEFT JOIN units u ON u.id = p.unit_id
            WHERE bi.branch_id = $1 AND bi.quantity <= COALESCE(p.min_stock_alert, 5) AND p.is_deleted = 0
            ORDER BY bi.quantity ASC
        `, [branchId]);

        return res.json({
            success: true,
            branch,
            timelineTitle: displayTitle,
            rangeSales: parseFloat(salesRes.rows[0]?.range_sales || 0),
            inventory: invRes.rows,
            stockInLogs: stockInRes.rows,
            stockOutLogs: stockOutRes.rows,
            damagedLogs: damagedRes.rows,
            lowStockAlerts: lowStockRes.rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Edit Inbound Stock Log (with rollback threshold validation)
 */
async function editStockIn(req, res, next) {
    const client = await db.getClient();
    try {
        const id = parseInt(req.params.id, 10);
        const { quantity, purchase_price } = req.body;

        const newQty = parseFloat(quantity);
        const newPrice = parseFloat(purchase_price);

        if (!id || isNaN(newQty) || newQty < 0 || isNaN(newPrice) || newPrice < 0) {
            return res.status(400).json({ success: false, message: 'Valid non-negative quantity and price are required.' });
        }

        const logRes = await client.query('SELECT * FROM stock_in WHERE id = $1', [id]);
        if (logRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Stock-in record not found.' });
        }
        const log = logRes.rows[0];
        const oldQty = parseFloat(log.quantity);
        const branchId = log.branch_id;
        const productId = log.product_id;

        const inventoryDelta = newQty - oldQty;

        // Check current on-hand quantity
        const invRes = await client.query(
            'SELECT quantity FROM branch_inventory WHERE branch_id = $1 AND product_id = $2',
            [branchId, productId]
        );
        const currentOnHand = parseFloat(invRes.rows[0]?.quantity || 0);

        if (inventoryDelta < 0 && (currentOnHand + inventoryDelta) < 0) {
            const minAllowed = oldQty - currentOnHand;
            return res.status(400).json({
                success: false,
                message: `Data collision: Cannot reduce quantity to ${newQty}. Downstream dispatches have already used this stock. Current on-hand: ${currentOnHand}, Minimum allowed: ${minAllowed}.`
            });
        }

        await client.query('BEGIN');

        await client.query(
            'UPDATE stock_in SET quantity = $1, purchase_price = $2 WHERE id = $3',
            [newQty, newPrice, id]
        );

        await client.query(
            'UPDATE branch_inventory SET quantity = quantity + $1 WHERE branch_id = $2 AND product_id = $3',
            [inventoryDelta, branchId, productId]
        );

        await client.query('COMMIT');

        return res.json({ success: true, message: 'Inbound stock entry updated successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Delete Inbound Stock Log (with rollback threshold check)
 */
async function deleteStockIn(req, res, next) {
    const client = await db.getClient();
    try {
        const id = parseInt(req.params.id, 10);

        const logRes = await client.query('SELECT * FROM stock_in WHERE id = $1', [id]);
        if (logRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Stock-in record not found.' });
        }
        const log = logRes.rows[0];
        const qtyToRemove = parseFloat(log.quantity);
        const branchId = log.branch_id;
        const productId = log.product_id;

        const invRes = await client.query(
            'SELECT quantity FROM branch_inventory WHERE branch_id = $1 AND product_id = $2',
            [branchId, productId]
        );
        const currentOnHand = parseFloat(invRes.rows[0]?.quantity || 0);

        if (currentOnHand < qtyToRemove) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete record: Dispatches/sales have already consumed these items. Removing this log would force a negative inventory balance (On-hand: ${currentOnHand}, Attempted removal: ${qtyToRemove}).`
            });
        }

        await client.query('BEGIN');

        await client.query(
            'UPDATE branch_inventory SET quantity = quantity - $1 WHERE branch_id = $2 AND product_id = $3',
            [qtyToRemove, branchId, productId]
        );

        await client.query('DELETE FROM stock_in WHERE id = $1', [id]);

        await client.query('COMMIT');

        return res.json({ success: true, message: 'Stock-in entry removed successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Edit Outbound Stock Log (with shelf balance validation)
 */
async function editStockOut(req, res, next) {
    const client = await db.getClient();
    try {
        const id = parseInt(req.params.id, 10);
        const { quantity, sold_price } = req.body;

        const newQty = parseFloat(quantity);
        const newPrice = parseFloat(sold_price);

        if (!id || isNaN(newQty) || newQty < 0 || isNaN(newPrice) || newPrice < 0) {
            return res.status(400).json({ success: false, message: 'Valid non-negative quantity and price are required.' });
        }

        const logRes = await client.query('SELECT * FROM stock_out WHERE id = $1', [id]);
        if (logRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Sales record not found.' });
        }
        const log = logRes.rows[0];
        const oldQty = parseFloat(log.quantity);
        const branchId = log.branch_id;
        const productId = log.product_id;

        // Inventory delta: if newQty is higher, delta is negative (deduct more from shelf)
        const inventoryDelta = oldQty - newQty;

        const invRes = await client.query(
            'SELECT quantity FROM branch_inventory WHERE branch_id = $1 AND product_id = $2',
            [branchId, productId]
        );
        const currentOnHand = parseFloat(invRes.rows[0]?.quantity || 0);

        if (inventoryDelta < 0 && (currentOnHand + inventoryDelta) < 0) {
            const maxAllowed = oldQty + currentOnHand;
            return res.status(400).json({
                success: false,
                message: `Not enough stock remaining on shelves to increase sales quantity to ${newQty}. (Current on-hand: ${currentOnHand}, Maximum allowed: ${maxAllowed}).`
            });
        }

        await client.query('BEGIN');

        await client.query(
            'UPDATE stock_out SET quantity = $1, sold_price = $2 WHERE id = $3',
            [newQty, newPrice, id]
        );

        await client.query(
            'UPDATE branch_inventory SET quantity = quantity + $1 WHERE branch_id = $2 AND product_id = $3',
            [inventoryDelta, branchId, productId]
        );

        await client.query('COMMIT');

        return res.json({ success: true, message: 'Outbound sales record updated successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Delete Outbound Stock Log (restoring stock back to shelves)
 */
async function deleteStockOut(req, res, next) {
    const client = await db.getClient();
    try {
        const id = parseInt(req.params.id, 10);

        const logRes = await client.query('SELECT * FROM stock_out WHERE id = $1', [id]);
        if (logRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Sales record not found.' });
        }
        const log = logRes.rows[0];
        const qtyToRestore = parseFloat(log.quantity);
        const branchId = log.branch_id;
        const productId = log.product_id;

        await client.query('BEGIN');

        await client.query(
            'UPDATE branch_inventory SET quantity = quantity + $1 WHERE branch_id = $2 AND product_id = $3',
            [qtyToRestore, branchId, productId]
        );

        await client.query('DELETE FROM stock_out WHERE id = $1', [id]);

        await client.query('COMMIT');

        return res.json({ success: true, message: 'Sales record removed and stock restored to shelves successfully.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Delete Damaged Stock Log (restoring quantity back to branch inventory)
 */
async function deleteDamagedStock(req, res, next) {
    const client = await db.getClient();
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) {
            return res.status(400).json({ success: false, message: 'Invalid damaged stock ID.' });
        }

        const logRes = await client.query('SELECT * FROM damaged_stock WHERE id = $1', [id]);
        if (logRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Damaged stock record not found.' });
        }
        const log = logRes.rows[0];
        const qtyToRestore = parseFloat(log.quantity);
        const branchId = log.branch_id;
        const productId = log.product_id;

        await client.query('BEGIN');

        await client.query(
            'UPDATE branch_inventory SET quantity = quantity + $1 WHERE branch_id = $2 AND product_id = $3',
            [qtyToRestore, branchId, productId]
        );

        await client.query('DELETE FROM damaged_stock WHERE id = $1', [id]);

        await client.query('COMMIT');

        return res.json({ success: true, message: 'Damaged stock log removed and items restored to shelf balance.' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

module.exports = {
    getDashboardOverview,
    getBranchOperationsHub,
    editStockIn,
    deleteStockIn,
    editStockOut,
    deleteStockOut,
    deleteDamagedStock
};
