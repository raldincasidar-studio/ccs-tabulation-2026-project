import api from './api.js';

// Seed credentials matching Page 2 of the API Contract
const CONTRACT_MOCK_USERS = [
  {
    username: 'admin',
    password: 'adminpassword123',
    user: {
      _id: '65f8a123b0a9c12345678900',
      username: 'admin',
      userType: 'Admin',
      firstName: 'Admin',
      lastName: 'System',
      fullName: 'Admin System',
      isActive: true,
    },
    token: 'mock-jwt-admin-token-2026',
  },
  {
    username: 'judge_donde',
    password: 'password123',
    user: {
      _id: '65f8a123b0a9c12345678901',
      username: 'judge_donde',
      userType: 'Judge',
      firstName: 'Nay',
      lastName: 'Donde',
      fullName: 'Nay Donde',
      isActive: true,
    },
    token: 'mock-jwt-donde-token-2026',
  },
  {
    username: 'judge_lester',
    password: 'password123',
    user: {
      _id: '65f8a123b0a9c12345678902',
      username: 'judge_lester',
      userType: 'Judge',
      firstName: 'Sir',
      lastName: 'Lester',
      fullName: 'Sir Lester',
      isActive: true,
    },
    token: 'mock-jwt-lester-token-2026',
  },
  {
    username: 'judge_daynver',
    password: 'password123',
    user: {
      _id: '65f8a123b0a9c12345678903',
      username: 'judge_daynver',
      userType: 'Judge',
      firstName: 'Sir',
      lastName: 'Daynver',
      fullName: 'Sir Daynver',
      isActive: true,
    },
    token: 'mock-jwt-daynver-token-2026',
  },
  {
    username: 'judge_jhunie',
    password: 'password123',
    user: {
      _id: '65f8a123b0a9c12345678904',
      username: 'judge_jhunie',
      userType: 'Judge',
      firstName: 'Sir',
      lastName: 'Jhunie',
      fullName: 'Sir Jhunie Jumawan',
      isActive: true,
    },
    token: 'mock-jwt-jhunie-token-2026',
  },
  {
    username: 'judge_noreen',
    password: 'password123',
    user: {
      _id: '65f8a123b0a9c12345678905',
      username: 'judge_noreen',
      userType: 'Judge',
      firstName: "Ma'am",
      lastName: 'Noreen',
      fullName: "Ma'am Noreen Lagahit",
      isActive: true,
    },
    token: 'mock-jwt-noreen-token-2026',
  },
];

export async function login(username, password) {
  try {
    // 1.1 POST /api/v1/auth/login
    const response = await api.post('/auth/login', { username, password });
    const authData = response.data || response;
    saveSession(authData.token, authData.user);
    return authData.user;
  } catch (error) {
    // Fallback to contract seed credentials
    const matched = CONTRACT_MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (matched) {
      console.info(`Logged in as ${matched.user.fullName} (${matched.user.userType})`);
      saveSession(matched.token, matched.user);
      return matched.user;
    }

    throw new Error(error.message || 'Invalid username or password');
  }
}

export async function logout() {
  try {
    // 1.2 POST /api/v1/auth/logout
    await api.post('/auth/logout');
  } catch (e) {
    // Ignore network failures on logout during dev
  } finally {
    clearSession();
  }
}

export function saveSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}