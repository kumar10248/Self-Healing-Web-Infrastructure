const { runCommand } = require("../utils/shell");
const { createAlert, SEVERITY, ALERT_TYPE } = require("./alert.service");
const policies = require("../config/policies");
const path = require("path");

// Path to healing scripts
const SCRIPTS_DIR = path.join(__dirname, "../../../scripts");
const RESTART_SCRIPT = path.join(SCRIPTS_DIR, "restart-service.sh");
const KILL_PROCESS_SCRIPT = path.join(SCRIPTS_DIR, "kill-process.sh");
const CLEANUP_MEMORY_SCRIPT = path.join(SCRIPTS_DIR, "cleanup-memory.sh");
const CLEANUP_DISK_SCRIPT = path.join(SCRIPTS_DIR, "cleanup-disk.sh");

// Phase 2: Thresholds now loaded from policies.json (configurable)
// No more hard-coded values!

// Phase 3: Safety Guardrails - Retry tracking to prevent infinite loops
const retryCounters = {
  cpu: { count: 0, lastResetTime: Date.now() },
  memory: { count: 0, lastResetTime: Date.now() },
  disk: { count: 0, lastResetTime: Date.now() },
  services: {}, // Dynamic per-service tracking: { serviceName: { count, lastResetTime } }
};

