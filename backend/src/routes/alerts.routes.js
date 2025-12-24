// Feature 5: Alerts API Routes

const express = require("express");
const router = express.Router();
const {
  getAlerts,
  getAlertsByType,
  getAlertsByHost,
  getAlertStats,
} = require("../controllers/alerts.controller");

// Get recent alerts
router.get("/", getAlerts);

// Get alert statistics
router.get("/stats", getAlertStats);

// Get alerts by type
router.get("/type/:type", getAlertsByType);

// Get alerts by host
router.get("/host/:host", getAlertsByHost);

module.exports = router;
