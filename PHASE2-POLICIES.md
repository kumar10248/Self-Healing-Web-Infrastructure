# Phase 2: Configurable Policies

## Overview

**No more hard-coded thresholds!** Industry-realistic policy management system that allows changing behavior without redeploying code.

## What Changed

### Before (Student-Like ❌)
```javascript
// Hard-coded thresholds
const THRESHOLDS = {
  CPU: 85,
  MEMORY: 80,
  DISK: 90,
};

if (cpu > 85) {
  heal();
}
```

**Problems:**
- Need to redeploy to change thresholds
- Different environments need different values
- No flexibility for testing
- Not production-ready

### After (Industry-Standard ✅)
```javascript
// Load from config file
const cpuPolicy = policies.getCpuPolicy();

if (cpu > cpuPolicy.threshold && cooldownExpired()) {
  heal();
}
```

**Benefits:**
- Change thresholds without redeploy
- Different configs for dev/staging/prod
- Hot-reload policies via API
- Safer operations (cooldowns configurable)
- Predictable automation

## Architecture

```
policies.json (editable config)
      ↓
policies.js (loader + validator)
      ↓
Services (monitoring, healing)
      ↓
Dynamic behavior based on policies
```

## Files Created/Modified

### New Files
- `backend/src/config/policies.json` - Configuration file
- `backend/src/config/policies.js` - Policy loader/validator
- `backend/src/controllers/policies.controller.js` - API controller
- `backend/src/routes/policies.routes.js` - API routes

### Modified Files
- `backend/src/services/monitoring.service.js` - Uses policy thresholds
- `backend/src/services/healing.service.js` - Uses policy thresholds & cooldowns
- `backend/src/app.js` - Added policy routes

## Policy Configuration

### `policies.json` Structure

```json
{
  "resources": {
    "cpu": {
      "threshold": 85,      // % usage that triggers healing
      "cooldown": 300,      // seconds between healing actions
      "enabled": true       // can disable without removing
    },
    "memory": {
      "threshold": 80,
      "cooldown": 300,
      "enabled": true
    },
    "disk": {
      "threshold": 90,
      "cooldown": 600,      // longer cooldown for disk
      "enabled": true
    }
  },
  "services": {
    "restartCooldown": 60,
    "maxRestartAttempts": 3,
    "enabled": true
  },
  "alerts": {
    "cooldown": 30,
    "enabled": true
  }
}
```

## API Endpoints

### 1. Get All Policies
```bash
curl http://localhost:5000/api/policies
```

**Response:**
```json
{
  "success": true,
  "data": {
    "resources": { ... },
    "services": { ... },
    "alerts": { ... }
  },
  "info": {
    "version": "1.0",
    "lastLoadTime": "2025-12-24T...",
    "policyFile": "/path/to/policies.json"
  }
}
```

### 2. Reload Policies (Hot-Reload!)
```bash
curl -X POST http://localhost:5000/api/policies/reload
```

**Response:**
```json
{
  "success": true,
  "message": "Policies reloaded successfully. New thresholds will be used for next check.",
  "data": { ... }
}
```

### 3. Get Specific Resource Policy
```bash
curl http://localhost:5000/api/policies/resources/cpu
curl http://localhost:5000/api/policies/resources/memory
curl http://localhost:5000/api/policies/resources/disk
```

**Response:**
```json
{
  "success": true,
  "resource": "cpu",
  "data": {
    "threshold": 85,
    "cooldown": 300,
    "enabled": true
  }
}
```

## Usage Examples

### Example 1: Change CPU Threshold (Without Restart!)

1. **Edit** `backend/src/config/policies.json`:
```json
{
  "resources": {
    "cpu": {
      "threshold": 90,  // Changed from 85 to 90
      "cooldown": 300,
      "enabled": true
    }
  }
}
```

2. **Reload** policies:
```bash
curl -X POST http://localhost:5000/api/policies/reload
```

