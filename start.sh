#!/bin/bash
# Quick start script for Feature 1

echo "🚀 Starting Self-Healing Infrastructure - Feature 1"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if bc is installed
if ! command -v bc &> /dev/null; then
    echo "⚠️  Warning: 'bc' is not installed. Installing..."
    sudo apt install -y bc
fi

# Make collector scripts executable
echo "📝 Making collector scripts executable..."
chmod +x agent/collectors/*.sh

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
node src/server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Check if backend is running
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is running (PID: $BACKEND_PID)"
else
    echo "❌ Failed to start backend"
    exit 1
fi

# Start agent
echo "📡 Starting monitoring agent..."
cd agent
node agent.js

# Cleanup on exit
trap "kill $BACKEND_PID 2>/dev/null" EXIT
