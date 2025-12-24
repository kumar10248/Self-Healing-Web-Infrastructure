#!/bin/bash
# Restart a systemd service
# Usage: ./restart-service.sh <service_name>

SERVICE_NAME=$1

if [ -z "$SERVICE_NAME" ]; then
    echo "ERROR: Service name required"
    echo "Usage: $0 <service_name>"
    exit 1
fi

# Check if service exists
if ! systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service"; then
    echo "ERROR: Service ${SERVICE_NAME} does not exist"
    exit 1
fi

echo "🔧 Restarting service: ${SERVICE_NAME}..."

# Restart the service
if sudo systemctl restart "${SERVICE_NAME}"; then
    echo "✅ Service ${SERVICE_NAME} restarted successfully"
    
    # Wait a moment for service to stabilize
    sleep 2
    
    # Verify service is active
    if systemctl is-active --quiet "${SERVICE_NAME}"; then
        echo "✅ Verified: ${SERVICE_NAME} is now active"
        exit 0
    else
        echo "⚠️  WARNING: Service restarted but not active"
        exit 2
    fi
else
    echo "❌ FAILED: Could not restart ${SERVICE_NAME}"
    exit 1
fi
