const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running migration: Creating stock_transfers table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS stock_transfers (
                id SERIAL PRIMARY KEY,
                from_branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
                to_branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
                product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
                quantity NUMERIC(12, 4) NOT NULL,
                unit_id INT REFERENCES units (id) ON DELETE SET NULL,
                conversion_factor NUMERIC(12, 4) DEFAULT 1.0,
                input_quantity NUMERIC(12, 4),
                notes TEXT,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                transferred_by VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_stock_transfers_from_date ON stock_transfers (from_branch_id, date);
            CREATE INDEX IF NOT EXISTS idx_stock_transfers_to_date ON stock_transfers (to_branch_id, date);
        `);
        console.log('Migration successful: stock_transfers table and indices ready!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
