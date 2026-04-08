const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/User");

// --- Validation Schemas (NFR3) ---
const registerSchema = Joi.object({
    username: Joi.string().min(3).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// POST /api/auth/register (FR1, FR4, FR5, FR7)
const register = async (req, res, next) => {
    try {
        // Validate input
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: "error",
                message: error.details[0].message
            });
        }

        const { username, email, password } = value;

        // Check for duplicate email (FR4)
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "An account with this email already exists."
            });
        }

        // Hash password (FR5)
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.createUser(username, email, hashedPassword);

        res.status(201).json({
            status: "success",
            message: "Account created successfully.",
            data: { id: newUser.id, username: newUser.username, email: newUser.email }
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/login (FR2, FR8, NFR1, NFR2)
const login = async (req, res, next) => {
    try {
        // Validate input
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                status: "error",
                message: error.details[0].message
            });
        }

        const { email, password } = value;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password."
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password."
            });
        }

        // Sign JWT (NFR1, NFR2)
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
        );

        res.status(200).json({
            status: "success",
            message: "Login successful.",
            data: {
                token,
                user: { id: user.id, username: user.username, email: user.email }
            }
        });
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/logout (FR3)
const logout = (req, res) => {
    // JWT is stateless — client drops the token
    res.status(200).json({
        status: "success",
        message: "Logged out successfully. Please remove your token on the client."
    });
};

module.exports = { register, login, logout };
