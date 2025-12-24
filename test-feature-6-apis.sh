#!/bin/bash

echo "=========================================="
echo "Feature 6 (Part-A): Dashboard API Tests"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

echo "✅ Test 1: Get Latest Metrics"
echo "GET /api/metrics/latest"
echo "---"
curl -s "$BASE_URL/api/metrics/latest" | jq '.'
echo ""

echo "✅ Test 2: Get Service Status"
echo "GET /api/metrics/services"
echo "---"
curl -s "$BASE_URL/api/metrics/services" | jq '.'
echo ""

echo "✅ Test 3: Get Alerts"
echo "GET /api/alerts"
echo "---"
curl -s "$BASE_URL/api/alerts" | jq '.'
echo ""

echo "✅ Test 4: Get Healing History"
echo "GET /api/heal/history"
echo "---"
curl -s "$BASE_URL/api/heal/history" | jq '.'
echo ""

echo "✅ Test 5: Get Dashboard Stats"
echo "GET /api/dashboard/stats"
echo "---"
curl -s "$BASE_URL/api/dashboard/stats" | jq '.'
echo ""

echo "✅ Test 6: Get Dashboard Health"
echo "GET /api/dashboard/health"
echo "---"
curl -s "$BASE_URL/api/dashboard/health" | jq '.'
echo ""

echo "=========================================="
echo "All Feature 6 (Part-A) APIs tested!"
echo "=========================================="