// Cooldown tracking to prevent repeated actions (in milliseconds)
// Phase 2: Cooldowns also configurable via policies
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
      // Phase 3: Check retry limit before healing
      if (!canRetry(service.name, true)) {
        raiseMaxRetriesAlert(metrics.host, service.name, true);
        continue; // Skip this service, max retries exceeded
      }
      
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🔧 SERVICE HEALING TRIGGERED`);
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

        // Phase 3: Increment retry counter after healing attempt
        incrementRetryCounter(service.name, true);

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

        // Phase 3: Increment retry counter even on failure
        incrementRetryCounter(service.name, true);

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

  // Phase 2: Load policies for thresholds
  const cpuPolicy = policies.getCpuPolicy();
  const memoryPolicy = policies.getMemoryPolicy();
  const diskPolicy = policies.getDiskPolicy();

  // CPU Healing
  if (cpuPolicy.enabled && metrics.cpu > cpuPolicy.threshold && canHeal("cpu", now)) {
    // Phase 3: Check retry limit before healing
    if (!canRetry("cpu")) {
      raiseMaxRetriesAlert(metrics.host, "cpu", false);
      return healingActions; // Stop healing, max retries exceeded
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚨 RESOURCE HEALING TRIGGERED: CPU`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 Host:     ${metrics.host}`);
    console.log(`⚙️  CPU:      ${metrics.cpu}%`);
    console.log(`⚠️  Threshold: ${cpuPolicy.threshold}%`);
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
      message: `CPU healing triggered: ${metrics.cpu}% usage (threshold: ${cpuPolicy.threshold}%)`,
      details: { value: metrics.cpu, threshold: cpuPolicy.threshold, action: "kill-process" },
    });

    try {
      const result = await runCommand(`sudo bash ${KILL_PROCESS_SCRIPT}`);
      console.log(`✅ CPU MITIGATION SUCCESSFUL`);
      console.log(`   ${result.trim()}`);
      
      // Phase 3: Increment retry counter after healing attempt
      incrementRetryCounter("cpu");
      
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
        threshold: cpuPolicy.threshold,
        status: "success",
        action: "kill-process",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ CPU MITIGATION FAILED`);
      console.error(`   Error: ${error.message}`);
      
      // Phase 3: Increment retry counter even on failure
      incrementRetryCounter("cpu");
      
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
  if (memoryPolicy.enabled && metrics.memory > memoryPolicy.threshold && canHeal("memory", now)) {
    // Phase 3: Check retry limit before healing
    if (!canRetry("memory")) {
      raiseMaxRetriesAlert(metrics.host, "memory", false);
      return healingActions; // Stop healing, max retries exceeded
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚨 RESOURCE HEALING TRIGGERED: MEMORY`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 Host:     ${metrics.host}`);
    console.log(`💾 Memory:   ${metrics.memory}%`);
    console.log(`⚠️  Threshold: ${memoryPolicy.threshold}%`);
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
      message: `Memory healing triggered: ${metrics.memory}% usage (threshold: ${memoryPolicy.threshold}%)`,
      details: { value: metrics.memory, threshold: memoryPolicy.threshold, action: "clear-caches" },
    });

    try {
      const result = await runCommand(`sudo bash ${CLEANUP_MEMORY_SCRIPT}`);
      console.log(`✅ MEMORY CLEANUP SUCCESSFUL`);
      console.log(`   ${result.trim()}`);
      
      // Phase 3: Increment retry counter after healing attempt
      incrementRetryCounter("memory");
      
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
        threshold: memoryPolicy.threshold,
        status: "success",
        action: "clear-caches",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ MEMORY CLEANUP FAILED`);
      console.error(`   Error: ${error.message}`);
      
      // Phase 3: Increment retry counter even on failure
      incrementRetryCounter("memory");
      
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
  if (diskPolicy.enabled && metrics.disk > diskPolicy.threshold && canHeal("disk", now)) {
    // Phase 3: Check retry limit before healing
    if (!canRetry("disk")) {
      raiseMaxRetriesAlert(metrics.host, "disk", false);
      return healingActions; // Stop healing, max retries exceeded
    }
    
    console.log(`\n${"=".repeat(60)}`);
    console.log(`🚨 RESOURCE HEALING TRIGGERED: DISK`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📍 Host:     ${metrics.host}`);
    console.log(`💿 Disk:     ${metrics.disk}%`);
    console.log(`⚠️  Threshold: ${diskPolicy.threshold}%`);
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
      message: `Disk healing triggered: ${metrics.disk}% usage (threshold: ${diskPolicy.threshold}%)`,
      details: { value: metrics.disk, threshold: diskPolicy.threshold, action: "cleanup-disk" },
    });

    try {
      const result = await runCommand(`sudo bash ${CLEANUP_DISK_SCRIPT}`);
      console.log(`✅ DISK CLEANUP SUCCESSFUL`);
      console.log(`   ${result.trim()}`);
      
      // Phase 3: Increment retry counter after healing attempt
      incrementRetryCounter("disk");
      
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
        threshold: diskPolicy.threshold,
        status: "success",
        action: "cleanup-disk",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ DISK CLEANUP FAILED`);
      console.error(`   Error: ${error.message}`);
      
      // Phase 3: Increment retry counter even on failure
      incrementRetryCounter("disk");
      
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
 * Phase 2: Uses configurable cooldown from policies
 */
function canHeal(resourceType, now) {
  const lastAction = lastHealingActions[resourceType];
  const timeSinceLastAction = now - lastAction;
  
  // Get cooldown from policy (in seconds), convert to milliseconds
  let cooldownMs;
  if (resourceType === 'cpu') {
    cooldownMs = policies.getCpuPolicy().cooldown * 1000;
  } else if (resourceType === 'memory') {
    cooldownMs = policies.getMemoryPolicy().cooldown * 1000;
  } else if (resourceType === 'disk') {
    cooldownMs = policies.getDiskPolicy().cooldown * 1000;
  } else {
    cooldownMs = 60000; // Default 60 seconds
  }
  
  // Allow healing only if cooldown period has passed
  return timeSinceLastAction >= cooldownMs;
}

/**
 * Phase 3: Safety Guardrail - Retry counter
 * Prevents infinite healing loops by tracking retry attempts
 */
function canRetry(resourceOrService, isService = false) {
  const guardrails = policies.getGuardrails();
  const now = Date.now();
  
  let counter;
  if (isService) {
    // Initialize service counter if not exists
    if (!retryCounters.services[resourceOrService]) {
      retryCounters.services[resourceOrService] = { count: 0, lastResetTime: now };
    }
    counter = retryCounters.services[resourceOrService];
  } else {
    counter = retryCounters[resourceOrService];
  }
  
  // Reset counter if enough time has passed (default: 1 hour)
  const resetAfterMs = (guardrails.retryResetAfter || 3600) * 1000;
  if (now - counter.lastResetTime > resetAfterMs) {
    counter.count = 0;
    counter.lastResetTime = now;
  }
  
  // Check if max retries exceeded
  const maxRetries = guardrails.maxRetries || 3;
  if (counter.count >= maxRetries) {
    return false;
  }
  
  return true;
}

/**
 * Phase 3: Increment retry counter after healing attempt
 */
function incrementRetryCounter(resourceOrService, isService = false) {
  if (isService) {
    if (!retryCounters.services[resourceOrService]) {
      retryCounters.services[resourceOrService] = { count: 0, lastResetTime: Date.now() };
    }
    retryCounters.services[resourceOrService].count++;
  } else {
    retryCounters[resourceOrService].count++;
  }
}

/**
 * Phase 3: Get current retry count (for debugging/monitoring)
 */
function getRetryCount(resourceOrService, isService = false) {
  if (isService) {
    return retryCounters.services[resourceOrService]?.count || 0;
  }
  return retryCounters[resourceOrService]?.count || 0;
}

/**
 * Phase 3: Raise HIGH alert when max retries exceeded
 */
function raiseMaxRetriesAlert(host, resourceOrService, isService = false) {
  const guardrails = policies.getGuardrails();
  const maxRetries = guardrails.maxRetries || 3;
  
  createAlert({
    type: ALERT_TYPE.HEALING_FAILED,
    host: host,
    service: isService ? resourceOrService : null,
    resource: isService ? null : resourceOrService.toUpperCase(),
    severity: SEVERITY.HIGH,
    message: `🚨 MAX RETRIES EXCEEDED: Auto-healing stopped for ${isService ? 'service' : 'resource'} "${resourceOrService}"`,
    details: {
      maxRetries: maxRetries,
      currentCount: getRetryCount(resourceOrService, isService),
      action: "auto_healing_disabled",
      recommendation: "Manual intervention required. Check logs and resolve underlying issue.",
    },
  });
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚨 MAX RETRIES EXCEEDED - AUTO-HEALING STOPPED`);
  console.log(`${"=".repeat(60)}`);
  console.log(`📍 ${isService ? 'Service' : 'Resource'}: ${resourceOrService}`);
  console.log(`🔢 Retry Count: ${getRetryCount(resourceOrService, isService)}/${maxRetries}`);
  console.log(`⛔ Action: Auto-healing disabled`);
  console.log(`💡 Recommendation: Manual intervention required`);
  console.log(`${"=".repeat(60)}\n`);
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
