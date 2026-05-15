const Joi     = require("joi");
const Message = require("../models/Message");
const Session = require("../models/Group");

const bodySchema = Joi.object({
    body: Joi.string().max(2000).required()
});

// ── GET /api/sessions/:id/messages ───────────────────────────────────────
// Public. Returns all messages for a session, oldest first.
const getMessages = async (req, res, next) => {
    try {
        const sessionId = Number(req.params.id);

        const session = await Session.getById(sessionId);
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found." });
        }

        const messages = await Message.getBySession(sessionId);
        res.json({ status: "success", data: messages });
    } catch (err) {
        next(err);
    }
};

// ── POST /api/sessions/:id/messages ──────────────────────────────────────
// Auth required. Post a message to a session's discussion.
const sendMessage = async (req, res, next) => {
    try {
        const sessionId = Number(req.params.id);
        const userId    = req.user.id;

        const { error, value } = bodySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: "error", message: error.details[0].message });
        }

        const session = await Session.getById(sessionId);
        if (!session) {
            return res.status(404).json({ status: "error", message: "Session not found." });
        }

        const message = await Message.create(sessionId, userId, value.body);
        res.status(201).json({ status: "success", data: message });
    } catch (err) {
        next(err);
    }
};

// ── DELETE /api/sessions/:id/messages/:msgId ─────────────────────────────
// Auth required. Only the message author can delete their own message.
const deleteMessage = async (req, res, next) => {
    try {
        const messageId = Number(req.params.msgId);
        const userId    = req.user.id;

        const deleted = await Message.delete(messageId, userId);
        if (!deleted) {
            return res.status(403).json({
                status: "error",
                message: "Message not found or you are not the author."
            });
        }

        res.json({ status: "success", message: "Message deleted." });
    } catch (err) {
        next(err);
    }
};

module.exports = { getMessages, sendMessage, deleteMessage };