3. **Done!** Next metric check will use 90% threshold

### Example 2: Disable Disk Healing

```json
{
  "resources": {
    "disk": {
      "threshold": 90,
      "cooldown": 600,
      "enabled": false  // Disabled!
    }
  }
}
```

Reload, and disk healing stops (monitoring continues).

### Example 3: Testing with Aggressive Thresholds

For testing, use low thresholds:
```json
{
  "resources": {
    "cpu": { "threshold": 50, "cooldown": 10, "enabled": true },
    "memory": { "threshold": 50, "cooldown": 10, "enabled": true }
  }
}
```

### Example 4: Production with Conservative Thresholds

For production, use high thresholds:
```json
{
  "resources": {
    "cpu": { "threshold": 95, "cooldown": 600, "enabled": true },
    "memory": { "threshold": 90, "cooldown": 600, "enabled": true }
  }
}
```

## Safety Features

### 1. **Validation**
- Thresholds must be 0-100
- Cooldowns must be >= 0
- Invalid configs rejected, fallback to defaults

### 2. **Graceful Degradation**
- If `policies.json` missing → uses hardcoded defaults
- If reload fails → keeps previous policies
- System never crashes due to bad config

### 3. **Cooldown Protection**
- Policies include cooldowns to prevent healing loops
- Different cooldowns for different resources
- Disk gets longer cooldown (600s vs 300s)

## How to Explain This to a Company

> "The system uses **configurable policies** instead of hard-coded thresholds, allowing operations teams to adjust behavior without redeploying code. Policies support **hot-reloading** via API, enabling safe threshold adjustments during incidents. Built-in **cooldown mechanisms** prevent automation loops, and **validation** ensures config errors don't crash the system. This approach is standard in production systems like Kubernetes (resource quotas), AWS (CloudWatch alarms), and Datadog (monitors)."

## Benefits for Companies

✅ **Operational Flexibility**
- Change thresholds during incidents
- Different configs for environments (dev/staging/prod)
- A/B testing of thresholds

✅ **Safety**
- Cooldowns prevent runaway automation
- Validation prevents config errors
- Can disable healing without removing code

✅ **Predictability**
- Documented behavior in config file
- Version control for policy changes
- Audit trail of threshold modifications

✅ **Industry-Standard**
- Similar to Kubernetes policies
- Similar to AWS CloudWatch alarm configs
- Similar to Prometheus alerting rules

## Testing

### 1. Start Backend
```bash
cd backend && npm run dev
```

### 2. Check Current Policies
```bash
curl http://localhost:5000/api/policies | jq
```

### 3. Test Hot-Reload
```bash
# Edit policies.json (change CPU threshold to 70)
vim backend/src/config/policies.json

# Reload
curl -X POST http://localhost:5000/api/policies/reload | jq

# Verify
curl http://localhost:5000/api/policies/resources/cpu | jq
```

### 4. Trigger Healing with New Threshold
```bash
# If CPU > 70% (new threshold), healing triggers
stress --cpu 8 --timeout 30s
```

## Comparison with Other Systems

| System | Configurable Policies | Hot-Reload | Validation |
|--------|----------------------|-----------|------------|
| **Your System** | ✅ | ✅ | ✅ |
| Kubernetes HPA | ✅ | ✅ | ✅ |
| AWS CloudWatch | ✅ | ✅ | ✅ |
| Datadog Monitors | ✅ | ✅ | ✅ |
| Hard-coded thresholds | ❌ | ❌ | ❌ |

## Rollback

If Phase 2 causes issues:
```bash
git checkout v1.0-poc  # Stable version without policies
```

Or keep policies but revert to defaults:
```bash
# Restore default policies.json from git
git checkout HEAD -- backend/src/config/policies.json
curl -X POST http://localhost:5000/api/policies/reload
```

---

**Phase 2 Complete!** 🎉  
Your system now has industry-realistic configurable policies!