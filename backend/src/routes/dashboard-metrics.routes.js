/**
 * Feature 6 (Part-A): Dashboard API Routes
 * 
 * Read-only endpoints for dashboard visualization.
 */

const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");

// ============================================================================
// METRICS ENDPOINTS
// ============================================================================

/**
 * GET /api/metrics/latest
 * Get the latest system metrics (CPU, memory, disk)
 */
router.get("/latest", dashboardController.getLatestMetrics);

/**
 * GET /api/metrics/services
 * Get all service statuses
 */
router.get("/services", dashboardController.getServices);

/**
 * GET /api/metrics/services/:serviceName
 * Get specific service status
 */
router.get("/services/:serviceName", dashboardController.getServiceStatus);

module.exports = router;
