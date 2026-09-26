import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'https://ccs-tabulation-2026-project.vercel.app/api/v1-mock',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Bearer token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap response and handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorPayload = error.response?.data?.error;

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('expiresAt');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject({
      code: errorPayload?.code || 'REQUEST_FAILED',
      message: errorPayload?.message || error.message || 'An unexpected error occurred',
      details: errorPayload?.details || [],
    });
  }
);

export default api;