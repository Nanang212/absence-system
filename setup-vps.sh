#!/bin/bash

# Oracle Cloud VPS Setup Script - Absence System
# Run this script after SSH to VPS

set -e

echo "=========================================="
echo "🚀 Absence System - VPS Setup Script"
echo "=========================================="
echo ""

# Update system
echo "📦 Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker
echo "🐳 Step 2: Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Add user to docker group
echo "👤 Step 3: Adding user to docker group..."
sudo usermod -aG docker ubuntu

# Install Docker Compose
echo "🔧 Step 4: Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install git
echo "📚 Step 5: Installing git..."
sudo apt install -y git

# Install UFW firewall
echo "🔒 Step 6: Setting up firewall..."
sudo apt install -y ufw
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
echo "y" | sudo ufw enable

# Clone repository
echo "📥 Step 7: Cloning repository..."
cd ~
if [ -d "absence-system" ]; then
    echo "Repository already exists, pulling latest..."
    cd absence-system
    git pull
else
    git clone https://github.com/Nanang212/absence-system.git
    cd absence-system
fi

echo ""
echo "=========================================="
echo "✅ VPS Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo "1. Logout dan login lagi (agar docker group aktif)"
echo "   Command: exit"
echo "   Then: ssh -i ~/.ssh/oracle-absence.key ubuntu@YOUR_IP"
echo ""
echo "2. Verify Docker installation:"
echo "   docker --version"
echo "   docker-compose --version"
echo ""
echo "3. Configure environment:"
echo "   cd ~/absence-system"
echo "   cp .env.production .env"
echo "   nano .env  (edit DB_PASSWORD, APP_SECRET)"
echo ""
echo "4. Deploy:"
echo "   docker-compose up -d"
echo ""
echo "5. Check logs:"
echo "   docker-compose logs -f"
echo ""
echo "=========================================="
