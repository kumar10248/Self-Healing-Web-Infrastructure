const { runCommand } = require("../utils/shell");
const { createAlert, SEVERITY, ALERT_TYPE } = require("./alert.service");
const path = require("path");

// Path to healing scripts
const SCRIPTS_DIR = path.join(__dirname, "../../../scripts");
const RESTART_SCRIPT = path.join(SCRIPTS_DIR, "restart-service.sh");
const KILL_PROCESS_SCRIPT = path.join(SCRIPTS_DIR, "kill-process.sh");
const CLEANUP_MEMORY_SCRIPT = path.join(SCRIPTS_DIR, "cleanup-memory.sh");
const CLEANUP_DISK_SCRIPT = path.join(SCRIPTS_DIR, "cleanup-disk.sh");

// Feature 4: Resource thresholds (industry-realistic values)
const THRESHOLDS = {
  CPU: 85, // > 85% triggers CPU mitigation
  MEMORY: 80, // > 80% triggers memory cleanup
  DISK: 90, // > 90% triggers disk cleanup
};

// Cooldown tracking to prevent repeated actions (in milliseconds)
const COOLDOWN_PERIOD = 60000; // 60 seconds
const lastHealingActions = {
  cpu: 0,
  memory: 0,
  disk: 0,
};

/**
 * Feature 3 & 4: Check services and resources, heal if needed
 */
exports.checkAndHeal = async (metrics) => {
  const healingActions = [];

  // Feature 3: Service-based healing
  if (metrics.services && Array.isArray(metrics.services)) {
    const serviceActions = await healServices(metrics);
    healingActions.push(...serviceActions);
  }

  // Feature 4: Resource-based healing
  const resourceActions = await healResources(metrics);
  healingActions.push(...resourceActions);

  return healingActions;
};

/**
 * Feature 3: Heal crashed services
 */
