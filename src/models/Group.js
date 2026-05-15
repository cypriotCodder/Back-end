const pool = require("../config/db");

const Session = {
    // ── List all sessions with host name, location, and live attendee count ──
    async getAll() {
        const [rows] = await pool.execute(`
            SELECT
                s.id,
                s.tag,
                s.title,
                s.time,
                s.about,
                s.total_spots,
                s.color,
                s.created_at,
                u.id          AS host_id,
                u.username    AS host_name,
                l.id          AS location_id,
                l.address,
                l.place_name,
                l.lat,
                l.lng,
                (
                    SELECT COUNT(*) FROM session_attendees sa
                    WHERE sa.session_id = s.id
                ) AS attendee_count
            FROM sessions s
            JOIN users     u ON u.id = s.host_id
            JOIN locations l ON l.id = s.location_id
            ORDER BY s.created_at DESC
        `);
        return rows;
    },

    // ── Get one session with its full attendees list ──────────────────────────
    async getById(id) {
        const [[session]] = await pool.execute(`
            SELECT
                s.id,
                s.tag,
                s.title,
                s.time,
                s.about,
                s.total_spots,
                s.color,
                s.created_at,
                u.id          AS host_id,
                u.username    AS host_name,
                l.id          AS location_id,
                l.address,
                l.place_name,
                l.lat,
                l.lng
            FROM sessions s
            JOIN users     u ON u.id = s.host_id
            JOIN locations l ON l.id = s.location_id
            WHERE s.id = ?
        `, [id]);

        if (!session) return null;

        const [attendees] = await pool.execute(`
            SELECT u.id, u.username, sa.joined_at
            FROM session_attendees sa
            JOIN users u ON u.id = sa.user_id
            WHERE sa.session_id = ?
            ORDER BY sa.joined_at ASC
        `, [id]);

        return { ...session, attendees };
    },

    // ── Create a new session (location_id must already exist) ─────────────────
    async create({ tag, title, time, about, totalSpots, color, locationId }, hostId) {
        const [result] = await pool.execute(`
            INSERT INTO sessions (tag, title, time, about, total_spots, color, host_id, location_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tag, title, time, about || null, totalSpots || 6,
            color || '#0f0f10', hostId, locationId]);

        return this.getById(result.insertId);
    },

    // ── Join a session ────────────────────────────────────────────────────────
    async join(sessionId, userId) {
        await pool.execute(`
            INSERT IGNORE INTO session_attendees (session_id, user_id)
            VALUES (?, ?)
        `, [sessionId, userId]);
    },

    // ── Leave a session ───────────────────────────────────────────────────────
    async leave(sessionId, userId) {
        await pool.execute(`
            DELETE FROM session_attendees
            WHERE session_id = ? AND user_id = ?
        `, [sessionId, userId]);
    },

    // ── Delete a session — only the host can do this ──────────────────────────
    async delete(sessionId, hostId) {
        const [result] = await pool.execute(`
            DELETE FROM sessions WHERE id = ? AND host_id = ?
        `, [sessionId, hostId]);
        return result.affectedRows > 0;
    },

    // ── Check if a user has already joined ───────────────────────────────────
    async isJoined(sessionId, userId) {
        const [[row]] = await pool.execute(`
            SELECT 1 FROM session_attendees
            WHERE session_id = ? AND user_id = ?
            LIMIT 1
        `, [sessionId, userId]);
        return !!row;
    },

    // ── How many spots remain ─────────────────────────────────────────────────
    async spotsLeft(sessionId) {
        const [[session]] = await pool.execute(`
            SELECT total_spots FROM sessions WHERE id = ?
        `, [sessionId]);
        if (!session) return null;

        const [[{ cnt }]] = await pool.execute(`
            SELECT COUNT(*) AS cnt FROM session_attendees WHERE session_id = ?
        `, [sessionId]);

        return session.total_spots - cnt;
    }
};

module.exports = Session;
