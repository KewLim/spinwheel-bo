const DB_TYPE = process.env.DB_TYPE || 'sqlite';

if (DB_TYPE === 'sqlite') {
    module.exports = require('../sqlite-models/GameSession');
} else {
    const mongoose = require('mongoose');

    const gameSessionSchema = new mongoose.Schema({
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        cardConfigs: {
            type: [{
                amount: String,
                probability: Number
            }],
            required: true
        },
        createdBy: {
            type: String,
            default: 'admin'
        },
        isActive: {
            type: Boolean,
            default: true
        },
        playCount: {
            type: Number,
            default: 0
        }
    }, {
        timestamps: true
    });

    module.exports = mongoose.model('GameSession', gameSessionSchema);
}
