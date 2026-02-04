# Signal CLI REST API Setup Guide

## Quick Start (Docker - Recommended)

### Option 1: Using docker-compose (Easiest)

```bash
# From this directory, run:
docker-compose -f docker-compose.signal.yml up -d

# Check logs:
docker-compose -f docker-compose.signal.yml logs -f

# Stop later:
docker-compose -f docker-compose.signal.yml down
```

### Option 2: Using docker run

```bash
docker run -d \
  --name signal-rest-api \
  -p 8080:8080 \
  -v signal_data:/home/.local/share/signal-cli \
  --restart unless-stopped \
  bbernhard/signal-cli-rest-api:latest
```

## Link Your Signal Number

After starting the container, you need to register/link your phone number:

### Method 1: REST API

```bash
# Replace +1234567890 with your actual number
curl -X POST http://localhost:8080/v1/register/+1234567890

# You'll receive a verification code via SMS
# Then verify with:
curl -X POST http://localhost:8080/v1/verify/+1234567890/<CODE>
```

### Method 2: Docker Exec (Interactive)

```bash
# Get into the container
docker exec -it signal-rest-api /bin/sh

# Register your number
signal-cli -a +1234567890 register

# Verify with code from SMS
signal-cli -a +1234567890 verify <CODE>

# Exit container
exit
```

### Method 3: Link from existing device (No SMS needed)

If you already have Signal on your phone:

```bash
docker exec -it signal-rest-api /bin/sh

# This will show a QR code to scan with your phone
signal-cli link -n "OpenClaw"

# Scan with: Signal Settings → Linked Devices → Link New Device
```

## Verify Installation

```bash
# Check API is running
curl http://localhost:8080/v1/about

# Get account info
curl http://localhost:8080/v1/accounts/+1234567890

# Send test message
curl -X POST http://localhost:8080/v1/send/+1234567890 \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from OpenClaw!"}'
```

## Troubleshooting

### Port already in use

Change port in docker-compose.signal.yml:
```yaml
ports:
  - "8081:8080"  # Use 8081 instead
```

### Container won't start

```bash
# Check logs
docker logs signal-rest-api

# Rebuild container
docker-compose -f docker-compose.signal.yml up -d --force-recreate
```

### Need to re-register

```bash
# Stop and remove volume (wipes account data)
docker-compose -f docker-compose.signal.yml down
docker volume rm myopenclaw_signal_data

# Start fresh
docker-compose -f docker-compose.signal.yml up -d
```

## For Railway Deployment

If deploying OpenClaw on Railway, you have two options:

### Option A: Run signal-cli locally

Run signal-cli on your local machine, then use a tunnel (ngrok, Cloudflare Tunnel) to expose it:

```bash
# Install ngrok
ngrok http 8080

# Use the https URL in OpenClaw setup
# Example: https://abc123.ngrok.io
```

### Option B: Deploy signal-cli separately

Deploy signal-cli on a separate server (Railway, Fly.io, etc.) and use that URL in OpenClaw setup.

## Firewall Notes

Make sure port 8080 is accessible:
- **Local**: No firewall changes needed
- **Remote**: Open port 8080/tcp or use SSH tunneling
