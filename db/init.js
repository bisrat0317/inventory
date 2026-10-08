const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'inventory_db',
    connectionString: process.env.DATABASE_URL
};

async function initializeDatabase() {
    console.log('Initializing PostgreSQL database...');

    let client;
    let isEmbedded = false;

    try {
        const clientOptions = dbConfig.connectionString 
            ? { connectionString: dbConfig.connectionString, ssl: { rejectUnauthorized: false } } 
            : dbConfig;
        client = new Client(clientOptions);
        await client.connect();
        console.log(`✓ Connected to External PostgreSQL database successfully.`);
    } catch (err) {
        console.log(`ℹ External PostgreSQL not accessible (${err.message}). Initializing Embedded PostgreSQL (PGlite)...`);
        const { PGlite } = require('@electric-sql/pglite');
        const dataDir = path.join(__dirname, 'pgdata');
        const pglite = new PGlite(dataDir);
        await pglite.waitReady;
        isEmbedded = true;
        client = {
            query: async (q) => pglite.exec(q),
            end: async () => {}
        };
        console.log(`✓ Embedded PostgreSQL (PGlite) active at ${dataDir}`);
    }

    try {
        // Read and execute Schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('✓ Database schema (tables, constraints, indices) applied successfully.');

        // Hash default password for seeds
        const defaultPasswordHash = await bcrypt.hash('admin123', 10);

        // Read and execute Seed
        const seedPath = path.join(__dirname, 'seed.sql');
        let seedSql = fs.readFileSync(seedPath, 'utf8');
        seedSql = seedSql.replace(/\$2a\$10\$CwTycUXWue0Thq9StjUM0uXhT\.r9w1w0WJcW8B2u7C\/p8M0YxJXe2/g, defaultPasswordHash);

        await client.query(seedSql);
        console.log('✓ Seed data (units, branches, accounts, products, stock logs) inserted successfully.');
        console.log('\nDefault Test Accounts:');
        console.log('  - Admin:   username: admin   | password: admin123  (Global Access)');
        console.log('  - Manager: username: manager | password: admin123  (Branches 2 & 3)');
        console.log('  - Staff:   username: staff   | password: admin123  (Branch 2)');

    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    } finally {
        if (!isEmbedded && client && client.end) {
            await client.end().catch(() => {});
        }
    }
}

if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };
