-- PostgreSQL Schema for Inventory System

-- 1. Measurement Units
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(20) NOT NULL UNIQUE
);

-- 2. Branches
CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Accounts / Users
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. User Branch Assignments
CREATE TABLE IF NOT EXISTS account_branches (
    account_id INT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
    branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    PRIMARY KEY (account_id, branch_id)
);

-- 5. Products Catalog
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type INT NOT NULL DEFAULT 1, -- 1: Electronics, 2: Construction
    brand VARCHAR(100) NOT NULL,
    unit_id INT REFERENCES units (id) ON DELETE SET NULL,
    description TEXT,
    color VARCHAR(50),
    is_deleted INT NOT NULL DEFAULT 0, -- 0: Active, 1: Soft-deleted/Archived
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Unit Conversions
CREATE TABLE IF NOT EXISTS unit_conversions (
    product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    from_unit_id INT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
    to_unit_id INT NOT NULL REFERENCES units (id) ON DELETE CASCADE,
    factor NUMERIC(12, 4) NOT NULL DEFAULT 1.0,
    PRIMARY KEY (
        product_id,
        from_unit_id,
        to_unit_id
    )
);

-- 7. Branch Inventory (Current live balances on hand)
CREATE TABLE IF NOT EXISTS branch_inventory (
    branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity NUMERIC(12, 4) NOT NULL DEFAULT 0.0,
    PRIMARY KEY (branch_id, product_id)
);

-- 8. Stock In (Inbound deliveries / purchases)
CREATE TABLE IF NOT EXISTS stock_in (
    id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity NUMERIC(12, 4) NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    unit_type VARCHAR(20),
    conversion_factor NUMERIC(12, 4) DEFAULT 1.0,
    bulk_quantity NUMERIC(12, 4),
    quantity_remaining NUMERIC(12, 4),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Stock Out (Outbound sales / dispatches)
CREATE TABLE IF NOT EXISTS stock_out (
    id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity NUMERIC(12, 4) NOT NULL,
    sold_price NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Stock Out Batches (FIFO Traceability)
CREATE TABLE IF NOT EXISTS stock_out_batches (
    id SERIAL PRIMARY KEY,
    stock_out_id INT NOT NULL REFERENCES stock_out (id) ON DELETE CASCADE,
    stock_in_id INT REFERENCES stock_in (id) ON DELETE SET NULL,
    quantity_allocated NUMERIC(12, 4) NOT NULL
);

-- Indices for high performance queries
CREATE INDEX IF NOT EXISTS idx_products_is_deleted ON products (is_deleted);

CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);

CREATE INDEX IF NOT EXISTS idx_products_brand_name ON products (brand, name);

CREATE INDEX IF NOT EXISTS idx_stock_in_branch_date ON stock_in (branch_id, date);

CREATE INDEX IF NOT EXISTS idx_stock_in_remaining ON stock_in (
    branch_id,
    product_id,
    quantity_remaining
);

CREATE INDEX IF NOT EXISTS idx_stock_out_branch_date ON stock_out (branch_id, date);

CREATE INDEX IF NOT EXISTS idx_branch_inventory_qty ON branch_inventory (quantity);