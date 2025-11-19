const DB_TYPE = process.env.DB_TYPE || 'sqlite';

if (DB_TYPE === 'sqlite') {
    module.exports = require('../sqlite-models/AngpauConfig');
} else {
    const mongoose = require('mongoose');

    const angpauConfigSchema = new mongoose.Schema({
        cardConfigs: {
            type: [{
                amount: String,
                probability: Number
            }],
            required: true,
            validate: [cardLimit, '{PATH} must have exactly 10 elements'],
            default: [
                { amount: '₹8', probability: 0 },
                { amount: '₹50', probability: 0 },
                { amount: '₹100', probability: 0 },
                { amount: '₹300', probability: 0 },
                { amount: '₹1000', probability: 0 },
                { amount: '₹3000', probability: 0 },
                { amount: '₹800', probability: 0 },
                { amount: '₹5000', probability: 0 },
                { amount: '₹2000', probability: 0 },
                { amount: '₹1500', probability: 0 }
            ]
        }
    }, {
        timestamps: true
    });

    function cardLimit(val) {
        return val.length === 10;
    }

    module.exports = mongoose.model('AngpauConfig', angpauConfigSchema);
}
