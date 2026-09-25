import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap standard contract response & handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const payload = error.response?.data?.error;
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject({
      code: payload?.code || 'NETWORK_ERROR',
      message: payload?.message || error.message,
      details: payload?.details || [],
    });
  }
);

export default api;