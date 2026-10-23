import axios from 'axios';

// Support decoupled production backend via VITE_API_URL or default to relative /api/v1
const customApiUrl = import.meta.env.VITE_API_URL;
const baseURL = customApiUrl ? `${customApiUrl.replace(/\/+$/, '')}/api/v1` : '/api/v1';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('b2b_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or revoked
      localStorage.removeItem('b2b_token');
      localStorage.removeItem('b2b_user');
      // Only redirect if not already on login or register
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
