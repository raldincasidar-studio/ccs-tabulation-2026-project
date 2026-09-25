import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, getCurrentUser } from '@/services/authService';

import LoginView from '@/views/LoginView.vue';
import JudgeView from '@/views/JudgeView.vue';
import AdminView from '@/views/AdminView.vue';

const routes = [
  {
    path: '/',
    redirect: '/login',
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { guestOnly: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/judge',
    name: 'judge',
    component: JudgeView,
    meta: { requiresAuth: true, role: 'Judge' },
  },
  {
    // Catch-all route to redirect invalid URLs back to login
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const loggedIn = isAuthenticated();
  const user = getCurrentUser();

  // 1. If already logged in, redirect away from login to their portal
  if (to.meta.guestOnly && loggedIn) {
    if (user?.userType === 'Admin') return next({ name: 'admin' });
    if (user?.userType === 'Judge') return next({ name: 'judge' });
  }

  // 2. Unauthenticated users cannot access protected pages
  if (to.meta.requiresAuth && !loggedIn) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    });
  }

  // 3. Role check: Admin cannot enter /judge, and Judge cannot enter /admin
  if (to.meta.role && user?.userType !== to.meta.role) {
    if (user?.userType === 'Admin') return next({ name: 'admin' });
    if (user?.userType === 'Judge') return next({ name: 'judge' });
    return next({ name: 'login' });
  }

  next();
});

export default router;