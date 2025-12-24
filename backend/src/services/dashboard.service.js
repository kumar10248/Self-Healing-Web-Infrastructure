/**
 * Feature 6 (Part-A): Dashboard Data Service
 * 
 * In-memory storage for system state data.
 * Provides centralized access to latest metrics, services, alerts, and healing history.
 */

// ============================================================================
// IN-MEMORY DATA STORES
// ============================================================================

/**
 * Latest system metrics from agent
 * Updated every time agent sends metrics
 */
let latestMetrics = null;

/**
 * Service status map
 * Key: service name (e.g., "nginx")
 * Value: { status, lastChecked }
 */
let services = {};

/**
 * Healing history (last 100 actions)
 * Stores all healing actions (service restarts, resource cleanup)
 */
const MAX_HEALING_HISTORY = 100;
let healingHistory = [];

// ============================================================================
// UPDATE FUNCTIONS (called by monitoring/healing services)
// ============================================================================

/**
 * Update latest metrics
 * Called by monitoring.service.js when agent sends metrics
 */
exports.updateMetrics = (metrics) => {
  latestMetrics = {
    host: metrics.host,
    cpu: metrics.cpu,
    memory: metrics.memory,
    disk: metrics.disk,
    timestamp: metrics.timestamp,
  };
};

/**
 * Update service status
 * Called by monitoring.service.js when processing service data
 */
exports.updateServiceStatus = (serviceName, status, timestamp) => {
  services[serviceName] = {
    status: status,
    lastChecked: timestamp || new Date().toISOString(),
  };
};

/**
 * Update multiple services at once
 * Called by monitoring.service.js when agent sends service array
 */
exports.updateServices = (serviceArray, timestamp) => {
  if (!Array.isArray(serviceArray)) {
    return;
  }

  const checkTime = timestamp || new Date().toISOString();

  for (const service of serviceArray) {
    services[service.name] = {
      status: service.status,
      lastChecked: checkTime,
    };
  }
};

/**
 * Add healing action to history
 * Called by healing.service.js after executing healing action
 */
exports.addHealingAction = (action) => {
  const healingEntry = {
    action: action.action || action.type,
    target: action.service || action.resource || "unknown",
    result: action.status,
    details: action.error || action.message || null,
    timestamp: action.timestamp || new Date().toISOString(),
  };

  // Add to beginning of array
  healingHistory.unshift(healingEntry);

  // Keep only last MAX_HEALING_HISTORY entries
  if (healingHistory.length > MAX_HEALING_HISTORY) {
    healingHistory = healingHistory.slice(0, MAX_HEALING_HISTORY);
  }
};

// ============================================================================
// READ FUNCTIONS (called by API controllers)
// ============================================================================

/**
 * Get latest system metrics
 * Returns null if no metrics available yet
 */
exports.getLatestMetrics = () => {
  return latestMetrics;
};

/**
 * Get all service statuses
 * Returns array of services with their status
 */
exports.getServices = () => {
  return Object.keys(services).map((serviceName) => ({
    service: serviceName,
    status: services[serviceName].status,
    lastChecked: services[serviceName].lastChecked,
  }));
};

/**
 * Get specific service status
 * Returns null if service not found
 */
exports.getServiceStatus = (serviceName) => {
  if (!services[serviceName]) {
    return null;
  }

  return {
    service: serviceName,
    status: services[serviceName].status,
    lastChecked: services[serviceName].lastChecked,
  };
};

/**
 * Get healing history
 * @param {number} limit - Maximum number of entries to return (default: all)
 * @returns {Array} Array of healing actions
 */
exports.getHealingHistory = (limit = null) => {
  if (limit && typeof limit === "number" && limit > 0) {
    return healingHistory.slice(0, limit);
  }
  return healingHistory;
};

/**
 * Get dashboard statistics
 * Returns aggregated statistics for overview
 */
exports.getDashboardStats = () => {
  // Count services by status
  const serviceStats = {
    total: 0,
    active: 0,
    inactive: 0,
    failed: 0,
    unknown: 0,
  };

  Object.values(services).forEach((service) => {
    serviceStats.total++;
    if (service.status === "active") {
      serviceStats.active++;
    } else if (service.status === "inactive") {
      serviceStats.inactive++;
    } else if (service.status === "failed") {
      serviceStats.failed++;
    } else {
      serviceStats.unknown++;
    }
  });

  // Count healing actions by result
  const healingStats = {
    total: healingHistory.length,
    success: 0,
    failed: 0,
    lastAction: healingHistory.length > 0 ? healingHistory[0].timestamp : null,
  };

  healingHistory.forEach((action) => {
    if (action.result === "success") {
      healingStats.success++;
    } else if (action.result === "failed") {
      healingStats.failed++;
    }
  });

  return {
    metrics: latestMetrics,
    services: serviceStats,
    healing: healingStats,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear all data (for testing purposes)
 */
exports.clearAllData = () => {
  latestMetrics = null;
  services = {};
  healingHistory = [];
};

/**
 * Get data store info (for debugging)
 */
exports.getStoreInfo = () => {
  return {
    hasMetrics: latestMetrics !== null,
    serviceCount: Object.keys(services).length,
    healingHistoryCount: healingHistory.length,
  };
};
