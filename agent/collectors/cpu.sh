#!/bin/bash
# Collects CPU usage percentage

# Using top command to get CPU idle percentage, then calculate usage
CPU_IDLE=$(top -bn1 | grep "Cpu(s)" | awk '{print $8}' | cut -d'%' -f1)

# Calculate CPU usage (100 - idle)
CPU_USAGE=$(echo "100 - $CPU_IDLE" | bc)

# Format to integer
printf "%.0f" "$CPU_USAGE"
