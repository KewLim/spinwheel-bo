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
CREATE TABLE IF NOT EXISTS angpau (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    code TEXT,
    expiry_date TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    mongo_id TEXT
);
`;

db.run(createTableSQL, (err) => {
    if (err) {
        console.error('❌ Error creating angpau table:', err.message);
        process.exit(1);
    }
    console.log('✅ Angpau table created successfully!');
    console.log('');
    console.log('Table structure:');
    console.log('- id: INTEGER PRIMARY KEY AUTOINCREMENT');
    console.log('- title: TEXT NOT NULL');
    console.log('- amount: INTEGER NOT NULL');
    console.log('- description: TEXT');
    console.log('- code: TEXT');
    console.log('- expiry_date: TEXT NOT NULL');
    console.log('- status: TEXT DEFAULT "active"');
    console.log('- created_at: TEXT NOT NULL');
    console.log('- updated_at: TEXT NOT NULL');
    console.log('- mongo_id: TEXT');
    console.log('');
    console.log('You can now use the Angpau management page at: http://localhost:3003/admin/angpau');

    db.close((err) => {
        if (err) {
            console.error('❌ Error closing database:', err.message);
        }
        process.exit(0);
    });
});
