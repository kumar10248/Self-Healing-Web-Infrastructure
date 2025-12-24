// Feature 5: Alerts API Controller

const alertService = require("../services/alert.service");

/**
 * Get recent alerts
 * GET /api/alerts
 */
exports.getAlerts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const alerts = alertService.getRecentAlerts(limit);

    res.json({
      success: true,
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get alerts by type
 * GET /api/alerts/type/:type
 */
exports.getAlertsByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const alerts = alertService.getAlertsByType(type, limit);

    res.json({
      success: true,
      type: type,
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get alerts by host
 * GET /api/alerts/host/:host
 */
exports.getAlertsByHost = async (req, res, next) => {
  try {
    const { host } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const alerts = alertService.getAlertsByHost(host, limit);

    res.json({
      success: true,
      host: host,
      count: alerts.length,
      alerts: alerts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get alert statistics
 * GET /api/alerts/stats
 */
exports.getAlertStats = async (req, res, next) => {
  try {
    const stats = alertService.getAlertStats();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error) {
    next(error);
  }
};
