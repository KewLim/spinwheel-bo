const dbAdapter = require('./database-adapter');
const AdminModel = require('./sqlite-models/Admin');
require('dotenv').config();

async function setupSQLiteAdmin() {
    try {
        // Connect to SQLite database
        await dbAdapter.connect();
        console.log('Connected to SQLite database');

        // Check if admin already exists
        const existingAdmin = await AdminModel.findByEmail(process.env.ADMIN_EMAIL);
        
        if (existingAdmin) {
            console.log('Admin user already exists:', process.env.ADMIN_EMAIL);
            console.log('You can try logging in with:');
            console.log('Email:', process.env.ADMIN_EMAIL);
            console.log('Password:', process.env.ADMIN_PASSWORD);
            process.exit(0);
        }

        // Create admin user
        const admin = new AdminModel({
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            isActive: true
        });

        await admin.save();
        console.log('✅ Admin user created successfully!');
        console.log('Email:', process.env.ADMIN_EMAIL);
        console.log('Password:', process.env.ADMIN_PASSWORD);
        console.log('\n🔐 You can now login to the admin panel at: http://localhost:3003/admin');
        console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
        
    } catch (error) {
        console.error('❌ Error setting up admin:', error);
    } finally {
        process.exit(0);
    }
}

setupSQLiteAdmin();