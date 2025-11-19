const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            console.log('Auth failed: No token provided');
            return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId);

        if (!admin || !admin.isActive) {
            console.log('Auth failed: Admin not found or inactive');
            return res.status(401).json({ error: 'Invalid token or admin not active.' });
        }

        // Remove password from admin object before attaching to request
        const adminData = admin.toJSON ? admin.toJSON() : admin;
        delete adminData.password;

        req.admin = adminData;
        next();
    } catch (error) {
        console.log('Auth error:', error.message);
        res.status(401).json({ error: 'Invalid token.' });
    }
};

module.exports = authMiddleware;