const pool = require("../config/db");

const Location = {
    // ── Create a new location record ─────────────────────────────────────────
    async create({ address, placeName, lat, lng }) {
        const [result] = await pool.execute(`
            INSERT INTO locations (address, place_name, lat, lng)
            VALUES (?, ?, ?, ?)
        `, [address, placeName || null, lat ?? null, lng ?? null]);

        return this.findById(result.insertId);
    },

    // ── Find a location by its primary key ───────────────────────────────────
    async findById(id) {
        const [[row]] = await pool.execute(`
            SELECT * FROM locations WHERE id = ? LIMIT 1
        `, [id]);
        return row || null;
    }
};

module.exports = Location;
