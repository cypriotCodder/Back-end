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
const { getMessages, sendMessage, deleteMessage } = require("../controllers/messageController");

// ── Public session routes ─────────────────────────────────────────────────
router.get("/",    getSessions);      // GET  /api/sessions
router.get("/:id", getSessionById);   // GET  /api/sessions/:id

// ── Protected session routes ──────────────────────────────────────────────
router.post("/",              verifyToken, createSession);  // POST   /api/sessions
router.post("/:id/join",      verifyToken, joinSession);    // POST   /api/sessions/:id/join
router.delete("/:id/leave",   verifyToken, leaveSession);   // DELETE /api/sessions/:id/leave
router.delete("/:id",         verifyToken, deleteSession);  // DELETE /api/sessions/:id

// ── Message routes (nested under session) ────────────────────────────────
router.get("/:id/messages",                getMessages);                    // GET    /api/sessions/:id/messages
router.post("/:id/messages",   verifyToken, sendMessage);                   // POST   /api/sessions/:id/messages
router.delete("/:id/messages/:msgId", verifyToken, deleteMessage);          // DELETE /api/sessions/:id/messages/:msgId

module.exports = router;