/**
 * Phase 4: Historical Metrics Routes
 * API endpoints for 24-hour trend visualization
 */

const express = require('express');
const router = express.Router();
const historyController = require('../controllers/history.controller');

/**
 * GET /api/history/metrics
 * Get all historical metrics (CPU, Memory, Disk) for last 8-24 hours
 * Query params: ?host=localhost&limit=2880
 */
router.get('/metrics', historyController.getHistoricalMetrics);

/**
 * GET /api/history/metrics/:resource
 * Get historical data for specific resource (cpu, memory, or disk)
 * Example: /api/history/metrics/cpu?host=localhost&limit=1000
 */
router.get('/metrics/:resource', historyController.getResourceHistory);

/**
 * GET /api/history/summary
 * Get summary statistics (min/max/avg) for all resources
 * Query params: ?host=localhost&limit=2880
 */
router.get('/summary', historyController.getMetricsSummary);

module.exports = router;
