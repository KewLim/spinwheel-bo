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

// First, let's check if the new columns exist
db.get("PRAGMA table_info(angpau_config)", (err, row) => {
    if (err) {
        console.error('❌ Error checking angpau_config table:', err.message);
        process.exit(1);
    }
    
    console.log('📋 Migrating database schema to support 10-card configuration...');
    
    // Migration for angpau_config table
    const migrateAngpauConfig = `
        -- Create new table with card_configs structure
        CREATE TABLE IF NOT EXISTS angpau_config_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_configs TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        
        -- Insert transformed data if old table has data
        INSERT OR IGNORE INTO angpau_config_new (id, card_configs, created_at, updated_at)
        SELECT 
            id,
            '[{"amount":"₹8","probability":0},{"amount":"₹50","probability":0},{"amount":"₹100","probability":0},{"amount":"₹300","probability":0},{"amount":"₹1000","probability":0},{"amount":"₹3000","probability":0},{"amount":"₹800","probability":0},{"amount":"₹5000","probability":0},{"amount":"₹2000","probability":0},{"amount":"₹1500","probability":0}]',
            created_at,
            updated_at
        FROM angpau_config
        WHERE EXISTS (SELECT 1 FROM angpau_config);
        
        -- Drop old table and rename new one
        DROP TABLE IF EXISTS angpau_config;
        ALTER TABLE angpau_config_new RENAME TO angpau_config;
    `;

    // Migration for game_sessions table
    const migrateGameSessions = `
        -- Create new table with card_configs structure
        CREATE TABLE IF NOT EXISTS game_sessions_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL UNIQUE,
            card_configs TEXT NOT NULL,
            created_by TEXT DEFAULT 'admin',
            is_active INTEGER DEFAULT 1,
            play_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_session_id_new ON game_sessions_new(session_id);
        
        -- Insert transformed data if old table has data
        INSERT OR IGNORE INTO game_sessions_new (id, session_id, card_configs, created_by, is_active, play_count, created_at, updated_at)
        SELECT 
            id,
            session_id,
            '[{"amount":"₹8","probability":0},{"amount":"₹50","probability":0},{"amount":"₹100","probability":0},{"amount":"₹300","probability":0},{"amount":"₹1000","probability":0},{"amount":"₹3000","probability":0},{"amount":"₹800","probability":0},{"amount":"₹5000","probability":0},{"amount":"₹2000","probability":0},{"amount":"₹1500","probability":0}]',
            created_by,
            is_active,
            play_count,
            created_at,
            updated_at
        FROM game_sessions
        WHERE EXISTS (SELECT 1 FROM game_sessions);
        
        -- Drop old table and rename new one
        DROP TABLE IF EXISTS game_sessions;
        ALTER TABLE game_sessions_new RENAME TO game_sessions;
        
        -- Recreate index with correct name
        DROP INDEX IF EXISTS idx_session_id_new;
        CREATE INDEX IF NOT EXISTS idx_session_id ON game_sessions(session_id);
    `;

    console.log('🔄 Step 1: Migrating angpau_config table...');
    db.exec(migrateAngpauConfig, (err) => {
        if (err) {
            console.error('❌ Error migrating angpau_config table:', err.message);
            process.exit(1);
        }
        console.log('✅ angpau_config table migrated successfully!');

        console.log('🔄 Step 2: Migrating game_sessions table...');
        db.exec(migrateGameSessions, (err) => {
            if (err) {
                console.error('❌ Error migrating game_sessions table:', err.message);
                process.exit(1);
            }
            console.log('✅ game_sessions table migrated successfully!');
            console.log('');
            console.log('🎉 Migration completed successfully!');
            console.log('');
            console.log('Updated table structures:');
            console.log('');
            console.log('angpau_config:');
            console.log('- id: INTEGER PRIMARY KEY AUTOINCREMENT');
            console.log('- card_configs: TEXT NOT NULL (JSON array of {amount, probability})');
            console.log('- created_at: TEXT NOT NULL');
            console.log('- updated_at: TEXT NOT NULL');
            console.log('');
            console.log('game_sessions:');
            console.log('- id: INTEGER PRIMARY KEY AUTOINCREMENT');
            console.log('- session_id: TEXT NOT NULL UNIQUE (indexed)');
            console.log('- card_configs: TEXT NOT NULL (JSON array of {amount, probability})');
            console.log('- created_by: TEXT DEFAULT "admin"');
            console.log('- is_active: INTEGER DEFAULT 1');
            console.log('- play_count: INTEGER DEFAULT 0');
            console.log('- created_at: TEXT NOT NULL');
            console.log('- updated_at: TEXT NOT NULL');

            db.close((err) => {
                if (err) {
                    console.error('❌ Error closing database:', err.message);
                }
                process.exit(0);
            });
        });
    });
});