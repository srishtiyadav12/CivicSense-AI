/**
 * CivicSense Mobile — API client (shared REST backend).
 * Mirrors the web frontend's api/client.js.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Resolve the backend host at runtime so Expo Go "just works" without
// hardcoding a LAN IP:
//  1. EXPO_PUBLIC_API_URL  — explicit override (set in mobile/.env if needed).
//  2. Auto-discover: derive the dev machine's LAN IP from Expo's Metro
//     hostUri (the same host that serves the JS bundle to the phone).
function resolveApiBase() {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit) return explicit;

  try {
    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.expoGoConfig?.debuggerHost ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (hostUri) {
      // hostUri looks like "192.168.1.5:8081" — swap to the API port.
      const host = hostUri.split(':')[0];
      if (host) return `http://${host}:5000/api`;
    }
  } catch {}

  return 'http://192.168.1.5:5000/api';
}

const API_URL = resolveApiBase();

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

// Inject JWT token from secure storage
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('cs_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 / token expiry
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['cs_token', 'cs_user']);
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const complaintApi = {
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/complaints', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/complaints', data);
  },
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  rate: (id, data) => api.post(`/complaints/${id}/rate`, data),
  reopen: (id, data) => api.post(`/complaints/${id}/reopen`, data),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTrends: (days = 30) => api.get('/dashboard/trends', { params: { days } }),
};

export const clustersApi = {
  getClusters: () => api.get('/clusters'),
};

export const publicApi = {
  getDashboard: (days = 30) => api.get(`/public/dashboard?days=${days}`),
  track: (id) => api.get(`/public/track/${id}`),
};

export const notificationApi = {
  subscribe: (sub) => api.post('/notifications/subscribe', sub),
  unsubscribe: (endpoint) => api.post('/notifications/unsubscribe', { endpoint }),
};

export const getApiBase = () => API_URL.replace(/\/api\/?$/, '');
export default api;
