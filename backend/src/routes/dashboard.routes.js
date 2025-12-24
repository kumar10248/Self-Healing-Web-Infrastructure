/**
 * Feature 6 (Part-A): Dashboard Routes
 * 
 * General dashboard endpoints (stats, health summary)
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

/**
 * GET /api/dashboard/stats
 * Get aggregated dashboard statistics
 */
router.get("/stats", dashboardController.getDashboardStats);

/**
 * GET /api/dashboard/health
 * Get complete system health summary
 */
router.get("/health", dashboardController.getSystemHealth);

module.exports = router;
