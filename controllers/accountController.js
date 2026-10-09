const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * List all user accounts with their assigned branches
 */
async function getAllAccounts(req, res, next) {
    try {
        const query = `
            SELECT 
                a.id, 
                a.username, 
                a.email, 
                a.role, 
                a.created_at,
                COALESCE(STRING_AGG(ab.branch_id::text, ','), '') AS branch_ids,
                COALESCE(STRING_AGG(b.name, ', '), '') AS branch_names
            FROM accounts a
            LEFT JOIN account_branches ab ON a.id = ab.account_id
            LEFT JOIN branches b ON ab.branch_id = b.id
            GROUP BY a.id, a.username, a.email, a.role, a.created_at
            ORDER BY a.username ASC
        `;
        const result = await db.query(query);

        // Fetch all active branches for selection reference
        const branchesRes = await db.query('SELECT id, name FROM branches ORDER BY name ASC');

        return res.json({
            success: true,
            accounts: result.rows,
            availableBranches: branchesRes.rows
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get account details by ID
 */
async function getAccountById(req, res, next) {
    try {
        const userId = parseInt(req.params.id, 10);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid user ID.' });
        }

        const userRes = await db.query('SELECT id, username, email, role, created_at FROM accounts WHERE id = $1', [userId]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }

        const account = userRes.rows[0];

        // Fetch assigned branch IDs
        const branchRes = await db.query('SELECT branch_id FROM account_branches WHERE account_id = $1', [userId]);
        account.branch_ids = branchRes.rows.map(r => r.branch_id);

        return res.json({
            success: true,
            account
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Create a new user account with branch assignments
 */
async function createAccount(req, res, next) {
    const client = await db.getClient();
    try {
        const { username, email, password, role, branches } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const validRoles = ['admin', 'manager', 'staff'];
        const userRole = validRoles.includes(role) ? role : 'staff';

        // Check if username already exists
        const existing = await client.query('SELECT id FROM accounts WHERE LOWER(username) = LOWER($1)', [username.trim()]);
        if (existing.rowCount > 0) {
            return res.status(400).json({ success: false, message: 'Username is already taken by another account.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await client.query('BEGIN');

        const insertRes = await client.query(
            'INSERT INTO accounts (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
            [username.trim(), email ? email.trim() : null, hashedPassword, userRole]
        );
        const newUserId = insertRes.rows[0].id;

        // Assign branches for non-admin accounts
        if (userRole !== 'admin' && Array.isArray(branches) && branches.length > 0) {
            for (const branchId of branches) {
                const bId = parseInt(branchId, 10);
                if (bId) {
                    await client.query(
                        'INSERT INTO account_branches (account_id, branch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [newUserId, bId]
                    );
                }
            }
        }

        await client.query('COMMIT');

        return res.status(201).json({
            success: true,
            message: `Account created successfully for ${username}.`,
            userId: newUserId
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Update an existing user account
 */
async function updateAccount(req, res, next) {
    const client = await db.getClient();
    try {
        const userId = parseInt(req.params.id, 10);
        const { username, email, password, role, branches } = req.body;

        if (!userId || !username) {
            return res.status(400).json({ success: false, message: 'Valid user ID and username are required.' });
        }

        const validRoles = ['admin', 'manager', 'staff'];
        const userRole = validRoles.includes(role) ? role : 'staff';

        // Check for duplicate username
        const duplicateCheck = await client.query(
            'SELECT id FROM accounts WHERE LOWER(username) = LOWER($1) AND id != $2',
            [username.trim(), userId]
        );
        if (duplicateCheck.rowCount > 0) {
            return res.status(400).json({ success: false, message: 'Username is already taken by another account.' });
        }

        await client.query('BEGIN');

        if (password && password.trim().length > 0) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await client.query(
                'UPDATE accounts SET username = $1, email = $2, password = $3, role = $4 WHERE id = $5',
                [username.trim(), email ? email.trim() : null, hashedPassword, userRole, userId]
            );
        } else {
            await client.query(
                'UPDATE accounts SET username = $1, email = $2, role = $3 WHERE id = $4',
                [username.trim(), email ? email.trim() : null, userRole, userId]
            );
        }

        // Reset branch mappings
        await client.query('DELETE FROM account_branches WHERE account_id = $1', [userId]);

        // Insert new branch mappings
        if (userRole !== 'admin' && Array.isArray(branches) && branches.length > 0) {
            for (const branchId of branches) {
                const bId = parseInt(branchId, 10);
                if (bId) {
                    await client.query(
                        'INSERT INTO account_branches (account_id, branch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [userId, bId]
                    );
                }
            }
        }

        await client.query('COMMIT');

        return res.json({
            success: true,
            message: 'Account profile updated successfully.'
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Delete a user account (with self-deletion protection)
 */
async function deleteAccount(req, res, next) {
    try {
        const userId = parseInt(req.params.id, 10);
        const currentUserId = req.session.user?.id;

        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Self-deletion prohibited: You cannot delete your own active session.'
            });
        }

        const deleteRes = await db.query('DELETE FROM accounts WHERE id = $1', [userId]);

        if (deleteRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Account not found.' });
        }

        return res.json({
            success: true,
            message: 'Account successfully removed from system databases.'
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Get all role menu permissions
 */
async function getRolePermissions(req, res, next) {
    try {
        const query = 'SELECT role, menu_id, is_enabled FROM role_permissions ORDER BY role ASC, menu_id ASC';
        const result = await db.query(query);

        const menus = [
            { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Executive analytics & live facility oversight' },
            { id: 'products', label: 'Products', icon: '📦', description: 'Product catalog, brands & units management' },
            { id: 'stock-in', label: 'Stock In', icon: '📥', description: 'Inbound deliveries, unit conversions & intake' },
            { id: 'stock-out', label: 'Stock Out', icon: '📤', description: 'FIFO sales dispatch, shelf stock & audit logs' },
            { id: 'purchasing', label: 'Purchasing', icon: '🛒', description: 'Requisitions, order manifests & draft cache' },
            { id: 'reports', label: 'Reports', icon: '📈', description: 'Profit & Loss, COGS, trends & shelf valuation' },
            { id: 'branches', label: 'Branches', icon: '🏢', description: 'Facility locations & warehouse management' },
            { id: 'accounts', label: 'Accounts', icon: '👥', description: 'User accounts, passwords & role permissions' }
        ];

        const permissions = {
            admin: {},
            manager: {},
            staff: {}
        };

        result.rows.forEach(r => {
            if (!permissions[r.role]) permissions[r.role] = {};
            permissions[r.role][r.menu_id] = Boolean(r.is_enabled);
        });

        return res.json({
            success: true,
            roles: ['admin', 'manager', 'staff'],
            menus,
            permissions
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Update role menu permissions
 */
async function updateRolePermissions(req, res, next) {
    const client = await db.getClient();
    try {
        const { role, permissions } = req.body;

        if (!role || !permissions || typeof permissions !== 'object') {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid role and permissions map are required.' 
            });
        }

        await client.query('BEGIN');

        for (const [menuId, isEnabled] of Object.entries(permissions)) {
            await client.query(
                `INSERT INTO role_permissions (role, menu_id, is_enabled) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (role, menu_id) 
                 DO UPDATE SET is_enabled = EXCLUDED.is_enabled`,
                [role, menuId, Boolean(isEnabled)]
            );
        }

        await client.query('COMMIT');

        return res.json({
            success: true,
            message: `Menu permissions for role '${role.toUpperCase()}' successfully updated.`
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
}

/**
 * Admin change password for any user account
 */
async function adminChangePassword(req, res, next) {
    try {
        const userId = parseInt(req.params.id, 10);
        const { newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'User ID and new password are required.' 
            });
        }

        if (newPassword.trim().length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters in length.' 
            });
        }

        // Fetch account
        const userRes = await db.query('SELECT id, username FROM accounts WHERE id = $1', [userId]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User account not found.' });
        }

        const username = userRes.rows[0].username;
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);

        await db.query('UPDATE accounts SET password = $1 WHERE id = $2', [hashedPassword, userId]);

        return res.json({
            success: true,
            message: `Password for account '${username}' updated successfully.`
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount,
    getRolePermissions,
    updateRolePermissions,
    adminChangePassword
};
