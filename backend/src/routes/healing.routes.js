const express = require("express");
const router = express.Router();
const { manualHeal } = require("../controllers/healing.controller");
const dashboardController = require("../controllers/dashboard.controller");

// Manual healing trigger (existing)
router.post("/", manualHeal);

// Feature 6 (Part-A): Get healing history
router.get("/history", dashboardController.getHealingHistory);

module.exports = router;
