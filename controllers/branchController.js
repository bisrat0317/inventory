const db = require('../config/db');

/**
 * Get all branches with on-floor inventory totals
 */
async function getAllBranches(req, res, next) {
    try {
        const query = `
            SELECT 
                b.id, 
                b.name, 
                b.location, 
                COALESCE(b.type, 1) AS type,
                b.created_at,
                COALESCE(SUM(bi.quantity), 0)::numeric(12, 2) AS global_units_on_floor
            FROM branches b
            LEFT JOIN branch_inventory bi ON b.id = bi.branch_id
            GROUP BY b.id, b.name, b.location, b.type, b.created_at
            ORDER BY b.name ASC
        `;
        const result = await db.query(query);

        return res.json({
            success: true,
            branches: result.rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get a specific branch by ID
 */
async function getBranchById(req, res, next) {
    try {
        const branchId = parseInt(req.params.id, 10);
        const result = await db.query('SELECT id, name, location, COALESCE(type, 1) AS type, created_at FROM branches WHERE id = $1', [branchId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Branch not found.' });
        }

        return res.json({
            success: true,
            branch: result.rows[0]
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Provision a new branch node
 */
async function createBranch(req, res, next) {
    try {
        const { name, location, type } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Branch name is strictly required.' });
        }

        const branchType = parseInt(type, 10) || 1;

        const insertRes = await db.query(
            'INSERT INTO branches (name, location, type) VALUES ($1, $2, $3) RETURNING id, name, location, type',
            [name.trim(), location ? location.trim() : null, branchType]
        );

        return res.status(201).json({
            success: true,
            message: `Branch node '${name.trim()}' provisioned successfully.`,
            branch: insertRes.rows[0]
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update an existing branch node
 */
async function updateBranch(req, res, next) {
    try {
        const branchId = parseInt(req.params.id, 10);
        const { name, location, type } = req.body;

        if (!branchId || !name || name.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Valid branch ID and name are required.' });
        }

        const branchType = parseInt(type, 10) || 1;

        const updateRes = await db.query(
            'UPDATE branches SET name = $1, location = $2, type = $3 WHERE id = $4 RETURNING id, name, location, type',
            [name.trim(), location ? location.trim() : null, branchType, branchId]
        );

        if (updateRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Branch node not found.' });
        }

        return res.json({
            success: true,
            message: 'Branch specifications updated successfully.',
            branch: updateRes.rows[0]
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Delete a branch (with inventory dependency safeguard)
 */
async function deleteBranch(req, res, next) {
    try {
        const branchId = parseInt(req.params.id, 10);

        if (!branchId) {
            return res.status(400).json({ success: false, message: 'Invalid branch ID.' });
        }

        // Safety check: Ensure no active items with quantity > 0 remain in branch_inventory
        const invCheck = await db.query(
            'SELECT COALESCE(SUM(quantity), 0) AS total_qty FROM branch_inventory WHERE branch_id = $1',
            [branchId]
        );

        const activeQty = parseFloat(invCheck.rows[0]?.total_qty || 0);
        if (activeQty > 0) {
            return res.status(400).json({
                success: false,
                message: `Cascade protection triggered: Cannot delete branch containing active inventory balances (${activeQty} units). Deplete or transfer balances before removing.`
            });
        }

        const deleteRes = await db.query('DELETE FROM branches WHERE id = $1', [branchId]);

        if (deleteRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Branch node not found.' });
        }

        return res.json({
            success: true,
            message: 'Branch node removed from system topology successfully.'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllBranches,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch
};
