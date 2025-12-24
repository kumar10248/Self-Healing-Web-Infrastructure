#!/bin/bash

##############################################
# Self-Healing Infrastructure Agent Installer
##############################################

set -e

echo "======================================"
echo "  Self-Healing Agent Installer"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "❌ Please run as root (use sudo)"
   exit 1
fi

# Prompt for backend URL
read -p "Enter Backend URL (e.g., http://192.168.1.100:5000): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend URL is required!"
    exit 1
fi

echo ""
echo "📋 Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   Install Path: /opt/self-healing-agent"
echo ""
read -p "Continue? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled."
    exit 0
fi

# Check for Node.js
echo ""
echo "🔍 Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Install Node.js first: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js found: $NODE_VERSION"

# Create installation directory
INSTALL_DIR="/opt/self-healing-agent"
echo ""
echo "📂 Creating installation directory..."
mkdir -p $INSTALL_DIR
mkdir -p $INSTALL_DIR/collectors

# Copy agent files
echo "📦 Copying agent files..."
cp agent.js $INSTALL_DIR/
cp collectors/*.sh $INSTALL_DIR/collectors/

# Make scripts executable
chmod +x $INSTALL_DIR/agent.js
chmod +x $INSTALL_DIR/collectors/*.sh

# Create systemd service file
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/self-healing-agent.service << EOF
[Unit]
Description=Self-Healing Infrastructure Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
Environment="BACKEND_URL=$BACKEND_URL"
Environment="INTERVAL_SECONDS=10"
ExecStart=$(which node) $INSTALL_DIR/agent.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
echo "🔄 Reloading systemd..."
systemctl daemon-reload

# Enable and start service
echo "🚀 Starting agent service..."
systemctl enable self-healing-agent.service
systemctl start self-healing-agent.service

# Check status
sleep 2
if systemctl is-active --quiet self-healing-agent.service; then
    echo ""
    echo "✅ =================================="
    echo "✅  Installation Successful!"
    echo "✅ =================================="
    echo ""
    echo "📊 Agent is now monitoring this system"
    echo "🔗 Sending data to: $BACKEND_URL"
    echo ""
    echo "Useful commands:"
    echo "  - Check status:  systemctl status self-healing-agent"
    echo "  - View logs:     journalctl -u self-healing-agent -f"
    echo "  - Restart:       systemctl restart self-healing-agent"
    echo "  - Stop:          systemctl stop self-healing-agent"
    echo "  - Uninstall:     systemctl stop self-healing-agent && systemctl disable self-healing-agent && rm -rf $INSTALL_DIR"
    echo ""
else
    echo ""
    echo "❌ Service failed to start!"
    echo "Check logs: journalctl -u self-healing-agent -n 50"
    exit 1
fi
