/**
 * Phase 2: Policy Management Routes
 */

const express = require('express');
const router = express.Router();
const policiesController = require('../controllers/policies.controller');

/**
 * GET /api/policies
 * Get all current policies
 */
router.get('/', policiesController.getPolicies);

/**
 * POST /api/policies/reload
 * Reload policies from file without restart
 */
router.post('/reload', policiesController.reloadPolicies);

/**
 * GET /api/policies/resources/:resource
 * Get specific resource policy (cpu, memory, disk)
 */
router.get('/resources/:resource', policiesController.getResourcePolicy);

module.exports = router;