async function healServices(metrics) {
  const healingActions = [];

  for (const service of metrics.services) {
    // Skip services that are not installed
    if (service.status === "not-installed") {
      continue;
    }

    // Check if service needs healing
    if (shouldHealService(service)) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`�� SERVICE HEALING TRIGGERED`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📍 Host:    ${metrics.host}`);
      console.log(`🔧 Service: ${service.name}`);
      console.log(`❌ Status:  ${service.status.toUpperCase()}`);
      console.log(`⏰ Time:    ${new Date().toISOString()}`);
      console.log(`${"=".repeat(60)}\n`);

      // Feature 5: Alert - Healing triggered
      createAlert({
        type: ALERT_TYPE.HEALING_TRIGGERED,
        host: metrics.host,
        service: service.name,
        resource: null,
        severity: SEVERITY.MEDIUM,
        message: `Attempting to restart ${service.name} on ${metrics.host}`,
        details: { status: service.status, action: "restart" },
      });

      try {
        // Execute healing action
        const result = await healService(service.name);

        console.log(`✅ HEALING SUCCESSFUL: ${service.name}`);
        console.log(`   Output: ${result.trim()}`);

        // Feature 5: Alert - Healing success
        createAlert({
          type: ALERT_TYPE.HEALING_SUCCESS,
          host: metrics.host,
          service: service.name,
          resource: null,
          severity: SEVERITY.LOW,
          message: `Successfully restarted ${service.name} on ${metrics.host}`,
          details: { action: "restart", output: result.trim() },
        });

        healingActions.push({
          type: "service",
          service: service.name,
          status: "success",
          action: "restart",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`❌ HEALING FAILED: ${service.name}`);
        console.error(`   Error: ${error.message}`);

        // Feature 5: Alert - Healing failure
        createAlert({
          type: ALERT_TYPE.HEALING_FAILED,
          host: metrics.host,
          service: service.name,
          resource: null,
          severity: SEVERITY.HIGH,
          message: `Failed to restart ${service.name} on ${metrics.host}`,
          details: { action: "restart", error: error.message },
        });

        healingActions.push({
          type: "service",
          service: service.name,
          status: "failed",
          action: "restart",
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  return healingActions;
}

/**
 * Feature 4: Heal resource overload
 */
async function healResources(metrics) {
  const healingActions = [];
  const now = Date.now();

  // CPU Healing
  if (metrics.cpu > THRESHOLDS.CPU && canHeal("cpu", now)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚨 RESOURCE HEALING TRIGGERED: CPU`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 Host:     ${metrics.host}`);
    console.log(`⚙️  CPU:      ${metrics.cpu}%`);
    console.log(`⚠️  Threshold: ${THRESHOLDS.CPU}%`);
    console.log(`🔧 Action:   Kill top CPU consumer`);
    console.log(`⏰ Time:     ${new Date().toISOString()}`);
    console.log(`${"=".repeat(60)}\n`);

    // Feature 5: Alert - Resource healing triggered
    createAlert({
      type: ALERT_TYPE.HEALING_TRIGGERED,
      host: metrics.host,
      service: null,
      resource: "CPU",
      severity: SEVERITY.HIGH,
      message: `CPU healing triggered: ${metrics.cpu}% usage (threshold: ${THRESHOLDS.CPU}%)`,
      details: { value: metrics.cpu, threshold: THRESHOLDS.CPU, action: "kill-process" },
    });

    try {
      const result = await runCommand(`sudo bash ${KILL_PROCESS_SCRIPT}`);
      console.log(`✅ CPU MITIGATION SUCCESSFUL`);
      console.log(`   ${result.trim()}`);
      
      // Feature 5: Alert - Resource healing success
      createAlert({
        type: ALERT_TYPE.HEALING_SUCCESS,
        host: metrics.host,
        service: null,
        resource: "CPU",
        severity: SEVERITY.LOW,
        message: `CPU healing completed successfully on ${metrics.host}`,
        details: { value: metrics.cpu, action: "kill-process", output: result.trim() },
      });

      lastHealingActions.cpu = now;
      healingActions.push({
        type: "resource",
        resource: "cpu",
        value: metrics.cpu,
        threshold: THRESHOLDS.CPU,
        status: "success",
        action: "kill-process",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ CPU MITIGATION FAILED`);
      console.error(`   Error: ${error.message}`);
      
      // Feature 5: Alert - Resource healing failure
      createAlert({
        type: ALERT_TYPE.HEALING_FAILED,
        host: metrics.host,
        service: null,
        resource: "CPU",
        severity: SEVERITY.CRITICAL,
        message: `CPU healing failed on ${metrics.host}`,
        details: { value: metrics.cpu, action: "kill-process", error: error.message },
      });

      healingActions.push({
        type: "resource",
        resource: "cpu",
        value: metrics.cpu,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Memory Healing
  if (metrics.memory > THRESHOLDS.MEMORY && canHeal("memory", now)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚨 RESOURCE HEALING TRIGGERED: MEMORY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 Host:     ${metrics.host}`);
    console.log(`💾 Memory:   ${metrics.memory}%`);
    console.log(`⚠️  Threshold: ${THRESHOLDS.MEMORY}%`);
    console.log(`🔧 Action:   Clear system caches`);
    console.log(`⏰ Time:     ${new Date().toISOString()}`);
    console.log(`${"=".repeat(60)}\n`);

    // Feature 5: Alert - Memory healing triggered
    createAlert({
      type: ALERT_TYPE.HEALING_TRIGGERED,
      host: metrics.host,
      service: null,
      resource: "Memory",
      severity: SEVERITY.HIGH,
      message: `Memory healing triggered: ${metrics.memory}% usage (threshold: ${THRESHOLDS.MEMORY}%)`,
      details: { value: metrics.memory, threshold: THRESHOLDS.MEMORY, action: "clear-caches" },
    });

    try {
      const result = await runCommand(`sudo bash ${CLEANUP_MEMORY_SCRIPT}`);
      console.log(`✅ MEMORY CLEANUP SUCCESSFUL`);
      console.log(`   ${result.trim()}`);
      
      // Feature 5: Alert - Memory healing success
      createAlert({
        type: ALERT_TYPE.HEALING_SUCCESS,
        host: metrics.host,
        service: null,
        resource: "Memory",
        severity: SEVERITY.LOW,
        message: `Memory healing completed successfully on ${metrics.host}`,
        details: { value: metrics.memory, action: "clear-caches", output: result.trim() },
      });

      lastHealingActions.memory = now;
      healingActions.push({
        type: "resource",
        resource: "memory",
        value: metrics.memory,
        threshold: THRESHOLDS.MEMORY,
        status: "success",
        action: "clear-caches",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ MEMORY CLEANUP FAILED`);
      console.error(`   Error: ${error.message}`);
      
      // Feature 5: Alert - Memory healing failure
      createAlert({
        type: ALERT_TYPE.HEALING_FAILED,
        host: metrics.host,
        service: null,
        resource: "Memory",
        severity: SEVERITY.CRITICAL,
        message: `Memory healing failed on ${metrics.host}`,
        details: { value: metrics.memory, action: "clear-caches", error: error.message },
      });

      healingActions.push({
        type: "resource",
        resource: "memory",
        value: metrics.memory,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Disk Healing
  if (metrics.disk > THRESHOLDS.DISK && canHeal("disk", now)) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚨 RESOURCE HEALING TRIGGERED: DISK`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 Host:     ${metrics.host}`);
    console.log(`💿 Disk:     ${metrics.disk}%`);
    console.log(`⚠️  Threshold: ${THRESHOLDS.DISK}%`);
    console.log(`🔧 Action:   Clean logs and temp files`);
    console.log(`⏰ Time:     ${new Date().toISOString()}`);
    console.log(`${"=".repeat(60)}\n`);

    // Feature 5: Alert - Disk healing triggered
    createAlert({
      type: ALERT_TYPE.HEALING_TRIGGERED,
      host: metrics.host,
      service: null,
      resource: "Disk",
      severity: SEVERITY.HIGH,
      message: `Disk healing triggered: ${metrics.disk}% usage (threshold: ${THRESHOLDS.DISK}%)`,
      details: { value: metrics.disk, threshold: THRESHOLDS.DISK, action: "cleanup-disk" },
    });

    try {
      const result = await runCommand(`sudo bash ${CLEANUP_DISK_SCRIPT}`);
      console.log(`✅ DISK CLEANUP SUCCESSFUL`);
      console.log(`   ${result.trim()}`);
      
      // Feature 5: Alert - Disk healing success
      createAlert({
        type: ALERT_TYPE.HEALING_SUCCESS,
        host: metrics.host,
        service: null,
        resource: "Disk",
        severity: SEVERITY.LOW,
        message: `Disk healing completed successfully on ${metrics.host}`,
        details: { value: metrics.disk, action: "cleanup-disk", output: result.trim() },
      });

      lastHealingActions.disk = now;
      healingActions.push({
        type: "resource",
        resource: "disk",
        value: metrics.disk,
        threshold: THRESHOLDS.DISK,
        status: "success",
        action: "cleanup-disk",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ DISK CLEANUP FAILED`);
      console.error(`   Error: ${error.message}`);
      
      // Feature 5: Alert - Disk healing failure
      createAlert({
        type: ALERT_TYPE.HEALING_FAILED,
        host: metrics.host,
        service: null,
        resource: "Disk",
        severity: SEVERITY.CRITICAL,
        message: `Disk healing failed on ${metrics.host}`,
        details: { value: metrics.disk, action: "cleanup-disk", error: error.message },
      });

      healingActions.push({
        type: "resource",
        resource: "disk",
        value: metrics.disk,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return healingActions;
}

/**
 * Determine if a service needs healing
 */
function shouldHealService(service) {
  // Heal if service is inactive or failed
  const needsHealing = ["inactive", "failed", "unknown"].includes(
    service.status
  );
  return needsHealing;
}

/**
 * Check if we can heal (cooldown protection)
 */
function canHeal(resourceType, now) {
  const lastAction = lastHealingActions[resourceType];
  const timeSinceLastAction = now - lastAction;
  
  // Allow healing only if cooldown period has passed
  return timeSinceLastAction >= COOLDOWN_PERIOD;
}

/**
 * Execute healing action for a service
 */
async function healService(serviceName) {
  console.log(`🔧 Executing: bash ${RESTART_SCRIPT} ${serviceName}`);
  
  const command = `bash ${RESTART_SCRIPT} ${serviceName}`;
  const output = await runCommand(command);
  
  return output;
}

/**
 * Generic healing action executor (for future use)
 */
exports.executeHealing = async (action) => {
  return runCommand(action);
};
