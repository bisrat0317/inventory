-- Seed Data for Inventory System

-- 1. Units of Measure
INSERT INTO
    units (id, name, symbol)
VALUES (1, 'Piece', 'pcs'),
    (2, 'Meter', 'm'),
    (3, 'Kilogram', 'kg'),
    (4, 'Box', 'box'),
    (5, 'Roll', 'roll'),
    (6, 'Liter', 'L'),
    (7, 'Set', 'set'),
    (8, 'Sack', 'sck'),
    (9, 'Bag', 'bag'),
    (10, 'Quintal', 'qtl'),
    (11, 'Ton', 't'),
    (12, 'Square Meter', 'sqm'),
    (13, 'Cubic Meter', 'cbm'),
    (14, 'Pack', 'pk'),
    (15, 'Carton', 'ctn') ON CONFLICT (id) DO
UPDATE
SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol;

SELECT setval ( 'units_id_seq', ( SELECT MAX(id) FROM units ) );

-- 2. Branches
INSERT INTO
    branches (id, name, location)
VALUES (
        1,
        'Main Central Warehouse',
        '100 Logistics Blvd, Industrial Zone'
    ),
    (
        2,
        'Downtown Mobile & Electronics Hub',
        '45 Commercial St, City Center'
    ),
    (
        3,
        'Northside Construction Depot',
        '880 Builder Highway, North District'
    ) ON CONFLICT (id) DO
UPDATE
SET
    name = EXCLUDED.name,
    location = EXCLUDED.location;

SELECT setval ( 'branches_id_seq', ( SELECT MAX(id) FROM branches ) );

-- 3. Default Accounts
-- Default password for all seeded accounts is: admin123
-- Bcrypt hash ($2a$10$7zB3VvP7K7rA7UqB8dF8qu1R0mK.T0EaK9b1sR8yL0O/1f4m4cR1u -> generated dynamically in init.js or standard)
INSERT INTO
    accounts (
        id,
        username,
        email,
        password,
        role
    )
VALUES (
        1,
        'admin',
        'admin@inventory.local',
        '$2a$10$CwTycUXWue0Thq9StjUM0uXhT.r9w1w0WJcW8B2u7C/p8M0YxJXe2',
        'admin'
    ),
    (
        2,
        'manager',
        'manager@inventory.local',
        '$2a$10$CwTycUXWue0Thq9StjUM0uXhT.r9w1w0WJcW8B2u7C/p8M0YxJXe2',
        'manager'
    ),
    (
        3,
        'staff',
        'staff@inventory.local',
        '$2a$10$CwTycUXWue0Thq9StjUM0uXhT.r9w1w0WJcW8B2u7C/p8M0YxJXe2',
        'staff'
    ) ON CONFLICT (id) DO
UPDATE
SET
    username = EXCLUDED.username,
    role = EXCLUDED.role;

SELECT setval ( 'accounts_id_seq', ( SELECT MAX(id) FROM accounts ) );

-- 4. Assign Branches to Staff/Manager
INSERT INTO
    account_branches (account_id, branch_id)
VALUES (2, 2),
    (2, 3),
    (3, 2) ON CONFLICT DO NOTHING;

-- 5. Products Catalog
INSERT INTO
    products (
        id,
        name,
        type,
        brand,
        unit_id,
        description,
        color,
        is_deleted
    )
VALUES (
        1,
        'Cat6 High-Speed Network Cable',
        1,
        'Cisco Systems',
        2,
        'High performance 550MHz copper ethernet cable for data centers',
        '#2c7be5',
        0
    ),
    (
        2,
        '5G Enterprise WiFi 6 Router',
        1,
        'TP-Link',
        1,
        'Dual-band gigabit wireless router with multi-beamforming antennas',
        '#10b981',
        0
    ),
    (
        3,
        'Industrial Fast-Curing Cement Grade 42.5',
        2,
        'Holcim',
        3,
        'Heavy-duty hydraulic binder for foundations and precast concrete',
        '#64748b',
        0
    ),
    (
        4,
        'Structural Deformed Steel Rebar 16mm',
        2,
        'ArcelorMittal',
        2,
        'High-tensile reinforcement steel bar for structural frameworks',
        '#f59e0b',
        0
    ),
    (
        5,
        'Smart 4K UHD Display Monitor 32"',
        1,
        'Dell Technologies',
        1,
        'Ultra-sharp IPS workstation screen with USB-C 90W power delivery',
        '#3b82f6',
        0
    ),
    (
        6,
        'Architectural Waterproof Primer 20L',
        2,
        'Dulux Pro',
        6,
        'Deep-penetrating acrylic masonry sealer for interior and exterior walls',
        '#ef4444',
        0
    ) ON CONFLICT (id) DO
