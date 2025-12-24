/**
 * Phase 2: Policy Management API Controller
 * 
 * Allows viewing and reloading policies without restart
 * Industry-realistic: Change thresholds on-the-fly
 */

const policies = require('../config/policies');

/**
 * Get current policies
 * GET /api/policies
 */
exports.getPolicies = (req, res) => {
  try {
    const allPolicies = policies.getAllPolicies();
    const info = policies.getPolicyInfo();
    
    return res.status(200).json({
      success: true,
      data: allPolicies,
      info: info,
      message: 'Current system policies',
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch policies',
      error: error.message,
    });
  }
};

/**
 * Reload policies from file (hot-reload)
 * POST /api/policies/reload
 */
exports.reloadPolicies = (req, res) => {
  try {
    const reloaded = policies.reloadPolicies();
    const info = policies.getPolicyInfo();
    
    console.log('✅ Policies reloaded via API');
    
    return res.status(200).json({
      success: true,
      data: reloaded,
      info: info,
      message: 'Policies reloaded successfully. New thresholds will be used for next check.',
    });
  } catch (error) {
    console.error('Error reloading policies:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reload policies',
      error: error.message,
    });
  }
};

/**
 * Get specific resource policy
 * GET /api/policies/resources/:resource
 */
exports.getResourcePolicy = (req, res) => {
  try {
    const { resource } = req.params;
    
    let policy;
    switch (resource.toLowerCase()) {
      case 'cpu':
        policy = policies.getCpuPolicy();
        break;
      case 'memory':
        policy = policies.getMemoryPolicy();
        break;
      case 'disk':
        policy = policies.getDiskPolicy();
        break;
      default:
        return res.status(404).json({
          success: false,
          message: `Unknown resource: ${resource}. Valid: cpu, memory, disk`,
        });
    }
    
    return res.status(200).json({
      success: true,
      resource: resource.toLowerCase(),
      data: policy,
    });
  } catch (error) {
    console.error('Error fetching resource policy:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch resource policy',
      error: error.message,
    });
  }
};
