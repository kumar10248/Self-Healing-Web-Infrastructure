#!/bin/bash

echo "=========================================="
echo "Feature 5: Testing Alert System"
echo "=========================================="
echo ""

# Start backend in background
echo "1. Starting backend..."
cd /home/kumar/Desktop/self-healing-infra/backend
node src/server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend started (PID: $BACKEND_PID)"
sleep 3

# Start agent in background
echo "2. Starting agent..."
cd /home/kumar/Desktop/self-healing-infra/agent
node agent.js > /tmp/agent.log 2>&1 &
AGENT_PID=$!
echo "   Agent started (PID: $AGENT_PID)"
sleep 5

# Check metrics are flowing
echo ""
echo "3. Checking metrics flow..."
sleep 15
echo "   ✓ Metrics should be flowing now"

# Test 1: Check alerts API
echo ""
echo "=========================================="
echo "TEST 1: Get Recent Alerts"
echo "=========================================="
curl -s http://localhost:5000/api/alerts | jq '.'

# Test 2: Get alert statistics
echo ""
echo "=========================================="
echo "TEST 2: Get Alert Statistics"
echo "=========================================="
curl -s http://localhost:5000/api/alerts/stats | jq '.'

# Test 3: Start CPU stress to trigger resource alert
echo ""
echo "=========================================="
echo "TEST 3: Trigger CPU Resource Alert"
echo "=========================================="
echo "Starting CPU stress test (4 cores for 30 seconds)..."
stress --cpu 4 --timeout 30s > /dev/null 2>&1 &
STRESS_PID=$!

echo "Waiting for CPU spike and healing..."
sleep 35

echo ""
echo "Checking alerts after CPU stress:"
curl -s http://localhost:5000/api/alerts | jq '.alerts[] | {type, severity, message, timestamp}' | head -50

# Test 4: Filter alerts by type
echo ""
echo "=========================================="
echo "TEST 4: Filter Alerts by Type"
echo "=========================================="
echo "Resource-related alerts:"
curl -s "http://localhost:5000/api/alerts/type/RESOURCE_HIGH" | jq '.alerts[] | {message, timestamp}'

# Cleanup
echo ""
echo "=========================================="
echo "Cleanup"
echo "=========================================="
kill $BACKEND_PID $AGENT_PID 2>/dev/null
pkill stress 2>/dev/null

echo ""
echo "✓ Test completed!"
echo "Check logs at:"
echo "  - Backend: /tmp/backend.log"
echo "  - Agent: /tmp/agent.log"
