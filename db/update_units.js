const db = require('../config/db');

async function run() {
  try {
    // 1. Ensure type column on branches table
    await db.query('ALTER TABLE branches ADD COLUMN IF NOT EXISTS type INT NOT NULL DEFAULT 1;');
    console.log('✓ Added/verified type column on branches');

    // 2. Insert new units of measure
    const newUnits = [
      { name: 'Sack', symbol: 'sck' },
      { name: 'Bag', symbol: 'bag' },
      { name: 'Quintal', symbol: 'qtl' },
      { name: 'Ton', symbol: 't' },
      { name: 'Square Meter', symbol: 'sqm' },
      { name: 'Cubic Meter', symbol: 'cbm' },
      { name: 'Pack', symbol: 'pk' },
      { name: 'Carton', symbol: 'ctn' }
    ];

    for (const u of newUnits) {
      const existing = await db.query('SELECT id FROM units WHERE symbol = $1 OR name = $2', [u.symbol, u.name]);
      if (existing.rowCount === 0) {
        await db.query('INSERT INTO units (name, symbol) VALUES ($1, $2)', [u.name, u.symbol]);
      }
    }
    console.log('✓ Inserted new units including Sack, Bag, Quintal, Ton');

    const allUnits = await db.query('SELECT * FROM units ORDER BY id');
    console.log('Current Units in DB:', allUnits.rows);

    // 3. Update branches if shop 3 is construction, etc.
    const allBranches = await db.query('SELECT id, name, type FROM branches ORDER BY id');
    console.log('Current Branches in DB:', allBranches.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
