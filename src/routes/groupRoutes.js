const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");

// Protect all group routes (FR9)
router.use(verifyToken);

// GET /api/groups
router.get("/", (req, res) => {
    res.json([
        { id: 1, title: "COMP401 Study Group", course: "COMP401", members: 5 },
        { id: 2, title: "Database Revision Group", course: "COMP301", members: 3 }
    ]);
});

module.exports = router;