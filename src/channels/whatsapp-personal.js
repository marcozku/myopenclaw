// WhatsApp Personal Channel Handler using whatsapp-web.js
// This allows using a regular WhatsApp account (not Business API)

import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Session state directory
const SESSIONS_DIR = path.join(os.homedir(), ".openclaw", "whatsapp-sessions");

// Active clients
const clients = new Map();
// Message handlers for each client
const messageHandlers = new Map();

// Ensure sessions directory exists (deferred until first use)
function ensureSessionsDir() {
  try {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
  } catch (err) {
    console.error("[whatsapp-personal] Failed to create sessions dir:", SESSIONS_DIR, err);
    // Non-fatal - some operations may still work
  }
}

/**
 * Create and initialize a WhatsApp client
 * @param {string} sessionId - Unique identifier for this session
 * @param {Object} config - Configuration object
 * @param {Function} onMessage - Callback for incoming messages
 * @returns {Promise<Object>} Client info with status
 */
export async function createClient(sessionId, config = {}, onMessage = null) {
  // Ensure directory exists before creating client
  ensureSessionsDir();

  if (clients.has(sessionId)) {
    return { success: true, status: "ready", message: "Client already exists" };
  }

  const clientOptions = {
    authStrategy: new LocalAuth({
      dataPath: SESSIONS_DIR,
      clientId: sessionId,
    }),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    },
  };

  // Custom webhook URL for proxying messages to OpenClaw
  const webhookUrl = config.webhookUrl;

  const client = new Client(clientOptions);

  // Store message handler
  if (onMessage) {
    messageHandlers.set(sessionId, onMessage);
  }

  // QR Code event - needs to be scanned
  client.on("qr", (qr) => {
    console.log(`[whatsapp:${sessionId}] QR Code received. Scan with WhatsApp:`);
    qrcode.generate(qr, { small: true });
    // Store QR for retrieval via API
    client.lastQr = qr;
  });

  // Ready event - client is authenticated
  client.on("ready", () => {
    console.log(`[whatsapp:${sessionId}] Client is ready!`);
    client.isReady = true;
  });

  // Authentication failure
  client.on("auth_failure", (msg) => {
    console.error(`[whatsapp:${sessionId}] Authentication failure:`, msg);
    client.authFailure = msg;
  });

  // Disconnection
  client.on("disconnected", (reason) => {
    console.log(`[whatsapp:${sessionId}] Disconnected:`, reason);
    client.isReady = false;
  });

  // Incoming message
  client.on("message", async (message) => {
    try {
      const from = message.from;
      const body = message.body;
      const fromContact = await message.getContact();

      const messageData = {
        channel: "whatsapp-personal",
        sessionId,
        from: from,
        fromNumber: from.split("@")[0],
        fromName: fromContact.pushname || fromContact.name || fromContact.verifiedName || "Unknown",
        body: body,
        timestamp: new Date(message.timestamp * 1000).toISOString(),
        messageType: message.type,
        isGroup: from.includes("@g.us"),
      };

      console.log(`[whatsapp:${sessionId}] Message from ${messageData.fromName}: ${body.substring(0, 50)}...`);

      // Call registered handler
      const handler = messageHandlers.get(sessionId);
      if (handler) {
        await handler(messageData);
      }

      // If webhook URL configured, forward the message
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(messageData),
          }).catch(err => console.error(`[whatsapp:${sessionId}] Webhook error:`, err.message));
        } catch (err) {
          console.error(`[whatsapp:${sessionId}] Webhook error:`, err.message);
        }
      }
    } catch (err) {
      console.error(`[whatsapp:${sessionId}] Error processing message:`, err);
    }
  });

  // Initialize the client
  await client.initialize();

  clients.set(sessionId, client);

  return {
    success: true,
    status: "initializing",
    message: "Client initialized. Scan QR code with WhatsApp.",
  };
}

/**
 * Get current QR code for a session
 * @param {string} sessionId
 * @returns {string|null} QR code or null
 */
export function getQrCode(sessionId) {
  const client = clients.get(sessionId);
  return client?.lastQr || null;
}

/**
 * Check if client is ready
 * @param {string} sessionId
 * @returns {boolean}
 */
export function isReady(sessionId) {
  const client = clients.get(sessionId);
  return client?.isReady === true;
}

/**
 * Get client status
 * @param {string} sessionId
 * @returns {Object}
 */
export function getStatus(sessionId) {
  const client = clients.get(sessionId);
  if (!client) {
    return { status: "not_found" };
  }

  return {
    status: client.isReady ? "ready" : "initializing",
    hasAuthFailure: !!client.authFailure,
    authFailure: client.authFailure || null,
    hasQr: !!client.lastQr,
  };
}

/**
 * Send a message
 * @param {string} sessionId
 * @param {string} to - Recipient number (with @c.us suffix)
 * @param {string} message - Message content
 * @returns {Promise<Object>}
 */
export async function sendMessage(sessionId, to, message) {
  const client = clients.get(sessionId);
  if (!client) {
    throw new Error("Client not found");
  }
  if (!client.isReady) {
    throw new Error("Client not ready. Please scan QR code first.");
  }

  // Ensure number format
  let recipient = to;
  if (!recipient.includes("@")) {
    // Add @c.us for individual messages
    recipient = `${recipient}@c.us`;
  }

  await client.sendMessage(recipient, message);
  return { success: true, recipient, message };
}

/**
 * Disconnect and remove a client
 * @param {string} sessionId
 * @returns {Promise<boolean>}
 */
export async function disconnectClient(sessionId) {
  const client = clients.get(sessionId);
  if (!client) {
    return false;
  }

  try {
    await client.destroy();
  } catch {
    // ignore
  }

  clients.delete(sessionId);
  messageHandlers.delete(sessionId);

  return true;
}

/**
 * Get all active sessions
 * @returns {string[]}
 */
export function getActiveSessions() {
  return Array.from(clients.keys());
}

/**
 * Get authenticated user info
 * @param {string} sessionId
 * @returns {Promise<Object|null>}
 */
export async function getClientInfo(sessionId) {
  const client = clients.get(sessionId);
  if (!client || !client.isReady) {
    return null;
  }

  try {
    const info = client.info;
    return {
      pushName: info.pushname,
      number: info.wid.user,
      platform: info.platform,
    };
  } catch {
    return null;
  }
}
