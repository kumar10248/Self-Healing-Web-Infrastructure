/**
 * Phase 2: Configurable Policies Service
 * 
 * Industry-realistic policy management:
 * - Load policies from JSON file (no hard-coded thresholds)
 * - Validate policies on load
 * - Hot-reload without restart (optional but impressive)
 * - Type-safe access with defaults
 */

const fs = require('fs');
const path = require('path');

const POLICIES_FILE = path.join(__dirname, 'policies.json');

// In-memory policy cache
let policies = null;
let lastLoadTime = null;

/**
 * Load policies from JSON file
 * Called on server startup and when policies are reloaded
 */
function loadPolicies() {
  try {
    const data = fs.readFileSync(POLICIES_FILE, 'utf8');
    const parsed = JSON.parse(data);
    
    // Validate required structure
    validatePolicies(parsed);
    
    policies = parsed;
    lastLoadTime = new Date();
    
    console.log('✅ Policies loaded successfully');
    console.log('   CPU threshold:', policies.resources.cpu.threshold + '%');
    console.log('   Memory threshold:', policies.resources.memory.threshold + '%');
    console.log('   Disk threshold:', policies.resources.disk.threshold + '%');
    
    return policies;
  } catch (error) {
    console.error('❌ Failed to load policies:', error.message);
    
    // Return safe defaults if file load fails
    console.warn('⚠️  Using default policies (hardcoded fallback)');
    return getDefaultPolicies();
  }
}

/**
 * Validate policy structure
 * Ensures all required fields are present
 */
function validatePolicies(policyData) {
  if (!policyData.resources) {
    throw new Error('Missing "resources" section in policies');
  }
  
  const resources = ['cpu', 'memory', 'disk'];
  for (const resource of resources) {
    if (!policyData.resources[resource]) {
      throw new Error(`Missing resource policy: ${resource}`);
    }
    
    const policy = policyData.resources[resource];
    if (typeof policy.threshold !== 'number' || policy.threshold < 0 || policy.threshold > 100) {
      throw new Error(`Invalid threshold for ${resource}: must be 0-100`);
    }
    
    if (typeof policy.cooldown !== 'number' || policy.cooldown < 0) {
      throw new Error(`Invalid cooldown for ${resource}: must be >= 0`);
    }
  }
  
  console.log('✅ Policy validation passed');
}

/**
 * Get default policies (fallback)
 * Used if policies.json fails to load
 */
function getDefaultPolicies() {
  return {
    version: '1.0-default',
    resources: {
      cpu: { threshold: 85, cooldown: 300, enabled: true },
      memory: { threshold: 80, cooldown: 300, enabled: true },
      disk: { threshold: 90, cooldown: 600, enabled: true },
    },
    services: {
      restartCooldown: 60,
      maxRestartAttempts: 3,
      enabled: true,
    },
    alerts: {
      cooldown: 30,
      enabled: true,
    },
    monitoring: {
      interval: 10,
    },
  };
}

/**
 * Get CPU policy
 */
function getCpuPolicy() {
  if (!policies) {
    loadPolicies();
  }
  return policies.resources.cpu;
}

/**
 * Get Memory policy
 */
function getMemoryPolicy() {
  if (!policies) {
    loadPolicies();
  }
  return policies.resources.memory;
}

/**
 * Get Disk policy
 */
function getDiskPolicy() {
  if (!policies) {
    loadPolicies();
  }
  return policies.resources.disk;
}

/**
 * Get Service restart policy
 */
function getServicePolicy() {
  if (!policies) {
    loadPolicies();
  }
  return policies.services;
}

/**
 * Get Alert policy
 */
function getAlertPolicy() {
  if (!policies) {
    loadPolicies();
  }
  return policies.alerts;
}

/**
 * Get all policies
 */
function getAllPolicies() {
  if (!policies) {
    loadPolicies();
  }
  return policies;
}

/**
 * Reload policies from file (hot-reload)
 * Useful for updating thresholds without restart
 */
function reloadPolicies() {
  console.log('🔄 Reloading policies from file...');
  return loadPolicies();
}

/**
 * Get policy metadata
 */
function getPolicyInfo() {
  if (!policies) {
    loadPolicies();
  }
  
  return {
    version: policies.version,
    lastLoadTime: lastLoadTime,
    policyFile: POLICIES_FILE,
  };
}

/**
 * Check if resource healing is enabled
 */
function isResourceHealingEnabled(resourceType) {
  if (!policies) {
    loadPolicies();
  }
  
  const resource = policies.resources[resourceType];
  return resource && resource.enabled !== false;
}

/**
 * Check if service healing is enabled
 */
function isServiceHealingEnabled() {
  if (!policies) {
    loadPolicies();
  }
  
  return policies.services.enabled !== false;
}

// Load policies on module import
loadPolicies();

module.exports = {
  loadPolicies,
  reloadPolicies,
  getAllPolicies,
  getCpuPolicy,
  getMemoryPolicy,
  getDiskPolicy,
  getServicePolicy,
  getAlertPolicy,
  getPolicyInfo,
  isResourceHealingEnabled,
  isServiceHealingEnabled,
};
