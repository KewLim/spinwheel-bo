const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'lucky_taj_admin.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    }
    console.log('✅ Connected to SQLite database');
});

const createTableSQL = `
CREATE TABLE IF NOT EXISTS angpau_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_tiers TEXT NOT NULL,
    other_prize_amounts TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
`;

db.run(createTableSQL, (err) => {
    if (err) {
        console.error('❌ Error creating angpau_config table:', err.message);
        process.exit(1);
    }
    console.log('✅ Angpau config table created successfully!');
    console.log('');
    console.log('Table structure:');
    console.log('- id: INTEGER PRIMARY KEY AUTOINCREMENT');
    console.log('- prize_tiers: TEXT NOT NULL (JSON array of {amount, weight})');
    console.log('- other_prize_amounts: TEXT NOT NULL (JSON array)');
    console.log('- created_at: TEXT NOT NULL');
    console.log('- updated_at: TEXT NOT NULL');
    console.log('');
    console.log('You can now configure angpau prize tiers and amounts in the admin panel!');

    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        }
        process.exit(0);
    });
});
