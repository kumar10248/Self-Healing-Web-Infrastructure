#!/bin/bash
# Memory Mitigation: Clear system caches safely
# This is a SAFE operation that clears PageCache, dentries, and inodes

echo "🧹 Starting memory cleanup..."

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script requires sudo privileges"
    exit 1
fi

# Show memory before cleanup
echo "📊 Memory BEFORE cleanup:"
free -h | grep "Mem:"

# Sync filesystem to ensure data integrity
echo "🔄 Syncing filesystem..."
sync

# Clear PageCache, dentries, and inodes
echo "🧹 Clearing caches..."
echo 3 > /proc/sys/vm/drop_caches

# Small delay
sleep 1

# Show memory after cleanup
echo "📊 Memory AFTER cleanup:"
free -h | grep "Mem:"

echo "✅ Memory cleanup completed successfully"
exit 0
