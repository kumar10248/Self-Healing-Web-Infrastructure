#!/bin/bash
# Collects service status for critical services
# Returns: service_name:status (e.g., "nginx:active" or "docker:inactive")

# Configuration - Add/remove services as needed
SERVICES=("nginx" "ssh" "docker")

# Check if a service exists
service_exists() {
    systemctl list-unit-files | grep -q "^$1.service"
}

# Get service status
get_service_status() {
    local service=$1
    
    # Check if service exists
    if ! service_exists "$service"; then
        echo "$service:not-installed"
        return
    fi
    
    # Get service status using systemctl
    status=$(systemctl is-active "$service" 2>/dev/null)
    
    # Possible values: active, inactive, failed, unknown
    echo "$service:$status"
}

# Collect status for all configured services
for service in "${SERVICES[@]}"; do
    get_service_status "$service"
done
