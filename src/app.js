const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes    = require("./routes/authRoutes");
const sessionRoutes = require("./routes/groupRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rate limiter for login endpoint (NFR5)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,                   // max 10 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        status: "error",
        message: "Too many login attempts. Please try again after 15 minutes."
    }
});

// Routes
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth",     authRoutes);
app.use("/api/sessions", sessionRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Root route
app.get("/", (req, res) => {
    res.json({ message: "Study Group Finder API is running" });
});

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;