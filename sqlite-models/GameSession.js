const dbAdapter = require('../database-adapter');
const crypto = require('crypto');

class GameSessionModel {
    constructor(data = {}) {
        this.id = data.id;
        this.sessionId = data.sessionId || data.session_id || this.generateSessionId();
        this.session_id = data.session_id || data.sessionId;

        // Handle cardConfigs as JSON string in SQLite
        if (typeof data.cardConfigs === 'string') {
            this.cardConfigs = JSON.parse(data.cardConfigs);
        } else if (Array.isArray(data.cardConfigs)) {
            this.cardConfigs = data.cardConfigs;
        } else if (data.card_configs) {
            this.cardConfigs = JSON.parse(data.card_configs);
        } else {
            this.cardConfigs = [];
        }

        this.createdBy = data.createdBy || data.created_by || 'admin';
        this.created_by = data.created_by || data.createdBy || 'admin';
        this.isActive = data.isActive !== undefined ? data.isActive : (data.is_active !== undefined ? data.is_active : true);
        this.is_active = data.is_active !== undefined ? data.is_active : (data.isActive !== undefined ? data.isActive : true);
        this.playCount = data.playCount || data.play_count || 0;
        this.play_count = data.play_count || data.playCount || 0;

        this.created_at = data.created_at || data.createdAt;
        this.createdAt = data.createdAt || data.created_at;
        this.updated_at = data.updated_at || data.updatedAt;
        this.updatedAt = data.updatedAt || data.updated_at;

        this._isNew = !data.id;
    }

    generateSessionId() {
        return crypto.randomBytes(16).toString('hex');
    }

    static async findOne(query = {}) {
        const row = await dbAdapter.findOne('game_sessions', query);
        return row ? new GameSessionModel(row) : null;
    }

    static async find(query = {}, options = {}) {
        const rows = await dbAdapter.find('game_sessions', query, options);
        return rows.map(row => new GameSessionModel(row));
    }

    static async findBySessionId(sessionId) {
        return await this.findOne({ session_id: sessionId });
    }

    async save() {
        const now = new Date().toISOString();

        if (this._isNew) {
            this.created_at = now;
            this.updated_at = now;
            this.createdAt = now;
            this.updatedAt = now;

            const data = {
                session_id: this.sessionId,
                card_configs: JSON.stringify(this.cardConfigs),
                created_by: this.createdBy,
                is_active: this.isActive ? 1 : 0,
                play_count: this.playCount,
                created_at: this.created_at,
                updated_at: this.updated_at
            };

            const result = await dbAdapter.insert('game_sessions', data);
            this.id = result.id;
            this._isNew = false;
        } else {
            this.updated_at = now;
            this.updatedAt = now;

            const data = {
                card_configs: JSON.stringify(this.cardConfigs),
                is_active: this.isActive ? 1 : 0,
                play_count: this.playCount,
                updated_at: this.updated_at
            };

            await dbAdapter.update('game_sessions', { id: this.id }, data);
        }

        return this;
    }

    async incrementPlayCount() {
        this.playCount += 1;
        this.play_count += 1;
        return await this.save();
    }

    toJSON() {
        return {
            id: this.id,
            sessionId: this.sessionId,
            cardConfigs: this.cardConfigs,
            createdBy: this.createdBy,
            isActive: this.isActive,
            playCount: this.playCount,
            created_at: this.created_at,
            createdAt: this.created_at,
            updated_at: this.updated_at,
            updatedAt: this.updated_at
        };
    }
}

module.exports = GameSessionModel;
