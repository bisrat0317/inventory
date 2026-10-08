const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pgliteInstance = null;
let activeEngine = 'pg'; // 'pg' or 'pglite'

const poolConfig = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'inventory_db',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
    if (process.env.DATABASE_URL.includes('sslmode=') || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
        poolConfig.ssl = { rejectUnauthorized: false };
    }
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    if (activeEngine === 'pg') {
        console.error('Unexpected error on idle PostgreSQL client:', err.message);
    }
});

/**
 * Initialize embedded PostgreSQL (PGlite) fallback
 */
async function initEmbeddedPg() {
    if (!pgliteInstance) {
        const { PGlite } = require('@electric-sql/pglite');
        const dataDir = path.join(__dirname, '../db/pgdata');
        pgliteInstance = new PGlite(dataDir);
        await pgliteInstance.waitReady;
        activeEngine = 'pglite';

        // Check if schema needs to be initialized
        const tableCheck = await pgliteInstance.query(`
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'accounts'
        `);

        if (tableCheck.rows.length === 0) {
            console.log('ℹ Embedded PostgreSQL: Initializing schema and seed data...');
            const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
            await pgliteInstance.exec(schemaSql);

            const defaultPasswordHash = await bcrypt.hash('admin123', 10);
            let seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');
            seedSql = seedSql.replace(/\$2a\$10\$CwTycUXWue0Thq9StjUM0uXhT\.r9w1w0WJcW8B2u7C\/p8M0YxJXe2/g, defaultPasswordHash);
            await pgliteInstance.exec(seedSql);
            console.log('✓ Embedded PostgreSQL: Schema & Seed data successfully populated.');
        } else {
            // Ensure schema migrations are applied
            try {
                await pgliteInstance.exec('ALTER TABLE branches ADD COLUMN IF NOT EXISTS type INT NOT NULL DEFAULT 1;');
            } catch (migErr) {
                // Ignore if already exists
            }
        }
    }
    return pgliteInstance;
}

/**
 * Execute parameterized SQL query
 */
async function query(text, params = []) {
    if (activeEngine === 'pglite') {
        const res = await pgliteInstance.query(text, params);
        return {
            rows: res.rows || [],
            rowCount: res.rows ? res.rows.length : (res.affectedRows || 0),
            fields: res.fields || []
        };
    }

    try {
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        if (err.code === 'ECONNREFUSED' || err.message.includes('Connection terminated')) {
            console.log('Switching to Embedded PostgreSQL engine (PGlite)...');
            await initEmbeddedPg();
            const res = await pgliteInstance.query(text, params);
            return {
                rows: res.rows || [],
                rowCount: res.rows ? res.rows.length : (res.affectedRows || 0),
                fields: res.fields || []
            };
        }
        throw err;
    }
}

/**
 * Acquire transactional client
 */
async function getClient() {
    if (activeEngine === 'pglite') {
        return {
            query: async (text, params = []) => {
                const res = await pgliteInstance.query(text, params);
                return {
                    rows: res.rows || [],
                    rowCount: res.rows ? res.rows.length : (res.affectedRows || 0),
                    fields: res.fields || []
                };
            },
            release: () => {}
        };
    }

    try {
        const client = await pool.connect();
        return client;
    } catch (err) {
        console.log('Switching to Embedded PostgreSQL client for transaction...');
        await initEmbeddedPg();
        return {
            query: async (text, params = []) => {
                const res = await pgliteInstance.query(text, params);
                return {
                    rows: res.rows || [],
                    rowCount: res.rows ? res.rows.length : (res.affectedRows || 0),
                    fields: res.fields || []
                };
            },
            release: () => {}
        };
    }
}

/**
 * Test database connection and ensure tables exist
 */
async function testConnectionAndAutoSetup() {
    try {
        const res = await pool.query('SELECT NOW() AS current_time');
        console.log(`✓ Connected to External PostgreSQL. Server time: ${res.rows[0].current_time}`);

        const tableCheck = await pool.query(`
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'accounts'
        `);

        if (tableCheck.rowCount === 0) {
            console.log('ℹ First run detected: Initializing tables and seed data on External PostgreSQL...');
            const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
            await pool.query(schemaSql);

            const defaultPasswordHash = await bcrypt.hash('admin123', 10);
            let seedSql = fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8');
            seedSql = seedSql.replace(/\$2a\$10\$CwTycUXWue0Thq9StjUM0uXhT\.r9w1w0WJcW8B2u7C\/p8M0YxJXe2/g, defaultPasswordHash);
            await pool.query(seedSql);
            console.log('✓ Tables created and initial seed data populated successfully.');
        }
    } catch (err) {
        console.log('ℹ External PostgreSQL server not active. Activating Embedded PostgreSQL (PGlite)...');
        await initEmbeddedPg();
        console.log(`✓ Embedded PostgreSQL (PGlite) active and persistent at ./db/pgdata`);
    }
}

module.exports = {
    pool,
    query,
    getClient,
    testConnectionAndAutoSetup,
    getActiveEngine: () => activeEngine
};
