#!/bin/bash

# Signal CLI REST API - Automated Setup Script
# This script will install and configure signal-cli-rest-api for you

set -e

echo "======================================"
echo "Signal CLI REST API - Auto Setup"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo ""
    echo "Please install Docker first:"
    echo "  - Mac: https://docs.docker.com/desktop/install/mac-install/"
    echo "  - Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  - Linux: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo "❌ docker-compose not found!"
    exit 1
fi

echo "✅ Docker Compose found"
echo ""

# Check if signal-cli is already running
if docker ps | grep -q "signal-rest-api"; then
    echo "⚠️  signal-cli container is already running!"
    echo ""
    read -p "Do you want to stop and recreate it? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping existing container..."
        docker stop signal-rest-api 2>/dev/null || true
        docker rm signal-rest-api 2>/dev/null || true
    else
        echo "Exiting..."
        exit 0
    fi
fi

# Create data directory
echo "📁 Creating data directory..."
mkdir -p ~/.signal-data

# Pull latest image
echo "📦 Pulling signal-cli-rest-api image..."
docker pull bbernhard/signal-cli-rest-api:latest

# Run container
echo "🚀 Starting signal-cli-rest-api..."
docker run -d \
    --name signal-rest-api \
    -p 8080:8080 \
    -v ~/.signal-data:/home/.local/share/signal-cli \
    --restart unless-stopped \
    bbernhard/signal-cli-rest-api:latest

# Wait for container to be ready
echo "⏳ Waiting for service to start..."
sleep 5

# Check if container is running
if docker ps | grep -q "signal-rest-api"; then
    echo ""
    echo "✅ signal-cli-rest-api is running!"
    echo ""
    echo "📍 API URL: http://localhost:8080"
    echo ""
else
    echo ""
    echo "❌ Failed to start container. Check logs:"
    echo "   docker logs signal-rest-api"
    exit 1
fi

# Show menu for linking
echo ""
echo "======================================"
echo "Link Your Signal Number"
echo "======================================"
echo ""
echo "Choose a linking method:"
echo "  1) QR Code (Recommended) - Link from your phone"
echo "  2) SMS Verification - Register with phone number"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "📱 Generating QR Code..."
        echo ""
        echo "Follow these steps:"
        echo "  1. Open Signal on your phone"
        echo "  2. Go to: Settings > Linked Devices > Link New Device"
        echo "  3. Scan the QR code below"
        echo ""

        # Generate QR code using signal-cli link command
        docker exec -it signal-rest-api signal-cli link -n "OpenClaw"

        echo ""
        echo "✅ If QR code scan was successful, your Signal is now linked!"
        ;;
    2)
        echo ""
        read -p "Enter your phone number (with + and country code, e.g., +1234567890): " phone_number

        if [[ ! $phone_number =~ ^\+[0-9]{10,15}$ ]]; then
            echo "❌ Invalid phone number format! Use E.164 format: +1234567890"
            exit 1
        fi

        echo ""
        echo "📲 Requesting SMS verification for $phone_number"
        docker exec signal-rest-api signal-cli -a "$phone_number" register

        echo ""
        echo "🔑 Check your phone for the SMS verification code."
        read -p "Enter the verification code: " verify_code

        echo ""
        echo "🔄 Verifying..."
        docker exec signal-rest-api signal-cli -a "$phone_number" verify "$verify_code"

        echo ""
        echo "✅ Your Signal number $phone_number is now registered!"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "📍 API URL: http://localhost:8080"
echo ""
echo "Test the API:"
echo "  curl http://localhost:8080/v1/about"
echo ""
echo "View logs:"
echo "  docker logs -f signal-rest-api"
echo ""
echo "Stop service:"
echo "  docker stop signal-rest-api"
echo ""
echo "Restart service:"
echo "  docker start signal-rest-api"
echo ""
