import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token expiry / auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid session
      localStorage.removeItem('cs_token');
      localStorage.removeItem('cs_user');

      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Complaints
export const complaintApi = {
  create: (data) => {
    // If data contains files, send as multipart/form-data
    if (data instanceof FormData) {
      return api.post('/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    return api.post('/complaints', data);
  },
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  updateStatus: (id, data) => api.patch(`/complaints/${id}/status`, data),
  resolve: (id, data) => api.patch(`/complaints/${id}/resolve`, data),
  rate: (id, data) => api.post(`/complaints/${id}/rate`, data),
  reopen: (id, data) => api.post(`/complaints/${id}/reopen`, data),
  merge: (data) => api.post('/complaints/merge', data),
  remove: (id) => api.delete(`/complaints/${id}`)
};

// Dashboard & Analytics
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getTrends: (days = 30) => api.get('/dashboard/trends', { params: { days } }),
  getHeatmap: (params = {}) => api.get('/dashboard/heatmap', { params })
};

// Users
export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getOfficials: () => api.get('/users/officials'),
  update: (id, data) => api.patch(`/users/${id}`, data)
};

// Departments
export const departmentApi = {
  getAll: () => api.get('/departments'),
  getCatalogue: () => api.get('/departments/catalogue')
};

// AI Service
export const aiApi = {
  analyze: (data) => api.post('/ai/analyze', data),
  similar: (id, data) => api.post(`/ai/similar/${id}`, data),
  health: () => api.get('/ai/health')
};

// Public transparency (no auth)
export const publicApi = {
  getDashboard: (days = 30) => api.get(`/public/dashboard?days=${days}`),
  track: (id) => api.get(`/public/track/${id}`)
};

// Complaint clusters (auto-grouped similar complaints)
export const clusterApi = {
  getAll: (params = {}) => api.get('/clusters', { params }),
  getById: (id) => api.get(`/clusters/${id}`),
  rebuild: () => api.post('/clusters/rebuild')
};

// Return the API base URL (used to build absolute upload URLs on the frontend)
export const getApiBase = () =>
  (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default api;
