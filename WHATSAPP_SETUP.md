# WhatsApp Setup for OpenClaw

## Overview

This document describes how to set up WhatsApp Business integration with OpenClaw.

## Prerequisites

1. **Meta Business Account** - Create a free account at [business.facebook.com](https://business.facebook.com)
2. **WhatsApp Business App** - Create an app in Meta for Developers
3. **OpenClaw Instance** - Deployed and accessible

## Getting WhatsApp Credentials

### Step 1: Create a Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app (select **Business** type)
3. Add **WhatsApp** product to your app

### Step 2: Get Phone Number ID

1. In your app, go to **WhatsApp** → **Messaging**
2. Click **Send message** button (this is a test interface)
3. Your **Phone Number ID** is displayed in the "To" field
4. Format: `123456789012345` (15 digits)

### Step 3: Get Access Token

1. In **WhatsApp** → **API Setup**
2. Copy the **Temporary Access Token** (for testing)
3. For production, generate a permanent token:
   - Go to **System Users** in your app settings
   - Create a system user with WhatsApp permissions
   - Generate a token with `whatsapp_business_messaging` permission

### Step 4: Get Business Account ID (Optional)

1. Go to [Business Settings](https://business.facebook.com/settings/)
2. Under **Business assets**, find **WhatsApp Accounts**
3. Copy the Business Account ID

## Setup via /setup Page

1. Navigate to `https://your-domain.up.railway.app/setup`
2. Complete the main onboarding first (Model/auth provider)
3. Scroll to **"2b) Optional: WhatsApp Business"**
4. Fill in the fields:
   - **WhatsApp Phone Number ID** - Your 15-digit ID
   - **WhatsApp Access Token** - Token from Meta
   - **WhatsApp Business Account ID** - Optional
   - **WhatsApp Verify Token** - Leave empty to auto-generate
5. Click **"Run setup"**

## Webhook Configuration

After setup completes, you'll see:
- **Webhook URL**: `https://your-domain.up.railway.app/webhook/whatsapp`
- **Verify Token**: Auto-generated or your custom token

### Configure in Meta:

1. Go to your App → **WhatsApp** → **Configuration**
2. Click **Edit** next to Webhook
3. Paste the Webhook URL
4. Paste the Verify Token
5. Subscribe to webhook events:
   - `messages`
   - `message_status` (optional)

## Testing

Send a test message to your WhatsApp Business number. OpenClaw should receive and process it.

## Raw Config Format

If the UI doesn't work, use the **Config editor** on `/setup` page:

```json5
{
  channels: {
    whatsapp: {
      enabled: true,
      phoneNumberId: "123456789012345",
      accessToken: "EAAxxxxxxxxxxxxxx",
      businessAccountId: "123456789012345",  // optional
      verifyToken: "your-custom-token",
      groupPolicy: "allowlist",
      dm: {
        policy: "pairing"
      }
    }
  }
}
```

## Troubleshooting

### "WhatsAppSchema unavailable. Use Raw."

This means the OpenClaw build doesn't have the WhatsApp schema. Use the **Config editor (advanced)** section on `/setup` page to manually add the configuration.

### Webhook verification fails

- Ensure the Verify Token matches exactly
- Check your webhook URL is accessible from the internet
- Verify the webhook endpoint is `/webhook/whatsapp`

### Messages not received

- Check OpenClaw logs: `/setup` → Debug console → `openclaw.logs.tail`
- Verify the phone number has the WhatsApp Business account linked
- Ensure the access token is valid and not expired

## Security Notes

- Never commit access tokens to version control
- Use environment variables for production deployments
- Rotate access tokens periodically (Meta recommends 60-90 days)
- Limit token permissions to only `whatsapp_business_messaging`
