const express = require('express');
const router = express.Router();
const { PushSubscription } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');

// All notification routes require auth
router.use(authenticate);

/**
 * POST /api/notifications/subscribe
 * Store a push subscription (one per endpoint; reuses if already present).
 * Body: { endpoint, keys: { p256dh, auth } }
 */
router.post('/subscribe', asyncHandler(async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ success: false, message: 'endpoint and keys (p256dh + auth) are required' });
  }

  // Upsert: find existing by endpoint, or create new
  const [sub, created] = await PushSubscription.findOrCreate({
    where: { endpoint },
    defaults: {
      endpoint,
      keys: JSON.stringify(keys),
      userId: req.user.id
    }
  });

  // If it already existed but under a different user, update ownership
  if (!created && sub.userId !== req.user.id) {
    await sub.update({ userId: req.user.id, keys: JSON.stringify(keys) });
  }

  res.status(200).json({ success: true, message: 'Subscribed to push notifications' });
}));

/**
 * DELETE /api/notifications/unsubscribe
 * Remove the caller's push subscription.
 */
router.post('/unsubscribe', asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) {
    return res.status(400).json({ success: false, message: 'endpoint is required' });
  }

  await PushSubscription.destroy({ where: { endpoint, userId: req.user.id } });
  res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
}));

module.exports = router;
