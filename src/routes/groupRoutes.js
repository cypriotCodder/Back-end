const express = require("express");
const router  = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
    getSessions,
    getSessionById,
    createSession,
    joinSession,
    leaveSession,
    deleteSession
} = require("../controllers/groupController");

// ── Public routes (no token required) ────────────────────────────────────
router.get("/",    getSessions);      // GET  /api/sessions
router.get("/:id", getSessionById);   // GET  /api/sessions/:id

// ── Protected routes (JWT required) ──────────────────────────────────────
router.post("/",              verifyToken, createSession);  // POST   /api/sessions
router.post("/:id/join",      verifyToken, joinSession);    // POST   /api/sessions/:id/join
router.delete("/:id/leave",   verifyToken, leaveSession);   // DELETE /api/sessions/:id/leave
router.delete("/:id",         verifyToken, deleteSession);  // DELETE /api/sessions/:id

module.exports = router;