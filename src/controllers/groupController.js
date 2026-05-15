const Joi = require("joi");
const Session = require("../models/Group");

// ── Validation schemas ─────────────────────────────────────────────────────

const createSchema = Joi.object({
    tag:        Joi.string().max(50).required(),
    title:      Joi.string().max(200).required(),
    location:   Joi.string().max(200).required(),
    time:       Joi.string().max(100).required(),
    about:      Joi.string().max(2000).optional().allow(""),
    totalSpots: Joi.number().integer().min(2).max(100).required(),
    lat:        Joi.number().min(-90).max(90).optional().allow(null),
    lng:        Joi.number().min(-180).max(180).optional().allow(null),
    color:      Joi.string().max(20).optional()
});

// ── GET /api/sessions ──────────────────────────────────────────────────────
// Public. Returns all sessions with host name and attendee count.
const getSessions = async (req, res, next) => {
    try {
        const sessions = await Session.getAll();
        res.json({ status: "success", data: sessions });
    } catch (err) {
        next(err);
    }
};

// ── GET /api/sessions/:id ──────────────────────────────────────────────────
// Public. Returns a single session with its full attendees list.
const getSessionById = async (req, res, next) => {
    try {
        const session = await Session.getById(Number(req.params.id));
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found." });
        }
        res.json({ status: "success", data: session });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/sessions ────────────────────────────────────────────────────
// Auth required. Creates a new session; host is the logged-in user.
const createSession = async (req, res, next) => {
    try {
        const { error, value } = createSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error", message: error.details[0].message });
        }

        const session = await Session.create(value, req.user.id);
        res.status(201).json({ status: "success", data: session });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/sessions/:id/join ───────────────────────────────────────────
// Auth required. Adds the logged-in user to the session's attendees.
const joinSession = async (req, res, next) => {
    try {
        const sessionId = Number(req.params.id);
        const userId    = req.user.id;

        const session = await Session.getById(sessionId);
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found." });
        }

        // Host cannot join their own session as an attendee
        if (session.host_id === userId) {
            return res.status(400).json({ status: "error", message: "You are already the host of this session." });
        }

        // Check for available spots
        const spots = await Session.spotsLeft(sessionId);
        if (spots <= 0) {
            return res.status(409).json({ status: "error", message: "This session is full." });
        }

        // Idempotent — INSERT IGNORE handles duplicate joins silently
        await Session.join(sessionId, userId);

        const updated = await Session.getById(sessionId);
        res.json({ status: "success", message: "Joined session successfully.", data: updated });
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/sessions/:id/leave ───────────────────────────────────────
// Auth required. Removes the logged-in user from the attendees list.
const leaveSession = async (req, res, next) => {
    try {
        const sessionId = Number(req.params.id);
        const userId    = req.user.id;

        const session = await Session.getById(sessionId);
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found." });
        }

        if (session.host_id === userId) {
            return res.status(400).json({ status: "error", message: "Hosts cannot leave their own session. Delete it instead." });
        }

        await Session.leave(sessionId, userId);
        res.json({ status: "success", message: "Left session successfully." });
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/sessions/:id ──────────────────────────────────────────────
// Auth required. Only the host can delete their session.
const deleteSession = async (req, res, next) => {
    try {
        const sessionId = Number(req.params.id);
        const userId    = req.user.id;

        const deleted = await Session.delete(sessionId, userId);
        if (!deleted) {
            return res.status(403).json({
                status: "error",
                message: "Session not found or you are not the host."
            });
        }

        res.json({ status: "success", message: "Session deleted." });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getSessions,
    getSessionById,
    createSession,
    joinSession,
    leaveSession,
    deleteSession
};
