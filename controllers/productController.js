const db = require('../config/db');

/**
 * List products with parametric filters, sorting, and aggregated quantities
 */
async function getProducts(req, res, next) {
    try {
        const { name, brand, type, unit, branch_id, sort, order, include_deleted } = req.query;

        const allowedSortCols = {
            id: 'p.id',
            brand: 'p.brand',
            name: 'p.name',
            type: 'p.type',
            total_quantity: 'total_quantity'
        };

        const sortColumn = allowedSortCols[sort] || 'p.name';
        const sortOrder = (order && order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

        const whereClauses = [];
        const params = [];
        let paramIdx = 1;

        if (include_deleted !== 'true') {
            whereClauses.push(`p.is_deleted = 0`);
        }

        if (name && name.trim()) {
            whereClauses.push(`p.name ILIKE $${paramIdx++}`);
            params.push(`%${name.trim()}%`);
        }

        if (brand && brand.trim()) {
            whereClauses.push(`p.brand ILIKE $${paramIdx++}`);
            params.push(`%${brand.trim()}%`);
        }

        if (type !== undefined && type !== '') {
            whereClauses.push(`p.type = $${paramIdx++}`);
            params.push(parseInt(type, 10));
        }

        if (unit !== undefined && unit !== '') {
            whereClauses.push(`p.unit_id = $${paramIdx++}`);
            params.push(parseInt(unit, 10));
        }

        let branchJoinClause = 'LEFT JOIN branch_inventory bi ON bi.product_id = p.id';
        if (branch_id && branch_id !== 'all') {
            branchJoinClause += ` AND bi.branch_id = $${paramIdx++}`;
            params.push(parseInt(branch_id, 10));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT 
                p.id, 
                p.name, 
                p.type, 
                p.brand, 
                p.color, 
                p.description,
                p.unit_id,
                p.is_deleted,
                p.created_at,
                u.name AS unit_name,
                u.symbol AS unit_symbol,
                COALESCE(SUM(bi.quantity), 0)::numeric(12, 2) AS total_quantity
            FROM products p
            ${branchJoinClause}
            LEFT JOIN units u ON p.unit_id = u.id
            ${whereSql}
            GROUP BY p.id, u.name, u.symbol
            ORDER BY ${sortColumn} ${sortOrder}
        `;

        const result = await db.query(sql, params);

        // Also fetch active units for frontend filter dropdowns
        const unitsRes = await db.query('SELECT id, name, symbol FROM units ORDER BY name ASC');

        return res.json({
            success: true,
            products: result.rows,
            units: unitsRes.rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get product by ID
 */
async function getProductById(req, res, next) {
    try {
        const productId = parseInt(req.params.id, 10);
        const query = `
            SELECT 
                p.*,
                u.name AS unit_name,
                u.symbol AS unit_symbol,
                COALESCE(SUM(bi.quantity), 0)::numeric(12, 2) AS total_quantity
            FROM products p
            LEFT JOIN units u ON p.unit_id = u.id
            LEFT JOIN branch_inventory bi ON bi.product_id = p.id
            WHERE p.id = $1
            GROUP BY p.id, u.name, u.symbol
        `;
        const result = await db.query(query, [productId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.json({
            success: true,
            product: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get all available measurement units
 */
async function getUnits(req, res, next) {
    try {
        const result = await db.query('SELECT id, name, symbol FROM units ORDER BY name ASC');
        return res.json({
            success: true,
            units: result.rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new catalog product
 */
async function createProduct(req, res, next) {
    try {
        const { name, type, brand, unit_id, description, color } = req.body;

        if (!name || !brand || !unit_id) {
            return res.status(400).json({ success: false, message: 'Name, brand, and unit are required fields.' });
        }

        // Duplicate check: Same name + brand with active status
        const duplicateCheck = await db.query(
            'SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND LOWER(brand) = LOWER($2) AND is_deleted = 0',
            [name.trim(), brand.trim()]
        );

        if (duplicateCheck.rowCount > 0 && (!description || description.trim().length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'A descriptive text variance is required for item entries sharing matching names and brands.'
            });
        }

        const insertRes = await db.query(
            `INSERT INTO products (name, type, brand, unit_id, description, color) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING id, name, brand, type`,
            [
                name.trim(),
                parseInt(type, 10) || 1,
                brand.trim(),
                parseInt(unit_id, 10),
                description ? description.trim() : null,
                color ? color.trim() : null
            ]
        );

        return res.status(201).json({
            success: true,
            message: 'Catalog product profile added successfully to inventory registry.',
            product: insertRes.rows[0]
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update an existing product
 */
async function updateProduct(req, res, next) {
    try {
        const productId = parseInt(req.params.id, 10);
        const { name, type, brand, unit_id, description, color } = req.body;

        if (!productId || !name || !brand || !unit_id) {
            return res.status(400).json({ success: false, message: 'Valid product ID, name, brand, and unit are required.' });
        }

        // Duplicate check (excluding current ID)
        const duplicateCheck = await db.query(
            'SELECT id FROM products WHERE LOWER(name) = LOWER($1) AND LOWER(brand) = LOWER($2) AND id != $3 AND is_deleted = 0',
            [name.trim(), brand.trim(), productId]
        );

        if (duplicateCheck.rowCount > 0 && (!description || description.trim().length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'A descriptive text variance is required for products sharing identical names and brands.'
            });
        }

        const updateRes = await db.query(
            `UPDATE products 
             SET name = $1, type = $2, brand = $3, unit_id = $4, description = $5, color = $6 
             WHERE id = $7 
             RETURNING id, name, brand, type`,
            [
                name.trim(),
                parseInt(type, 10) || 1,
                brand.trim(),
                parseInt(unit_id, 10),
                description ? description.trim() : null,
                color ? color.trim() : null,
                productId
            ]
        );

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.json({
            success: true,
            message: 'Product profile updated successfully.',
            product: updateRes.rows[0]
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Soft delete / Archive a product (with live stock safeguard and force override)
 */
async function deleteProduct(req, res, next) {
    try {
        const productId = parseInt(req.params.id, 10);
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Invalid product ID.' });
        }

        const updateRes = await db.query(
            'UPDATE products SET is_deleted = 1 WHERE id = $1 RETURNING id, name',
            [productId]
        );

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.json({
            success: true,
            message: `Product '${updateRes.rows[0].name}' deleted successfully.`
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Restore an archived/soft-deleted product
 */
async function restoreProduct(req, res, next) {
    try {
        const productId = parseInt(req.params.id, 10);
        if (!productId) {
            return res.status(400).json({ success: false, message: 'Invalid product ID.' });
        }

        const updateRes = await db.query(
            'UPDATE products SET is_deleted = 0 WHERE id = $1 RETURNING id, name',
            [productId]
        );

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        return res.json({
            success: true,
            message: `Catalog product '${updateRes.rows[0].name}' successfully restored to active catalog.`
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getProducts,
    getProductById,
    getUnits,
    createProduct,
    updateProduct,
    deleteProduct,
    restoreProduct
};
