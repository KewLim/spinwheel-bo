const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'luckytaj.db');
const db = new sqlite3.Database(dbPath);

console.log('Updating angpau_config table schema...');

db.serialize(() => {
    // Check if prize_tiers column exists
    db.all("PRAGMA table_info(angpau_config)", (err, columns) => {
        if (err) {
            console.error('Error checking table schema:', err);
            db.close();
            return;
        }

        const hasPrizeTiers = columns.some(col => col.name === 'prize_tiers');

        if (!hasPrizeTiers) {
            console.log('Adding prize_tiers column...');
            db.run(`
                ALTER TABLE angpau_config
                ADD COLUMN prize_tiers TEXT
            `, (err) => {
                if (err) {
                    console.error('Error adding prize_tiers column:', err);
                } else {
                    console.log('✅ prize_tiers column added successfully');

                    // Set default value for existing rows
                    const defaultPrizeTiers = JSON.stringify([
                        { amount: '₹8', weight: 70 },
                        { amount: '₹50', weight: 20 },
                        { amount: '₹100', weight: 8 },
                        { amount: '₹300', weight: 2 }
                    ]);

                    db.run(`
                        UPDATE angpau_config
                        SET prize_tiers = ?
                        WHERE prize_tiers IS NULL
                    `, [defaultPrizeTiers], (err) => {
                        if (err) {
                            console.error('Error setting default prize_tiers:', err);
                        } else {
                            console.log('✅ Default prize_tiers set for existing rows');
                        }
                        db.close();
                    });
                }
            });
        } else {
            console.log('✅ prize_tiers column already exists');
            db.close();
        }
    });
});
