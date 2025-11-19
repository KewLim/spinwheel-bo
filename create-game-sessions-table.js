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
CREATE TABLE IF NOT EXISTS game_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    prize_tiers TEXT NOT NULL,
    other_prize_amounts TEXT NOT NULL,
    created_by TEXT DEFAULT 'admin',
    is_active INTEGER DEFAULT 1,
    play_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
`;

const createIndexSQL = `
CREATE INDEX IF NOT EXISTS idx_session_id ON game_sessions(session_id);
`;

db.run(createTableSQL, (err) => {
    if (err) {
        console.error('❌ Error creating game_sessions table:', err.message);
        process.exit(1);
    }
    console.log('✅ Game sessions table created successfully!');

    db.run(createIndexSQL, (err) => {
        if (err) {
            console.error('❌ Error creating index:', err.message);
            process.exit(1);
        }
        console.log('✅ Index created successfully!');
        console.log('');
        console.log('Table structure:');
        console.log('- id: INTEGER PRIMARY KEY AUTOINCREMENT');
        console.log('- session_id: TEXT NOT NULL UNIQUE (indexed)');
        console.log('- prize_tiers: TEXT NOT NULL (JSON array)');
        console.log('- other_prize_amounts: TEXT NOT NULL (JSON array)');
        console.log('- created_by: TEXT DEFAULT "admin"');
        console.log('- is_active: INTEGER DEFAULT 1');
        console.log('- play_count: INTEGER DEFAULT 0');
        console.log('- created_at: TEXT NOT NULL');
        console.log('- updated_at: TEXT NOT NULL');
        console.log('');
        console.log('You can now generate unique game links with custom prize configurations!');

        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            }
            process.exit(0);
        });
    });
});
