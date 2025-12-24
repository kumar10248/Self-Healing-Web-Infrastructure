#!/bin/bash
# Disk Mitigation: Clean up logs and temporary files safely
# This script removes old logs and temporary files to free disk space

echo "🧹 Starting disk cleanup..."

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ This script requires sudo privileges"
    exit 1
fi

# Show disk usage before cleanup
echo "📊 Disk usage BEFORE cleanup:"
df -h / | tail -1

CLEANED=0

# 1. Clean systemd journal logs (keep last 3 days)
echo "🗑️  Cleaning systemd journal logs (keeping last 3 days)..."
if command -v journalctl &> /dev/null; then
    BEFORE=$(journalctl --disk-usage 2>/dev/null | grep -oP '\d+\.\d+[GM]' | head -1)
    journalctl --vacuum-time=3d &>/dev/null
    AFTER=$(journalctl --disk-usage 2>/dev/null | grep -oP '\d+\.\d+[GM]' | head -1)
    echo "   Journal: $BEFORE → $AFTER"
    CLEANED=1
fi

# 2. Clean APT cache (if exists)
echo "🗑️  Cleaning APT cache..."
if command -v apt-get &> /dev/null; then
    apt-get clean &>/dev/null
    echo "   APT cache cleaned"
    CLEANED=1
fi

# 3. Remove old log files in /var/log
echo "🗑️  Cleaning old log files (>7 days)..."
if [ -d /var/log ]; then
    find /var/log -type f -name "*.log.*" -mtime +7 -delete 2>/dev/null
    find /var/log -type f -name "*.gz" -mtime +7 -delete 2>/dev/null
    echo "   Old logs cleaned"
    CLEANED=1
fi

# 4. Clean /tmp (files older than 7 days)
echo "🗑️  Cleaning /tmp (>7 days)..."
if [ -d /tmp ]; then
    find /tmp -type f -mtime +7 -delete 2>/dev/null
    echo "   /tmp cleaned"
    CLEANED=1
fi

# 5. Clean thumbnail cache (user-safe)
if [ -d "$HOME/.cache/thumbnails" ]; then
    echo "🗑️  Cleaning thumbnail cache..."
    rm -rf "$HOME/.cache/thumbnails"/* 2>/dev/null
    echo "   Thumbnails cleaned"
    CLEANED=1
fi

# Show disk usage after cleanup
echo "📊 Disk usage AFTER cleanup:"
df -h / | tail -1

if [ $CLEANED -eq 1 ]; then
    echo "✅ Disk cleanup completed successfully"
    exit 0
else
    echo "⚠️  No cleanup actions were performed"
    exit 1
fi
