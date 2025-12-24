#!/bin/bash

echo "=========================================="
echo "Feature 5: Manual Alert Test"
echo "=========================================="
echo ""

# Test the alert system directly
echo "Testing alert service..."
cd /home/kumar/Desktop/self-healing-infra/backend

# Create a test script to manually create alerts
node -e "
const { createAlert, SEVERITY, ALERT_TYPE, getRecentAlerts, getAlertStats } = require('./src/services/alert.service');

console.log('Creating test alerts...\n');

// Create a SERVICE_DOWN alert
createAlert({
  type: ALERT_TYPE.SERVICE_DOWN,
  host: 'test-server-01',
  service: 'nginx',
  severity: SEVERITY.HIGH,
  message: 'Service nginx is down on test-server-01'
});

// Create a RESOURCE_HIGH alert
createAlert({
  type: ALERT_TYPE.RESOURCE_HIGH,
  host: 'test-server-01',
  resource: 'CPU',
  value: 92,
  threshold: 85,
  severity: SEVERITY.CRITICAL,
  message: 'High CPU usage detected: 92% (threshold: 85%)'
});

// Create a HEALING_TRIGGERED alert
createAlert({
  type: ALERT_TYPE.HEALING_TRIGGERED,
  host: 'test-server-01',
  resource: 'CPU',
  severity: SEVERITY.HIGH,
  message: 'CPU healing triggered: 92% usage (threshold: 85%)'
});

// Create a HEALING_SUCCESS alert
createAlert({
  type: ALERT_TYPE.HEALING_SUCCESS,
  host: 'test-server-01',
  resource: 'CPU',
  severity: SEVERITY.LOW,
  message: 'CPU healing completed successfully'
});

console.log('\\n========================================');
console.log('Recent Alerts:');
console.log('========================================\\n');

const alerts = getRecentAlerts(10);
alerts.forEach((alert, index) => {
  console.log(\`\${index + 1}. [\${alert.severity}] \${alert.type}\`);
  console.log(\`   \${alert.message}\`);
  console.log(\`   Host: \${alert.host}, Time: \${alert.timestamp}\\n\`);
});

console.log('========================================');
console.log('Statistics:');
console.log('========================================\\n');
console.log(JSON.stringify(getAlertStats(), null, 2));
"

echo ""
echo "✓ Manual test completed!"
