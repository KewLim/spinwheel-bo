const dbAdapter = require('../database-adapter');

class AngpauModel {
    constructor(data = {}) {
        this.id = data.id;
        this.title = data.title;
        this.amount = data.amount;
        this.description = data.description;
        this.code = data.code;
        this.expiryDate = data.expiryDate || data.expiry_date;
        this.expiry_date = data.expiry_date || data.expiryDate;
        this.status = data.status || 'active';
        this.created_at = data.created_at || data.createdAt;
        this.createdAt = data.createdAt || data.created_at;
        this.updated_at = data.updated_at || data.updatedAt;
        this.updatedAt = data.updatedAt || data.updated_at;
        this.mongo_id = data.mongo_id;

        this._isNew = !data.id;
    }

    static async findOne(query) {
        const row = await dbAdapter.findOne('angpau', query);
        return row ? new AngpauModel(row) : null;
    }

    static async find(query = {}, options = {}) {
        const rows = await dbAdapter.find('angpau', query, options);
        return rows.map(row => new AngpauModel(row));
    }

    static async findById(id) {
        return await AngpauModel.findOne({ id });
    }

    static async findByIdAndDelete(id) {
        const angpau = await AngpauModel.findById(id);
        if (angpau) {
            await angpau.remove();
            return angpau;
        }
        return null;
    }

    async save() {
        const now = new Date().toISOString();

        if (this._isNew) {
            this.created_at = now;
            this.updated_at = now;
            this.createdAt = now;
            this.updatedAt = now;

            const data = {
                title: this.title,
                amount: this.amount,
                description: this.description,
                code: this.code,
                expiry_date: this.expiryDate || this.expiry_date,
                status: this.status,
                created_at: this.created_at,
                updated_at: this.updated_at,
                mongo_id: this.mongo_id
            };

            const result = await dbAdapter.insert('angpau', data);
            this.id = result.id;
            this._isNew = false;
        } else {
            this.updated_at = now;
            this.updatedAt = now;

            const data = {
                title: this.title,
                amount: this.amount,
                description: this.description,
                code: this.code,
                expiry_date: this.expiryDate || this.expiry_date,
                status: this.status,
                updated_at: this.updated_at
            };

            await dbAdapter.update('angpau', { id: this.id }, data);
        }

        return this;
    }

    async remove() {
        if (this.id) {
            await dbAdapter.delete('angpau', { id: this.id });
        }
    }

    get _id() {
        return this.id;
    }

    toJSON() {
        return {
            id: this.id,
            _id: this.id,
            title: this.title,
            amount: this.amount,
            description: this.description,
            code: this.code,
            expiryDate: this.expiryDate || this.expiry_date,
            status: this.status,
            created_at: this.created_at,
            createdAt: this.created_at,
            updated_at: this.updated_at,
            updatedAt: this.updated_at
        };
    }
}

module.exports = AngpauModel;
