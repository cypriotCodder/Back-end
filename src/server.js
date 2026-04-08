const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const initDB = require("./config/initDB");

// Initialize database connection & tables
require("./config/db");

const PORT = process.env.PORT || 5003;

const startServer = async () => {
    try {
        await initDB();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}: http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to initialize database. Server not started.", err.message);
        process.exit(1);
    }
};

startServer();