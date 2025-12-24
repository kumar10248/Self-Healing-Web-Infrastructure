#!/bin/bash
# Collects Disk usage percentage for root partition

# Get disk usage for root partition
DISK_USAGE=$(df -h / | tail -1 | awk '{print $5}' | cut -d'%' -f1)

echo "$DISK_USAGE"
