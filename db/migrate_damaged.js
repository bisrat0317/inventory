const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running migration: Creating damaged_stock table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS damaged_stock (
                id SERIAL PRIMARY KEY,
                branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
                product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
                quantity NUMERIC(12, 4) NOT NULL,
                unit_id INT REFERENCES units (id) ON DELETE SET NULL,
                conversion_factor NUMERIC(12, 4) DEFAULT 1.0,
                input_quantity NUMERIC(12, 4),
                reason TEXT,
                date DATE NOT NULL DEFAULT CURRENT_DATE,
                reported_by VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_damaged_stock_branch_date ON damaged_stock (branch_id, date);
        `);
        console.log('Migration successful: damaged_stock table and indices ready!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit(0);
    }
}

migrate();
