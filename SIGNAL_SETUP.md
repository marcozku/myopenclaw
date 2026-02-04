# Signal CLI REST API Setup Guide

## Quick Start (Automated - Recommended)

### Windows

Double-click `setup-signal.bat` or run in PowerShell:
```powershell
.\setup-signal.bat
```

### Mac/Linux

```bash
chmod +x setup-signal.sh
./setup-signal.sh
```

The script will:
1. Check Docker is installed
2. Pull the signal-cli-rest-api image
3. Start the container on port 8080
4. Prompt you to link your Signal number via **QR code** (recommended) or SMS

---

## Manual Setup (Docker)

### Option 1: Using docker-compose

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

---

## Link Your Signal Number

After starting the container, link your Signal account:

### Method 1: QR Code (Recommended - No SMS needed)

If you already have Signal on your phone:

```bash
docker exec -it signal-rest-api signal-cli link -n "OpenClaw"
```

Then on your phone:
1. Open Signal
2. Go to: **Settings → Linked Devices → Link New Device**
3. Scan the QR code shown

### Method 2: SMS Verification

```bash
# Register your number (replaces SMS)
docker exec signal-rest-api signal-cli -a +1234567890 register

# Verify with code from SMS
docker exec -it signal-rest-api signal-cli -a +1234567890 verify <CODE>
```

### Method 3: REST API

```bash
# Register
curl -X POST http://localhost:8080/v1/register/+1234567890

# Verify
curl -X POST http://localhost:8080/v1/verify/+1234567890/<CODE>
```

---

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

---

## Configure in OpenClaw

Once signal-cli is running and linked:

1. Go to `/setup` page
2. Scroll to **"2c) Optional: Signal"**
3. Fill in:
   - **API URL**: `http://localhost:8080`
   - **Phone Number**: Your Signal number (`+1234567890`)
4. Click **Run setup**

**Or use Raw Config** (see [RAW_CONFIG_TEMPLATES.md](RAW_CONFIG_TEMPLATES.md)):

```json5
{
  channels: {
    signal: {
      enabled: true,
      apiUrl: "http://localhost:8080",
      phoneNumber: "+1234567890"
    }
  }
}
```

---

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
docker stop signal-rest-api
docker rm signal-rest-api
docker volume rm signal_data

# Start fresh
docker-compose -f docker-compose.signal.yml up -d
```

---

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

---

## Useful Commands

```bash
# View logs
docker logs -f signal-rest-api

# Restart container
docker restart signal-rest-api

# Stop container
docker stop signal-rest-api

# Start container
docker start signal-rest-api

# Remove container and data
docker stop signal-rest-api
docker rm signal-rest-api
docker volume rm signal_data
```
