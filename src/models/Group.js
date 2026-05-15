const pool = require("../config/db");

const Session = {
    // ── List all sessions with host name and live attendee count ──────────────
    async getAll() {
        const [rows] = await pool.execute(`
            SELECT
                s.id,
                s.tag,
                s.title,
                s.location,
                s.time,
                s.about,
                s.total_spots,
                s.lat,
                s.lng,
                s.color,
                s.created_at,
                u.id       AS host_id,
                u.username AS host_name,
                (
                    SELECT COUNT(*) FROM session_attendees sa
                    WHERE sa.session_id = s.id
                ) AS attendee_count
            FROM sessions s
            JOIN users u ON u.id = s.host_id
            ORDER BY s.created_at DESC
        `);
        return rows;
    },

    // ── Get a single session with its full attendees list ─────────────────────
    async getById(id) {
        const [[session]] = await pool.execute(`
            SELECT
                s.id,
                s.tag,
                s.title,
                s.location,
                s.time,
                s.about,
                s.total_spots,
                s.lat,
                s.lng,
                s.color,
                s.created_at,
                u.id       AS host_id,
                u.username AS host_name
            FROM sessions s
            JOIN users u ON u.id = s.host_id
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

    // ── Create a new session (host is auto-added as the creator) ─────────────
    async create({ tag, title, location, time, about, totalSpots, lat, lng, color }, hostId) {
        const [result] = await pool.execute(`
            INSERT INTO sessions (tag, title, location, time, about, total_spots, lat, lng, color, host_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [tag, title, location, time, about || null, totalSpots || 6,
            lat ?? null, lng ?? null, color || '#0f0f10', hostId]);

        return this.getById(result.insertId);
    },

    // ── Join a session (insert into attendees) ────────────────────────────────
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

    // ── Delete a session (only possible if requester is the host) ─────────────
    async delete(sessionId, hostId) {
        const [result] = await pool.execute(`
            DELETE FROM sessions
            WHERE id = ? AND host_id = ?
        `, [sessionId, hostId]);
        return result.affectedRows > 0;
    },

    // ── Check whether a user has already joined a session ────────────────────
    async isJoined(sessionId, userId) {
        const [[row]] = await pool.execute(`
            SELECT 1 FROM session_attendees
            WHERE session_id = ? AND user_id = ?
            LIMIT 1
        `, [sessionId, userId]);
        return !!row;
    },

    // ── Count how many spots are still available ──────────────────────────────
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
