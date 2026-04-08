const pool = require("../config/db");

const User = {
    async findByEmail(email) {
        const [rows] = await pool.execute(
            "SELECT * FROM users WHERE email = ? LIMIT 1",
            [email]
        );
        return rows[0] || null;
    },

    async findById(id) {
        const [rows] = await pool.execute(
            "SELECT id, username, email, created_at FROM users WHERE id = ? LIMIT 1",
            [id]
        );
        return rows[0] || null;
    },

    async createUser(username, email, hashedPassword) {
        const [result] = await pool.execute(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword]
        );
        return { id: result.insertId, username, email };
    }
};

module.exports = User;
