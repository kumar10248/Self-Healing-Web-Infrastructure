#!/bin/bash
# CPU Mitigation: Kill top CPU-consuming process (SAFE - excludes critical processes)
# This script identifies and terminates the highest CPU consumer that is NOT critical

# List of critical processes to NEVER kill (protection)
PROTECTED_PROCESSES="systemd|sshd|dockerd|containerd|init|kernel|bash|node"

echo "🔍 Identifying top CPU consumer..."

# Get top CPU consuming process (exclude protected ones)
TOP_PROCESS=$(ps aux --sort=-%cpu | grep -vE "$PROTECTED_PROCESSES" | grep -v "ps aux" | grep -v "grep" | head -2 | tail -1)

if [ -z "$TOP_PROCESS" ]; then
    echo "❌ No killable process found (all are protected)"
    exit 1
fi

# Extract PID and process name
PID=$(echo "$TOP_PROCESS" | awk '{print $2}')
PROCESS_NAME=$(echo "$TOP_PROCESS" | awk '{print $11}')
CPU_USAGE=$(echo "$TOP_PROCESS" | awk '{print $3}')

echo "🎯 Target process:"
echo "   PID: $PID"
echo "   Name: $PROCESS_NAME"
echo "   CPU: $CPU_USAGE%"

# Safety check: Don't kill if PID is less than 100 (system processes)
if [ "$PID" -lt 100 ]; then
    echo "❌ Safety abort: PID $PID appears to be a system process"
    exit 1
fi

# Kill the process
echo "🔨 Terminating process $PID ($PROCESS_NAME)..."
kill -15 "$PID" 2>/dev/null  # Try graceful termination first

sleep 2

# Check if process is still running
if ps -p "$PID" > /dev/null 2>&1; then
    echo "⚠️  Process still running, forcing termination..."
    kill -9 "$PID" 2>/dev/null  # Force kill if needed
fi

# Verify
if ! ps -p "$PID" > /dev/null 2>&1; then
    echo "✅ Process $PID terminated successfully"
    exit 0
else
    echo "❌ Failed to terminate process $PID"
    exit 1
fi
