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

        // Fetch configured role permissions for menus
        let allowedMenus = [];
        try {
            const permRes = await db.query(
                'SELECT menu_id FROM role_permissions WHERE role = $1 AND is_enabled = true',
                [user.role]
            );
            allowedMenus = permRes.rows.map(r => r.menu_id);
        } catch (pErr) {
            // Fallback default
            if (user.role === 'admin') allowedMenus = ['dashboard', 'products', 'stock-in', 'stock-out', 'purchasing', 'reports', 'branches', 'accounts'];
            else if (user.role === 'manager') allowedMenus = ['dashboard', 'products', 'stock-in', 'stock-out', 'purchasing', 'reports'];
            else allowedMenus = ['stock-in', 'stock-out'];
        }

        return res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                assignedBranches: assignedBranches,
                branches: branchesList,
                allowedMenus: allowedMenus
            }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Handle password change for currently authenticated user
 */
async function changePassword(req, res, next) {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }

        const userId = req.session.user.id;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password, new password, and confirmation password are all required.' 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password must be at least 6 characters in length.' 
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password and confirmation password do not match.' 
            });
        }

        // Fetch current password hash
        const userRes = await db.query('SELECT password FROM accounts WHERE id = $1', [userId]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'User account not found.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, userRes.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false, 
                message: 'Current password is incorrect. Please verify and try again.' 
            });
        }

        const hashedNew = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE accounts SET password = $1 WHERE id = $2', [hashedNew, userId]);

        return res.json({
            success: true,
            message: 'Your password has been successfully updated.'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    login,
    logout,
    getSessionUser,
    changePassword
};