UPDATE
SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand;

SELECT setval ( 'products_id_seq', ( SELECT MAX(id) FROM products ) );

-- 6. Initial Unit Conversions (e.g., 1 Box of Cable = 100 Meters)
INSERT INTO
    unit_conversions (
        product_id,
        from_unit_id,
        to_unit_id,
        factor
    )
VALUES (1, 4, 2, 100.0000), -- 1 Box = 100 Meters
    (3, 4, 3, 50.0000) -- 1 Bag/Box = 50 Kg
    ON CONFLICT (
        product_id,
        from_unit_id,
        to_unit_id
    ) DO
UPDATE
SET
    factor = EXCLUDED.factor;

-- 7. Initial Live Inventory Balances
INSERT INTO
    branch_inventory (
        branch_id,
        product_id,
        quantity
    )
VALUES (1, 1, 350.00),
    (1, 2, 28.00),
    (1, 3, 120.00),
    (1, 4, 450.00),
    (2, 1, 150.00),
    (2, 2, 12.00),
    (2, 5, 8.00),
    (3, 3, 85.00),
    (3, 4, 210.00),
    (3, 6, 14.00) ON CONFLICT (branch_id, product_id) DO
UPDATE
SET
    quantity = EXCLUDED.quantity;

-- 8. Initial Stock In Records
INSERT INTO
    stock_in (
        branch_id,
        product_id,
        quantity,
        purchase_price,
        date,
        unit_type,
        conversion_factor,
        bulk_quantity,
        quantity_remaining
    )
VALUES (
        1,
        1,
        500.00,
        750.00,
        CURRENT_DATE - INTERVAL '10 days',
        'm',
        1.0,
        500.0,
        350.00
    ),
    (
        1,
        2,
        30.00,
        1800.00,
        CURRENT_DATE - INTERVAL '8 days',
        'pcs',
        1.0,
        30.0,
        28.00
    ),
    (
        1,
        3,
        200.00,
        1600.00,
        CURRENT_DATE - INTERVAL '7 days',
        'kg',
        1.0,
        200.0,
        120.00
    ),
    (
        2,
        1,
        200.00,
        320.00,
        CURRENT_DATE - INTERVAL '5 days',
        'm',
        1.0,
        200.0,
        150.00
    ),
    (
        2,
        2,
        15.00,
        950.00,
        CURRENT_DATE - INTERVAL '4 days',
        'pcs',
        1.0,
        15.0,
        12.00
    ),
    (
        2,
        5,
        10.00,
        3200.00,
        CURRENT_DATE - INTERVAL '3 days',
        'pcs',
        1.0,
        10.0,
        8.00
    ),
    (
        3,
        3,
        100.00,
        850.00,
        CURRENT_DATE - INTERVAL '6 days',
        'kg',
        1.0,
        100.0,
        85.00
    ),
    (
        3,
        4,
        250.00,
        2200.00,
        CURRENT_DATE - INTERVAL '5 days',
        'm',
        1.0,
        250.0,
        210.00
    ),
    (
        3,
        6,
        20.00,
        600.00,
        CURRENT_DATE - INTERVAL '2 days',
        'L',
        1.0,
        20.0,
        14.00
    ) ON CONFLICT DO NOTHING;

-- 9. Initial Stock Out Records
INSERT INTO
    stock_out (
        branch_id,
        product_id,
        quantity,
        sold_price,
        date
    )
VALUES (
        1,
        1,
        150.00,
        350.00,
        CURRENT_DATE - INTERVAL '3 days'
    ),
    (
        1,
        2,
        2.00,
        190.00,
        CURRENT_DATE - INTERVAL '2 days'
    ),
    (
        1,
        3,
        80.00,
        900.00,
        CURRENT_DATE - INTERVAL '1 day'
    ),
    (
        2,
        1,
        50.00,
        120.00,
        CURRENT_DATE - INTERVAL '1 day'
    ),
    (
        2,
        2,
        3.00,
        285.00,
        CURRENT_DATE
    ),
    (
        2,
        5,
        2.00,
        850.00,
        CURRENT_DATE
    ),
    (
        3,
        3,
        15.00,
        180.00,
        CURRENT_DATE
    ),
    (
        3,
        4,
        40.00,
        480.00,
        CURRENT_DATE
    ),
    (
        3,
        6,
        6.00,
        240.00,
        CURRENT_DATE
    ) ON CONFLICT DO NOTHING;