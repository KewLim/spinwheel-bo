const dbAdapter = require('../database-adapter');

class AngpauConfigModel {
    constructor(data = {}) {
        this.id = data.id;

        // Handle cardConfigs as JSON string in SQLite
        if (typeof data.cardConfigs === 'string') {
            this.cardConfigs = JSON.parse(data.cardConfigs);
        } else if (Array.isArray(data.cardConfigs)) {
            this.cardConfigs = data.cardConfigs;
        } else if (data.card_configs) {
            this.cardConfigs = JSON.parse(data.card_configs);
        } else {
            this.cardConfigs = [
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
            ];
        }

        this.created_at = data.created_at || data.createdAt;
        this.createdAt = data.createdAt || data.created_at;
        this.updated_at = data.updated_at || data.updatedAt;
        this.updatedAt = data.updatedAt || data.updated_at;

        this._isNew = !data.id;
    }

    static async findOne(query = {}) {
        const row = await dbAdapter.findOne('angpau_config', query);
        return row ? new AngpauConfigModel(row) : null;
    }

    static async find(query = {}, options = {}) {
        const rows = await dbAdapter.find('angpau_config', query, options);
        return rows.map(row => new AngpauConfigModel(row));
    }

    async save() {
        const now = new Date().toISOString();

        if (this._isNew) {
            this.created_at = now;
            this.updated_at = now;
            this.createdAt = now;
            this.updatedAt = now;

            const data = {
                card_configs: JSON.stringify(this.cardConfigs),
                created_at: this.created_at,
                updated_at: this.updated_at
            };

            const result = await dbAdapter.insert('angpau_config', data);
            this.id = result.id;
            this._isNew = false;
        } else {
            this.updated_at = now;
            this.updatedAt = now;

            const data = {
                card_configs: JSON.stringify(this.cardConfigs),
                updated_at: this.updated_at
            };

            await dbAdapter.update('angpau_config', { id: this.id }, data);
        }

        return this;
    }

    toJSON() {
        return {
            id: this.id,
            cardConfigs: this.cardConfigs,
            created_at: this.created_at,
            createdAt: this.created_at,
            updated_at: this.updated_at,
            updatedAt: this.updated_at
        };
    }
}

module.exports = AngpauConfigModel;
