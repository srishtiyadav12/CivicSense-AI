/**
 * Push notification helpers — request permission, subscribe, unsubscribe.
 * Uses the service-worker registered in public/index.html.
 */
import api from './client';

/**
 * Convert a VAPID public key from base64url to a Uint8Array.
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if push notifications are supported and enabled.
 */
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Check current permission status.
 * Returns: 'granted' | 'denied' | 'default' | 'unsupported'
 */
export async function getPermissionState() {
  if (!isPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.permission;
}

/**
 * Request push permission and subscribe the user.
 * Requires the service-worker to be registered and VAPID key on the server.
 * Returns { subscription, error }.
 */
export async function subscribePush(vapidPublicKey) {
  if (!isPushSupported()) return { subscription: null, error: 'Push notifications are not supported in this browser.' };
  if (!vapidPublicKey) return { subscription: null, error: 'VAPID public key is not configured.' };

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { subscription: null, error: 'Notification permission was denied.' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const existingSub = await reg.pushManager.getSubscription();

    // If already subscribed, just push the existing subscription to the backend
    if (existingSub) {
      await api.post('/notifications/subscribe', existingSub.toJSON());
      return { subscription: existingSub, error: null };
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    await api.post('/notifications/subscribe', sub.toJSON());
    return { subscription: sub, error: null };
  } catch (e) {
    return { subscription: null, error: e.message || 'Failed to subscribe to push notifications' };
  }
}

/**
 * Unsubscribe the current browser from push notifications.
 */
export async function unsubscribePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;
    await api.post('/notifications/unsubscribe', { endpoint: sub.endpoint });
    await sub.unsubscribe();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if the current browser has an active push subscription.
 */
export async function isPushSubscribed() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
