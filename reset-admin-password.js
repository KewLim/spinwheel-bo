const bcrypt = require('bcryptjs');
const dbAdapter = require('./database-adapter');

async function resetAdminPassword() {
    try {
        // Set database type
        process.env.DB_TYPE = 'sqlite';

        // Connect to database
        await dbAdapter.connect();
        console.log('✅ Connected to SQLite database');

        // New password
        const newPassword = 'Admin@123456';
        const email = 'admin@luckytaj.com';

        // Hash the new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the admin password
        await dbAdapter.update('admins',
            { email: email },
            { password: hashedPassword, updated_at: new Date().toISOString() }
        );

        console.log('✅ Password reset successfully!');
        console.log('');
        console.log('='.repeat(50));
        console.log('Admin Credentials:');
        console.log('='.repeat(50));
        console.log('Email:', email);
        console.log('Password:', newPassword);
        console.log('='.repeat(50));
        console.log('');
        console.log('You can now login at: http://localhost:3003/admin');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting password:', error);
        process.exit(1);
    }
}

resetAdminPassword();
