/**
 * Push Notification Service
 *
 * Sends web push notifications to all (or targeted) subscribers.
 * Uses the web-push library; gracefully degrades if VAPID keys are not configured.
 */
const { PushSubscription } = require('../models');

let webPush = null;

// Only load web-push if VAPID keys are configured
function loadWebPush() {
  try {
    const keysSet = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;
    if (!keysSet) {
      console.warn('[push] VAPID keys not set — push notifications are disabled');
      return null;
    }
    const wp = require('web-push');
    wp.setVapidDetails(
      'mailto:support@civicsense.ai',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    return wp;
  } catch (e) {
    console.warn('[push] web-push library not available:', e.message);
    return null;
  }
}

/**
 * Send a push notification to all subscribed users (or filtered by userIds).
 * Silently ignores dead subscriptions (endpoint 410 gone).
 */
async function sendPush(title, body, { url = '/complaints', userIds = null } = {}) {
  if (!webPush) webPush = loadWebPush();
  if (!webPush) return { sent: 0, failed: 0 };

  // Fetch subscriptions, optionally filtered
  const where = {};
  if (userIds && userIds.length) {
    const { Op } = require('sequelize');
    where.userId = { [Op.in]: userIds };
  }

  const subs = await PushSubscription.findAll({ where });
  if (!subs.length) return { sent: 0, failed: 0 };

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.getKeys() },
          payload,
          { TTL: 3600 } // 1 hour TTL
        );
        sent++;
      } catch (err) {
        // 410 Gone = subscription expired → delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.destroy({ where: { id: sub.id } }).catch(() => {});
        }
        failed++;
      }
    })
  );

  return { sent, failed, total: subs.length };
}

module.exports = { sendPush };
