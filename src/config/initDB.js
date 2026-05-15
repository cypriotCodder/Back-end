const pool = require("./db");

const initDB = async () => {
    try {
        // Users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                username   VARCHAR(100) NOT NULL,
                email      VARCHAR(100) NOT NULL UNIQUE,
                password   VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Sessions table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS sessions (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                tag         VARCHAR(50)  NOT NULL,
                title       VARCHAR(200) NOT NULL,
                location    VARCHAR(200) NOT NULL,
                time        VARCHAR(100) NOT NULL,
                about       TEXT,
                total_spots INT          NOT NULL DEFAULT 6,
                lat         DECIMAL(9,6),
                lng         DECIMAL(9,6),
                color       VARCHAR(20)  DEFAULT '#0f0f10',
                host_id     INT          NOT NULL,
                created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Attendees join table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS session_attendees (
                session_id INT NOT NULL,
                user_id    INT NOT NULL,
                joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (session_id, user_id),
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
            )
        `);

        console.log("Database tables initialized successfully.");
    } catch (err) {
        console.error("Error initializing database tables:", err.message);
        throw err;
    }
};

module.exports = initDB;
