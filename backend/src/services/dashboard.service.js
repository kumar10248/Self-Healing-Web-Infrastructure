/**
 * Feature 6 (Part-A): Dashboard Data Service
 * Phase 1: Database persistence for metrics and healing history
 * 
 * Hybrid approach: In-memory cache + Database persistence
 */

const dbService = require('../database/db.service');
const os = require('os');

// ============================================================================
// IN-MEMORY DATA STORES (for quick access + backward compatibility)
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
 * Healing history (in-memory cache for quick access)
 */
const MAX_HEALING_HISTORY = 100;
let healingHistory = [];

// ============================================================================
// UPDATE FUNCTIONS (called by monitoring/healing services)
// ============================================================================

/**
 * Update latest metrics
 * Called by monitoring.service.js when agent sends metrics
 * Phase 1: Now also saves to database
 */
exports.updateMetrics = async (metrics) => {
  // Update in-memory cache
  latestMetrics = {
    host: metrics.host,
    cpu: metrics.cpu,
    memory: metrics.memory,
    disk: metrics.disk,
    timestamp: metrics.timestamp,
  };
  
  // Save to database (Phase 1: persistence)
  try {
    await dbService.insertMetric(latestMetrics);
  } catch (error) {
    console.error('❌ Failed to save metrics to database:', error.message);
    // Continue execution (graceful degradation)
  }
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
 * Phase 1: Now also saves to database
 */
exports.addHealingAction = async (action) => {
  const healingEntry = {
    action: action.action || action.type,
    target: action.service || action.resource || "unknown",
    result: action.status,
    details: action.error || action.message || null,
    host: action.host || os.hostname(),
    timestamp: action.timestamp || new Date().toISOString(),
  };

  // Add to in-memory cache
  healingHistory.unshift(healingEntry);

  // Keep only last MAX_HEALING_HISTORY entries
  if (healingHistory.length > MAX_HEALING_HISTORY) {
    healingHistory = healingHistory.slice(0, MAX_HEALING_HISTORY);
  }
  
  // Save to database (Phase 1: persistence)
  try {
    await dbService.insertHealingAction(healingEntry);
  } catch (error) {
    console.error('❌ Failed to save healing action to database:', error.message);
    // Continue execution (graceful degradation)
  }
};

// ============================================================================
// READ FUNCTIONS (called by API controllers)
// Phase 1: Now reads from database with in-memory fallback
// ============================================================================

/**
 * Get latest system metrics
 * Returns null if no metrics available yet
 * Phase 1: Tries database first, falls back to memory
 */
exports.getLatestMetrics = async () => {
  try {
    const host = os.hostname();
    const dbMetric = await dbService.getLatestMetric(host);
    return dbMetric || latestMetrics;
  } catch (error) {
    console.error('❌ Failed to fetch metrics from database:', error.message);
    return latestMetrics; // Fallback to in-memory
  }
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
 * Phase 1: Now reads from database with in-memory fallback
 */
exports.getHealingHistory = async (limit = null) => {
  try {
    const host = os.hostname();
    const dbHistory = await dbService.getHealingActions({ host, limit: limit || 100 });
    return dbHistory.length > 0 ? dbHistory : healingHistory;
  } catch (error) {
    console.error('❌ Failed to fetch healing history from database:', error.message);
    // Fallback to in-memory
    if (limit && typeof limit === "number" && limit > 0) {
      return healingHistory.slice(0, limit);
    }
    return healingHistory;
  }
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
