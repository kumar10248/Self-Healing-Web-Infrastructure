/**
 * Feature 6 (Part-A): Dashboard API Controllers
 * 
 * Read-only APIs to expose system state for dashboard visualization.
 * No side effects - only data retrieval.
 */

const dashboardService = require("../services/dashboard.service");
const alertService = require("../services/alert.service");

/**
 * Get latest system metrics
 * GET /api/metrics/latest
 */
exports.getLatestMetrics = (req, res) => {
  try {
    const metrics = dashboardService.getLatestMetrics();

    if (!metrics) {
      return res.status(200).json({
        success: true,
        message: "No metrics available yet",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error("Error fetching latest metrics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch metrics",
      error: error.message,
    });
  }
};

/**
 * Get all service statuses
 * GET /api/metrics/services
 */
exports.getServices = (req, res) => {
  try {
    const services = dashboardService.getServices();

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch services",
      error: error.message,
    });
  }
};

/**
 * Get specific service status
 * GET /api/metrics/services/:serviceName
 */
exports.getServiceStatus = (req, res) => {
  try {
    const { serviceName } = req.params;

    if (!serviceName) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    const service = dashboardService.getServiceStatus(serviceName);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: `Service '${serviceName}' not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error fetching service status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch service status",
      error: error.message,
    });
  }
};

/**
 * Get healing history
 * GET /api/heal/history?limit=50
 */
exports.getHealingHistory = (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : null;

    if (limit && (isNaN(limit) || limit <= 0)) {
      return res.status(400).json({
        success: false,
        message: "Invalid limit parameter. Must be a positive number.",
      });
    }

    const history = dashboardService.getHealingHistory(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching healing history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch healing history",
      error: error.message,
    });
  }
};

/**
 * Get dashboard statistics (overview)
 * GET /api/dashboard/stats
 */
exports.getDashboardStats = (req, res) => {
  try {
    const stats = dashboardService.getDashboardStats();

    // Also include alert stats
    const alertStats = alertService.getAlertStats();

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        alerts: alertStats.statistics,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

/**
 * Get system health summary (single endpoint for everything)
 * GET /api/dashboard/health
 */
exports.getSystemHealth = (req, res) => {
  try {
    const metrics = dashboardService.getLatestMetrics();
    const services = dashboardService.getServices();
    const recentHealing = dashboardService.getHealingHistory(10);
    const recentAlerts = alertService.getRecentAlerts(10);

    // Determine overall health status
    let healthStatus = "healthy";
    
    if (!metrics) {
      healthStatus = "unknown";
    } else {
      const hasDownServices = services.some(
        (s) => s.status === "inactive" || s.status === "failed"
      );
      const hasHighResources =
        metrics.cpu > 85 || metrics.memory > 80 || metrics.disk > 90;
      const hasRecentFailures = recentHealing.some((h) => h.result === "failed");

      if (hasDownServices || hasRecentFailures) {
        healthStatus = "critical";
      } else if (hasHighResources) {
        healthStatus = "warning";
      }
    }

    return res.status(200).json({
      success: true,
      healthStatus: healthStatus,
      data: {
        metrics: metrics,
        services: services,
        recentHealing: recentHealing,
        recentAlerts: recentAlerts,
      },
    });
  } catch (error) {
    console.error("Error fetching system health:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch system health",
      error: error.message,
    });
  }
};
