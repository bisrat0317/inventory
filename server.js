const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const branchRoutes = require('./routes/branchRoutes');
const productRoutes = require('./routes/productRoutes');
const stockRoutes = require('./routes/stockRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable trust proxy for Vercel / serverless reverse proxies
app.set('trust proxy', 1);

// Security & Parsing Middlewares
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Store (PostgreSQL persistent session for Vercel Serverless)
let sessionStore;
if (process.env.DATABASE_URL || db.pool) {
    try {
        sessionStore = new PgSession({
            pool: db.pool,
            tableName: 'session',
            createTableIfMissing: true
        });
    } catch (e) {
        console.warn('PgSession initialization fallback to memory store');
    }
}

// Session Management
app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'inventory_system_production_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: 'auto',
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve Static Frontend Assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

// Root Navigation Handler
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.redirect('/login.html');
    }
});

// Catch-all route to serve Single Page Application
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        if (req.path.endsWith('.html') || req.path.includes('.')) {
            return next();
        }
        return res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found.' });
    }
    next();
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server locally & Auto-Check PostgreSQL connection
if (!process.env.VERCEL) {
    app.listen(PORT, async () => {
        console.log(`\n========================================================`);
        console.log(`🚀 Inventory System Server running at http://localhost:${PORT}`);
        console.log(`   Database: PostgreSQL (${process.env.PGDATABASE || 'inventory_db'})`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`========================================================\n`);

        await db.testConnectionAndAutoSetup();
    });
}

module.exports = app;
