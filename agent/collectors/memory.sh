#!/bin/bash
# Collects Memory usage percentage

# Get memory info from /proc/meminfo
MEM_TOTAL=$(grep MemTotal /proc/meminfo | awk '{print $2}')
MEM_AVAILABLE=$(grep MemAvailable /proc/meminfo | awk '{print $2}')

# Calculate used memory
MEM_USED=$((MEM_TOTAL - MEM_AVAILABLE))

# Calculate percentage
MEM_USAGE=$(echo "scale=0; $MEM_USED * 100 / $MEM_TOTAL" | bc)

echo "$MEM_USAGE"
