import api from './api.js';

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });
  const payload = response?.data?.data || response?.data || response;
  const { token, user, expiresAt } = payload || {};
  saveSession(token, user, expiresAt);
  return user;
}

export async function logout() {
  try {
    const response = await api.post('/auth/logout', {});
    return response;
  } catch (error) {
    console.warn('Logout notification to server failed:', error?.message || error);
  } finally {
    clearSession();
  }
}

export function saveSession(token, user, expiresAt) {
  if (!token || !user || typeof user !== 'object' || Array.isArray(user)) {
    clearSession();
    throw new Error('Login response did not include a valid token and user.');
  }

  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (expiresAt) {
    localStorage.setItem('expiresAt', expiresAt);
  } else {
    localStorage.removeItem('expiresAt');
  }
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
  sessionStorage.clear();
}

export function getCurrentUser() {
  const user = localStorage.getItem('user');
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  const expiresAt = localStorage.getItem('expiresAt');

  if (!token || !user) {
    clearSession();
    return false;
  }

  if (expiresAt) {
    const expiration = Date.parse(expiresAt);
    if (!Number.isFinite(expiration) || expiration <= Date.now()) {
      clearSession();
      return false;
    }
  }

  return true;
}

export default {
  login,
  logout,
  saveSession,
  clearSession,
  getCurrentUser,
  isAuthenticated,
};
