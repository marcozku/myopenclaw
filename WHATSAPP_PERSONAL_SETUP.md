# WhatsApp Personal Setup for OpenClaw

## Overview

This guide describes how to set up **WhatsApp Personal** integration with OpenClaw. This allows you to use your regular WhatsApp account (no Business API required).

## Key Differences: WhatsApp Business vs WhatsApp Personal

| Feature | WhatsApp Business API | WhatsApp Personal (this guide) |
|---------|----------------------|-------------------------------|
| Meta Business Account | Required | Not required |
| WhatsApp Business App | Required | Not required |
| Phone Number Type | Business number | Your personal number |
| Official API | Yes (Meta Cloud API) | No (uses whatsapp-web.js) |
| Setup Complexity | High (Meta developer portal) | Low (scan QR code) |
| Cost | Free tier limited | Free |
| Reliability | High (official API) | Medium (depends on WhatsApp Web) |

## Prerequisites

1. **OpenClaw Instance** - Deployed and accessible
2. **WhatsApp on your phone** - With the number you want to use
3. **Node.js >= 22** - Required for whatsapp-web.js

## Setup via /setup Page

### Step 1: Start WhatsApp Personal

1. Navigate to `https://your-domain.up.railway.app/setup`
2. Scroll to **"2d) Optional: WhatsApp Personal (Normal WhatsApp)"**
3. Click **"Start WhatsApp Personal"**

### Step 2: Scan QR Code

1. A QR code will appear in the UI
2. Open WhatsApp on your phone:
   - **Android**: Settings > Linked Devices > Link a Device
   - **iOS**: Settings > Linked Devices > Link a Device
3. Scan the QR code with your phone

### Step 3: Verify Connection

1. Once scanned, the status will change to **"ready"**
2. Your account info (name and number) will be displayed
3. Send a test message to verify:
   - Enter a phone number (e.g., `+1234567890`)
   - Enter a test message
   - Click **"Send"**

## Raw Config Format

If you prefer manual configuration, you can add this directly to OpenClaw config:

```json5
{
  channels: {
    "whatsapp-personal": {
      enabled: true,
      sessionId: "default",
      groupPolicy: "allowlist",
      dm: {
        policy: "pairing"
      }
    }
  }
}
```

## API Endpoints

The wrapper provides the following API endpoints (protected by SETUP_PASSWORD):

### Get Status
```
GET /setup/api/whatsapp-personal/status
```

Returns:
```json
{
  "ok": true,
  "qr": "QR_CODE_STRING_OR_NULL",
  "status": "initializing|ready|not_found",
  "hasQr": true,
  "authFailure": null,
  "clientInfo": {
    "pushName": "Your Name",
    "number": "1234567890",
    "platform": "android"
  }
}
```

### Start Client
```
POST /setup/api/whatsapp-personal/start
```

### Stop Client
```
POST /setup/api/whatsapp-personal/stop
```

### Send Message
```
POST /setup/api/whatsapp-personal/send
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Hello from OpenClaw!"
}
```

## Webhook

Messages from WhatsApp Personal are sent to:
```
https://your-domain/webhook/whatsapp-personal
```

Message format:
```json
{
  "channel": "whatsapp-personal",
  "sessionId": "default",
  "from": "1234567890@c.us",
  "fromNumber": "1234567890",
  "fromName": "Contact Name",
  "body": "Message content",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "messageType": "chat",
  "isGroup": false
}
```

## Troubleshooting

### QR Code Not Appearing

1. Check the server logs: `/setup` → Debug console → `openclaw.logs.tail`
2. Ensure Puppeteer can launch (check if Chromium is installed)
3. Try clicking **"Refresh Status"**

### "Client Not Ready" Error

1. Make sure you've scanned the QR code
2. Wait a few seconds after scanning
3. Check the status shows **"ready"**

### Connection Lost

WhatsApp Personal uses WhatsApp Web protocol and may disconnect:
- Your phone must be connected to the internet
- Don't use WhatsApp on another device simultaneously
- Click **"Start WhatsApp Personal"** to reconnect

### Messages Not Received by OpenClaw

1. Check the wrapper is running
2. Verify the webhook endpoint is accessible
3. Check OpenClaw logs for errors

## Security Notes

- Your WhatsApp session is stored in `~/.openclaw/whatsapp-sessions/`
- Never share the session files
- The session persists after restart (you don't need to rescan)
- To disconnect, click **"Stop"** - this logs out and clears the session

## Limitations

1. **Single Session**: WhatsApp allows limited linked devices
2. **Phone Required**: Your phone must be online
3. **Rate Limits**: Don't send too many messages quickly
4. **Non-Official**: Uses reverse-engineered protocol, may break

## Comparison with WhatsApp Business API

Use **WhatsApp Personal** if:
- You want to use your personal WhatsApp number
- You don't have/want a Meta Business account
- You need simple, quick setup
- You're testing/development

Use **WhatsApp Business API** if:
- You need production reliability
- You have a Business number
- You need official support
- You're sending high volume messages
