import api from './api.js';

export async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });
  const { token, user, expiresAt } = response.data || response;
  saveSession(token, user, expiresAt);
  return user;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearSession();
  }
}

export function saveSession(token, user, expiresAt) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  if (expiresAt) {
    localStorage.setItem('expiresAt', expiresAt);
  }
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
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
  const user = localStorage.getItem('user');
  return !!(token && user);
}