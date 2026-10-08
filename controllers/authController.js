const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Handle user login
 */
async function login(req, res, next) {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Username and password are required.' });
        }

        const userResult = await db.query(
            'SELECT id, username, email, password, role FROM accounts WHERE LOWER(username) = LOWER($1) LIMIT 1',
            [username.trim()]
        );

        if (userResult.rowCount === 0) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid username or password.' });
        }

        // Fetch assigned branches for non-admin users
        let assignedBranches = [];
        if (user.role !== 'admin') {
            const branchResult = await db.query(
                'SELECT branch_id FROM account_branches WHERE account_id = $1',
                [user.id]
            );
            assignedBranches = branchResult.rows.map(r => r.branch_id);
        }

        // Establish session
        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            assignedBranches: assignedBranches
        };

        req.session.save((saveErr) => {
            if (saveErr) {
                return next(saveErr);
            }
            return res.json({
                success: true,
                message: 'Login successful.',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    assignedBranches: assignedBranches
                }
            });
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Handle user logout
 */
function logout(req, res, next) {
    req.session.destroy((err) => {
        if (err) {
            return next(err);
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logged out successfully.' });
    });
}

/**
 * Get current authenticated user details and assigned branches
 */
async function getSessionUser(req, res, next) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, user: null });
        }

        // Refresh user info from database in case roles/branches were updated
        const userResult = await db.query(
            'SELECT id, username, email, role, created_at FROM accounts WHERE id = $1',
            [req.session.user.id]
        );

        if (userResult.rowCount === 0) {
            req.session.destroy();
            return res.status(401).json({ success: false, user: null });
        }

        const user = userResult.rows[0];
        let assignedBranches = [];
        let branchesList = [];

        if (user.role === 'admin') {
            const allBranches = await db.query('SELECT id, name, location FROM branches ORDER BY name ASC');
            branchesList = allBranches.rows;
            assignedBranches = allBranches.rows.map(b => b.id);
        } else {
            const mappedBranches = await db.query(`
                SELECT b.id, b.name, b.location FROM branches b
                INNER JOIN account_branches ab ON b.id = ab.branch_id
                WHERE ab.account_id = $1
                ORDER BY b.name ASC
            `, [user.id]);
            branchesList = mappedBranches.rows;
            assignedBranches = mappedBranches.rows.map(b => b.id);
        }

        req.session.user.assignedBranches = assignedBranches;

        return res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                assignedBranches: assignedBranches,
                branches: branchesList
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    login,
    logout,
    getSessionUser
};
