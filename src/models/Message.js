const pool = require("../config/db");

const Message = {
    // ── Get all messages for a session, oldest first ─────────────────────────
    async getBySession(sessionId) {
        const [rows] = await pool.execute(`
            SELECT
                m.id,
                m.body,
                m.created_at,
                u.id       AS user_id,
                u.username AS author
            FROM messages m
            JOIN users u ON u.id = m.user_id
            WHERE m.session_id = ?
            ORDER BY m.created_at ASC
        `, [sessionId]);
        return rows;
    },

    // ── Post a new message ────────────────────────────────────────────────────
    async create(sessionId, userId, body) {
        const [result] = await pool.execute(`
            INSERT INTO messages (session_id, user_id, body)
            VALUES (?, ?, ?)
        `, [sessionId, userId, body]);

        const [[message]] = await pool.execute(`
            SELECT m.id, m.body, m.created_at, u.id AS user_id, u.username AS author
            FROM messages m
            JOIN users u ON u.id = m.user_id
            WHERE m.id = ?
        `, [result.insertId]);

        return message;
    },

    // ── Delete a message — only the author can do this ────────────────────────
    async delete(messageId, userId) {
        const [result] = await pool.execute(`
            DELETE FROM messages WHERE id = ? AND user_id = ?
        `, [messageId, userId]);
        return result.affectedRows > 0;
    }
};

module.exports = Message;
