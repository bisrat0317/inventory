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

module.exports = {
    getAllAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    deleteAccount
};
