const db = require('../config/db');

/**
 * Middleware to require authenticated user session
 */
function requireAuth(req, res, next) {
    const isApi = req.originalUrl?.startsWith('/api/') || req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('json');
    if (!req.session || !req.session.user) {
        if (isApi) {
            return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
        }
        return res.redirect('/login.html');
    }
    next();
}

/**
 * Middleware to restrict route to specific roles
 * @param  {...string} roles - e.g. 'admin', 'manager', 'staff'
 */
function requireRole(...roles) {
    return (req, res, next) => {
        const isApi = req.originalUrl?.startsWith('/api/') || req.path.startsWith('/api/') || req.xhr || req.headers.accept?.includes('json');
        if (!req.session || !req.session.user) {
            if (isApi) {
                return res.status(401).json({ success: false, message: 'Authentication required.' });
            }
            return res.redirect('/login.html');
        }

        const userRole = req.session.user.role;
        if (!roles.includes(userRole)) {
            if (isApi) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Access denied: Action requires one of the following roles: [${roles.join(', ')}]` 
                });
            }
            return res.status(403).send('Forbidden: Insufficient privileges.');
        }

        next();
    };
}

/**
 * Helper to get user's assigned branches from database
 * Admins have access to all branches.
 */
async function getUserAssignedBranches(user) {
    if (user.role === 'admin') {
        const result = await db.query('SELECT * FROM branches ORDER BY name ASC');
        return {
            isAdmin: true,
            branches: result.rows,
            branchIds: result.rows.map(b => b.id)
        };
    }

    const result = await db.query(`
        SELECT b.* FROM branches b
        INNER JOIN account_branches ab ON b.id = ab.branch_id
        WHERE ab.account_id = $1
        ORDER BY b.name ASC
    `, [user.id]);

    return {
        isAdmin: false,
        branches: result.rows,
        branchIds: result.rows.map(b => b.id)
    };
}

module.exports = {
    requireAuth,
    requireRole,
    getUserAssignedBranches
};
