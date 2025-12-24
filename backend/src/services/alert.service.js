// Feature 5: Alerting & Event Visibility Service

const eventLog = []; // In-memory event log (Feature 5 - no database yet)
const MAX_LOG_SIZE = 1000; // Keep last 1000 events

// Alert severity levels
const SEVERITY = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
};

// Alert types
const ALERT_TYPE = {
  SERVICE_DOWN: "SERVICE_DOWN",
  SERVICE_RECOVERED: "SERVICE_RECOVERED",
  RESOURCE_HIGH: "RESOURCE_HIGH",
  RESOURCE_STABILIZED: "RESOURCE_STABILIZED",
  HEALING_TRIGGERED: "HEALING_TRIGGERED",
  HEALING_SUCCESS: "HEALING_SUCCESS",
  HEALING_FAILED: "HEALING_FAILED",
};

// Cooldown tracking to prevent alert spam (30 seconds per alert type per host)
const alertCooldowns = new Map();
const COOLDOWN_MS = 30000; // 30 seconds

/**
 * Create and log an alert
 */
exports.createAlert = (alertData) => {
  // Validate required fields
  if (!alertData.type || !alertData.host || !alertData.message) {
    console.error("❌ Alert missing required fields:", alertData);
    return null;
  }

  // Create standardized alert object
  const alert = {
    id: generateAlertId(),
    type: alertData.type,
    host: alertData.host,
    service: alertData.service || null,
    resource: alertData.resource || null,
    value: alertData.value || null,
    threshold: alertData.threshold || null,
    severity: alertData.severity || SEVERITY.MEDIUM,
    message: alertData.message,
    timestamp: new Date().toISOString(),
    metadata: alertData.metadata || {},
  };

  // Check cooldown to prevent spam
  if (isInCooldown(alert)) {
    return null; // Silently skip duplicate alerts
  }

  // Log to event store
  addToEventLog(alert);

  // Display alert in console
  displayAlert(alert);

  // Update cooldown
  updateCooldown(alert);

  return alert;
};

/**
 * Get recent alerts (for API endpoint)
 */
exports.getRecentAlerts = (limit = 50) => {
  return eventLog.slice(-limit).reverse(); // Most recent first
};

/**
 * Get alerts by type
 */
exports.getAlertsByType = (type, limit = 50) => {
  return eventLog
    .filter((alert) => alert.type === type)
    .slice(-limit)
    .reverse();
};

/**
 * Get alerts by host
 */
exports.getAlertsByHost = (host, limit = 50) => {
  return eventLog
    .filter((alert) => alert.host === host)
    .slice(-limit)
    .reverse();
};

/**
 * Get alert statistics
 */
exports.getAlertStats = () => {
  const stats = {
    total: eventLog.length,
    bySeverity: {},
    byType: {},
    last24Hours: 0,
  };

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  eventLog.forEach((alert) => {
    // Count by severity
    stats.bySeverity[alert.severity] =
      (stats.bySeverity[alert.severity] || 0) + 1;

    // Count by type
    stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;

    // Count last 24 hours
    if (new Date(alert.timestamp).getTime() > dayAgo) {
      stats.last24Hours++;
    }
  });

  return stats;
};

/**
 * Generate unique alert ID
 */
function generateAlertId() {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Add alert to event log
 */
function addToEventLog(alert) {
  eventLog.push(alert);

  // Trim log if it exceeds max size
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.shift(); // Remove oldest
  }
}

/**
 * Check if alert is in cooldown period
 */
function isInCooldown(alert) {
  const key = `${alert.host}:${alert.type}:${alert.service || alert.resource || ""}`;
  const lastAlertTime = alertCooldowns.get(key);

  if (!lastAlertTime) {
    return false;
  }

  const timeSinceLastAlert = Date.now() - lastAlertTime;
  return timeSinceLastAlert < COOLDOWN_MS;
}

/**
 * Update cooldown timestamp
 */
function updateCooldown(alert) {
  const key = `${alert.host}:${alert.type}:${alert.service || alert.resource || ""}`;
  alertCooldowns.set(key, Date.now());
}

/**
 * Display alert in console with formatting
 */
function displayAlert(alert) {
  const icon = getAlertIcon(alert.type);
  const severityIcon = getSeverityIcon(alert.severity);
  const color = getSeverityColor(alert.severity);

  console.log("\n" + "█".repeat(70));
  console.log(`${icon} ${color}ALERT: ${alert.type}${getResetColor()}`);
  console.log("█".repeat(70));
  console.log(`${severityIcon} Severity:  ${alert.severity}`);
  console.log(`📍 Host:      ${alert.host}`);

  if (alert.service) {
    console.log(`🔧 Service:   ${alert.service}`);
  }

  if (alert.resource) {
    console.log(`📊 Resource:  ${alert.resource}`);
    if (alert.value !== null) {
      console.log(`📈 Value:     ${alert.value}%`);
    }
    if (alert.threshold !== null) {
      console.log(`⚠️  Threshold: ${alert.threshold}%`);
    }
  }

  console.log(`💬 Message:   ${alert.message}`);
  console.log(`⏰ Time:      ${alert.timestamp}`);
  console.log(`🆔 Alert ID:  ${alert.id}`);
  console.log("█".repeat(70) + "\n");
}

/**
 * Get icon for alert type
 */
function getAlertIcon(type) {
  const icons = {
    SERVICE_DOWN: "🚨",
    SERVICE_RECOVERED: "✅",
    RESOURCE_HIGH: "⚠️",
    RESOURCE_STABILIZED: "📉",
    HEALING_TRIGGERED: "🔧",
    HEALING_SUCCESS: "🎯",
    HEALING_FAILED: "❌",
  };
  return icons[type] || "📢";
}

/**
 * Get icon for severity
 */
function getSeverityIcon(severity) {
  const icons = {
    LOW: "ℹ️",
    MEDIUM: "⚠️",
    HIGH: "🔴",
    CRITICAL: "🚨",
  };
  return icons[severity] || "⚠️";
}

/**
 * Get ANSI color for severity
 */
function getSeverityColor(severity) {
  const colors = {
    LOW: "\x1b[36m", // Cyan
    MEDIUM: "\x1b[33m", // Yellow
    HIGH: "\x1b[31m", // Red
    CRITICAL: "\x1b[35m", // Magenta
  };
  return colors[severity] || "\x1b[37m"; // White
}

/**
 * Reset ANSI color
 */
function getResetColor() {
  return "\x1b[0m";
}

// Export constants
exports.SEVERITY = SEVERITY;
exports.ALERT_TYPE = ALERT_TYPE;
