# Channel Setup Guide for OpenClaw

## Overview

This document describes how to set up various messaging channels with OpenClaw via the `/setup` page.

## Supported Channels

- [WhatsApp Business](#whatsapp-business)
- [Signal](#signal)
- [Telegram](#telegram)
- [Discord](#discord)
- [Slack](#slack)

---

## WhatsApp Business

### Prerequisites

1. **Meta Business Account** - Create at [business.facebook.com](https://business.facebook.com)
2. **WhatsApp Business App** - Create in Meta for Developers

### Getting Credentials

#### Step 1: Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app (select **Business** type)
3. Add **WhatsApp** product

#### Step 2: Get Phone Number ID

1. In your app, go to **WhatsApp** → **Messaging**
2. Your **Phone Number ID** is displayed (15 digits)

#### Step 3: Get Access Token

1. In **WhatsApp** → **API Setup**
2. Copy the **Temporary Access Token** (for testing)
3. For production: create a System User with `whatsapp_business_messaging` permission

### Setup via /setup

1. Go to **"2b) Optional: WhatsApp Business"**
2. Fill in:
   - **Phone Number ID** - Your 15-digit ID
   - **Access Token** - Token from Meta
   - **Business Account ID** - Optional
   - **Verify Token** - Leave empty to auto-generate
3. Click **Run setup**

### Configure Webhook

After setup, configure in Meta App:
- **Webhook URL**: `https://your-domain/webhook/whatsapp`
- **Verify Token**: Use the token shown in setup output

---

## Signal

### Prerequisites

1. **signal-cli** - Install [signal-cli-rest-api](https://github.com/AsamK/signal-cli-rest-api)
2. **Signal account** - Linked phone number

### Installation Options

#### Option A: Docker (Recommended)

```bash
docker run -d \
  --name signal-rest-api \
  -p 8080:8080 \
  -v ~/.signal:/home/.local/share/signal-cli \
  bbernhard/signal-cli-rest-api:latest
```

#### Option B: Local

```bash
# Install signal-cli
# Then run the REST API
java -jar signal-cli-rest-api.jar 8080
```

### Setup via /setup

1. Go to **"2c) Optional: Signal"**
2. Fill in:
   - **API URL** - e.g., `http://localhost:8080` or your remote URL
   - **Phone Number** - Your Signal number in E.164 format (`+1234567890`)
   - **Account** - Signal account (defaults to phone number)
   - **Send As** - Number to send as (optional)
   - **Recipients** - Comma-separated allowed numbers (optional)
3. Click **Run setup**

### Raw Config Format

```json5
{
  channels: {
    signal: {
      enabled: true,
      apiUrl: "http://localhost:8080",
      phoneNumber: "+1234567890",
      account: "+1234567890",
      sendAs: "+1234567890",
      recipients: ["+1234567890", "+9876543210"],
      groupPolicy: "allowlist",
      dm: {
        policy: "pairing"
      }
    }
  }
}
```

---

## Telegram

### Getting Bot Token

1. Open Telegram
2. Message [@BotFather](https://t.me/BotFather)
3. Send `/newbot`
4. Follow prompts and copy the token

### Setup via /setup

1. Go to **"2) Optional: Channels"**
2. Fill in **Telegram bot token**
3. Click **Run setup**

### Pairing

After setup, approve DM access:
1. Click **Approve pairing**
2. Select channel: `telegram`
3. Enter pairing code from your chat with the bot

---

## Discord

### Getting Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create an application
3. Go to **Bot** → **Add Bot**
4. Copy the **Bot Token**

**Important**: Enable **MESSAGE CONTENT INTENT** in Bot → Privileged Gateway Intents

### Setup via /setup

1. Go to **"2) Optional: Channels"**
2. Fill in **Discord bot token**
3. Click **Run setup**

### Pairing

After setup, approve DM access:
1. Click **Approve pairing**
2. Select channel: `discord`
3. Enter pairing code from your DM

---

## Slack

### Getting Tokens

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. **Bot Token** (`xoxb-...`):
   - Go to **OAuth & Permissions**
   - Add scopes: `chat:write`, `channels:history`, `im:history`, `mpim:history`
   - Install to workspace and copy token
4. **App Token** (`xapp-...`):
   - Go to **Basic Information** → **App-Level Tokens**
   - Create token with scope `connections:write`

### Setup via /setup

1. Go to **"2) Optional: Channels"**
2. Fill in:
   - **Slack bot token**
   - **Slack app token**
3. Click **Run setup**

---

## Troubleshooting

### "Schema unavailable. Use Raw."

This means the OpenClaw build doesn't have the channel schema. Use the **Config editor (advanced)** section on `/setup` page.

### Webhook Issues

- Ensure the webhook URL is publicly accessible
- Check verify tokens match exactly
- Verify firewall/proxy settings

### Connection Refused

- Check the service is running
- Verify URLs and ports are correct
- Check network/firewall settings

### Check Logs

Use the Debug Console on `/setup`:
- Select `openclaw.logs.tail`
- Click **Run**

---

## Security Notes

- Never commit tokens to version control
- Use environment variables for production
- Rotate tokens periodically
- Use the pairing feature for DM access control
