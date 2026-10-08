/**
 * Centralized API Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;
