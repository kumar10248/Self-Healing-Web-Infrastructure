#!/bin/bash

echo "=========================================="
echo "Feature 6 (Part-A): Testing Dashboard APIs"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

# Test 1: Get Latest Metrics
echo "==========================================  "
echo "TEST 1: GET /api/metrics/latest"
echo "=========================================="
curl -s "${BASE_URL}/api/metrics/latest" | jq '.' 2>/dev/null || echo "Failed to fetch"
echo ""

# Test 2: Get Services
echo "=========================================="
echo "TEST 2: GET /api/metrics/services"
echo "=========================================="
curl -s "${BASE_URL}/api/metrics/services" | jq '.' 2>/dev/null || echo "Failed to fetch"
echo ""

# Test 3: Get Specific Service (nginx)
echo "=========================================="
echo "TEST 3: GET /api/metrics/services/nginx"
echo "=========================================="
curl -s "${BASE_URL}/api/metrics/services/nginx" | jq '.' 2>/dev/null || echo "Failed to fetch"
echo ""

# Test 4: Get Alerts (existing endpoint)
echo "=========================================="
echo "TEST 4: GET /api/alerts"
echo "=========================================="
curl -s "${BASE_URL}/api/alerts" | jq '.alerts | length' 2>/dev/null || echo "Failed to fetch"
echo " alerts found"
echo ""

# Test 5: Get Healing History
echo "=========================================="
echo "TEST 5: GET /api/heal/history"
echo "=========================================="
curl -s "${BASE_URL}/api/heal/history" | jq '.' 2>/dev/null || echo "Failed to fetch"
echo ""

# Test 6: Get Dashboard Stats
echo "=========================================="
echo "TEST 6: GET /api/dashboard/stats"
echo "=========================================="
curl -s "${BASE_URL}/api/dashboard/stats" | jq '.' 2>/dev/null || echo "Failed to fetch"
echo ""

# Test 7: Get System Health
echo "=========================================="
echo "TEST 7: GET /api/dashboard/health"
echo "=========================================="
curl -s "${BASE_URL}/api/dashboard/health" | jq '.' 2>/dev/null || echo "Failed to fetch"
echo ""

echo "=========================================="
echo "✅ All API tests completed!"
echo "=========================================="
