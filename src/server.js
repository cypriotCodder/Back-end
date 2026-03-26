const dotenv = require("dotenv");
const app = require("./app");

dotenv.config();

// Initialize database connection
require("./config/db");

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}: http://localhost:${PORT}`);
});