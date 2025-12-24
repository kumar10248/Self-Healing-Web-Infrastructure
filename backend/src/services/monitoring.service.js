const { checkAndHeal } = require("./healing.service");
const { createAlert, SEVERITY, ALERT_TYPE } = require("./alert.service");
const dashboardService = require("./dashboard.service");

// Feature 1, 2, 3, 4 & 5: Monitoring, Detection, Healing & Alerting
exports.processMetrics = async (metrics) => {
  // Validate metrics
  if (!metrics || typeof metrics !== "object") {
    throw new Error("Invalid metrics format");
  }

  // Required fields for Feature 1
  const requiredFields = ["host", "cpu", "memory", "disk", "timestamp"];
  const missingFields = requiredFields.filter((field) => !(field in metrics));

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // Feature 6 (Part-A): Update dashboard metrics
  dashboardService.updateMetrics(metrics);

  // Log received system metrics (Feature 1)
  console.log("\n" + "=".repeat(60));
  console.log("📊 METRICS RECEIVED");
  console.log("=".repeat(60));
  console.log(`🖥️  Host:      ${metrics.host}`);
  console.log(`⚙️  CPU:       ${metrics.cpu}%`);
  console.log(`💾 Memory:    ${metrics.memory}%`);
  console.log(`💿 Disk:      ${metrics.disk}%`);
  console.log(`⏰ Timestamp: ${metrics.timestamp}`);

  // Feature 5: Check for resource threshold alerts
  checkResourceThresholds(metrics);

  // Feature 2: Process service status if present
  let healingActions = [];
  if (metrics.services && Array.isArray(metrics.services)) {
    // Feature 6 (Part-A): Update dashboard service statuses
    dashboardService.updateServices(metrics.services, metrics.timestamp);

    console.log("\n" + "─".repeat(60));
    console.log("🔍 SERVICE STATUS CHECK");
    console.log("─".repeat(60));

    for (const service of metrics.services) {
      const statusIcon = getStatusIcon(service.status);
      const statusText = service.status.toUpperCase();

      console.log(`${statusIcon} ${service.name.padEnd(15)} : ${statusText}`);

      // Feature 5: Alert on DOWN services
      if (
        service.status === "inactive" ||
        service.status === "failed" ||
        service.status === "unknown"
      ) {
        console.log(
          `   ⚠️  WARNING: Service DOWN - ${service.name} on ${metrics.host}`
        );

        // Create alert
        createAlert({
          type: ALERT_TYPE.SERVICE_DOWN,
          host: metrics.host,
          service: service.name,
          severity: SEVERITY.HIGH,
          message: `Service ${service.name} is ${service.status} on ${metrics.host}`,
        });
      }
    }

    console.log("─".repeat(60));

    // Feature 3 & 4: Auto-healing (Services + Resources)
    try {
      healingActions = await checkAndHeal(metrics);
    } catch (error) {
      console.error("❌ Error in healing service:", error.message);
    }
  } else {
    // Feature 4: Resource-based healing even without service data
    try {
      healingActions = await checkAndHeal(metrics);
    } catch (error) {
      console.error("❌ Error in healing service:", error.message);
    }
  }

  // Feature 6 (Part-A): Store healing actions in dashboard
  if (healingActions && healingActions.length > 0) {
    healingActions.forEach((action) => {
      dashboardService.addHealingAction(action);
    });
  }

  console.log("=".repeat(60) + "\n");

  return {
    received: true,
    host: metrics.host,
    timestamp: metrics.timestamp,
    servicesChecked: metrics.services ? metrics.services.length : 0,
    healingActions: healingActions || [],
  };
};

/**
 * Feature 5: Check resource thresholds and create alerts
 */
function checkResourceThresholds(metrics) {
  const THRESHOLDS = {
    CPU: 85,
    MEMORY: 80,
    DISK: 90,
  };

  // CPU threshold alert
  if (metrics.cpu > THRESHOLDS.CPU) {
    createAlert({
      type: ALERT_TYPE.RESOURCE_HIGH,
      host: metrics.host,
      resource: "CPU",
      value: metrics.cpu,
      threshold: THRESHOLDS.CPU,
      severity: metrics.cpu > 95 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
      message: `High CPU usage detected: ${metrics.cpu}% (threshold: ${THRESHOLDS.CPU}%)`,
    });
  }

  // Memory threshold alert
  if (metrics.memory > THRESHOLDS.MEMORY) {
    createAlert({
      type: ALERT_TYPE.RESOURCE_HIGH,
      host: metrics.host,
      resource: "Memory",
      value: metrics.memory,
      threshold: THRESHOLDS.MEMORY,
      severity: metrics.memory > 90 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
      message: `High memory usage detected: ${metrics.memory}% (threshold: ${THRESHOLDS.MEMORY}%)`,
    });
  }

  // Disk threshold alert
  if (metrics.disk > THRESHOLDS.DISK) {
    createAlert({
      type: ALERT_TYPE.RESOURCE_HIGH,
      host: metrics.host,
      resource: "Disk",
      value: metrics.disk,
      threshold: THRESHOLDS.DISK,
      severity: metrics.disk > 95 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
      message: `High disk usage detected: ${metrics.disk}% (threshold: ${THRESHOLDS.DISK}%)`,
    });
  }
}

/**
 * Get icon for service status
 */
function getStatusIcon(status) {
  switch (status) {
    case "active":
      return "✅";
    case "inactive":
      return "❌";
    case "failed":
      return "💥";
    case "not-installed":
      return "⚪";
    default:
      return "❓";
  }
}
