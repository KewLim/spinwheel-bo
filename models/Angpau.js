const DB_TYPE = process.env.DB_TYPE || 'sqlite';

if (DB_TYPE === 'sqlite') {
    module.exports = require('../sqlite-models/Angpau');
} else {
    const mongoose = require('mongoose');

    const angpauSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true,
            maxlength: 100
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        description: {
            type: String,
            maxlength: 500
        },
        code: {
            type: String,
            maxlength: 50
        },
        expiryDate: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'expired'],
            default: 'active'
        }
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('Angpau', angpauSchema);
}
