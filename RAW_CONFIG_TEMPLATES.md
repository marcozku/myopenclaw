# OpenClaw Raw Channel Configuration Templates

When you see "Schema unavailable. Use Raw", use these templates in the **Config editor (advanced)** section on the `/setup` page.

---

## WhatsApp Business

```json5
{
  // ... existing config ...
  channels: {
    whatsapp: {
      enabled: true,
      phoneNumberId: "123456789012345",
      accessToken: "EAAxxxxxxxxxxxxxx",
      businessAccountId: "123456789012345",  // optional
      verifyToken: "your-custom-verify-token",
      groupPolicy: "allowlist",
      dm: {
        policy: "pairing"
      }
    }
  }
}
```

**Getting credentials:**
1. [Meta Developers](https://developers.facebook.com) → Create App → Add WhatsApp
2. Phone Number ID: WhatsApp → Messaging → "To" field
3. Access Token: WhatsApp → API Setup

---

## Signal

```json5
{
  // ... existing config ...
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

**Setup signal-cli:**
- Run `docker-compose -f docker-compose.signal.yml up -d`
- Link your number: See `SIGNAL_SETUP.md`

---

## Telegram

```json5
{
  // ... existing config ...
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      botToken: "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
      groupPolicy: "allowlist",
      streamMode: "partial"
    }
  }
}
```

**Getting bot token:**
- Message [@BotFather](https://t.me/BotFather) on Telegram
- Send `/newbot` and follow instructions

---

## Discord

```json5
{
  // ... existing config ...
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN_HERE",
      groupPolicy: "allowlist",
      dm: {
        policy: "pairing"
      }
    }
  }
}
```

**Getting bot token:**
1. [Discord Developer Portal](https://discord.com/developers/applications)
2. Create App → Bot → Add Bot → Copy Token
3. **Important**: Enable MESSAGE CONTENT INTENT

---

## Slack

```json5
{
  // ... existing config ...
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-YOUR_BOT_TOKEN_HERE",
      appToken: "xapp-YOUR_APP_TOKEN_HERE"
    }
  }
}
```

**Getting tokens:**
1. [Slack API](https://api.slack.com/apps) → Create App
2. Bot Token: OAuth & Permissions → Install to Workspace
3. App Token: Basic Information → App-Level Tokens

---

## How to Use Raw Config

1. Go to `/setup` page
2. Scroll to **"Config editor (advanced)"**
3. Click **"Reload"** to load current config
4. Edit the JSON to add your channel configuration
5. Click **"Save"** (creates backup and restarts gateway)

### Example: Adding Signal to existing config

Before:
```json5
{
  gateway: {
    auth: {
      mode: "token",
      token: "abc123..."
    }
  }
}
```

After:
```json5
{
  gateway: {
    auth: {
      mode: "token",
      token: "abc123..."
    }
  },
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

## Common Policy Options

```json5
{
  groupPolicy: "allowlist",  // | "blocklist" | "all"
  dm: {
    policy: "pairing"        // | "all" | "blocklist" | "allowlist"
  }
}
```

- `pairing`: Users must send a pairing code first (recommended for DM)
- `allowlist`: Only specified users can interact
- `all`: Anyone can interact (use with caution)

---

## Verify Configuration

After saving, use the Debug Console to verify:

1. Select `openclaw.config.get`
2. Enter arg: `channels`
3. Click **Run**

This will show all configured channels.
