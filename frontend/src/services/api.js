import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('sh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected server error occurred';

    // Auto logout on 401 Unauthorized
    if (error.response?.status === 401) {
      const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthRequest) {
        localStorage.removeItem('sh_token');
        localStorage.removeItem('sh_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?sessionExpired=true';
        }
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
