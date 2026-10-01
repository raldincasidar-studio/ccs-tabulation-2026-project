import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated, getCurrentUser } from '@/services/authService';

import LoginView from '@/views/LoginView.vue';
import JudgeDashboardView from '@/views/JudgeDashboardView.vue';
import JudgeCategoryVoteView from '@/views/JudgeCategoryVoteView.vue';
import AdminView from '@/views/AdminView.vue';
import JudgeLiveView from '@/views/JudgeLiveView.vue';
import ContestantManagementView from '@/views/ContestantManagementView.vue';
import AddContestantManagement from '@/views/AddContestantManagement.vue';
import ConfigurationView from '@/views/ConfigurationView.vue';
import AddContestantGroupView from '@/views/AddContestantGroupView.vue';
import AddCategoriesView from '@/views/AddCategoriesView.vue';
import ReportView from '@/views/ReportView.vue';
import LiveControlsView from '@/views/LiveControlsView.vue';

const routes = [
  {
    path: '/',
    redirect: '/reports',
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/reports',
    name: 'admin-reports',
    redirect: { name: 'reports' },
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: AdminView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/configurations',
    name: 'configurations',
    redirect: '/dashboard',
  },
  {
    path: '/management',
    name: 'management',
    redirect: '/dashboard',
  },
  {
    path: '/contestants',
    name: 'contestants',
    redirect: '/dashboard',
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
    redirect: '/dashboard',
  },
  {
    path: '/admin/judges',
    name: 'admin-judges',
    component: AdminView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/contestants',
    name: 'admin-contestants',
    component: ContestantManagementView,
    alias: '/admin/management',
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/add-contestant',
    name: 'AddContestantManagement',
    component: AddContestantManagement,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/add-contestant/edit/:id',
    name: 'EditContestantManagement',
    component: AddContestantManagement,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/configurations',
    name: 'Configuration',
    component: ConfigurationView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
  path: '/admin/contestant-groups/add',
  name: 'AddContestantGroup',
  component: AddContestantGroupView,
  meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/contestant-groups/edit/:id',
    name: 'EditContestantGroup',
    component: AddContestantGroupView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/categories/add',
    name: 'AddCategories',
    component: AddCategoriesView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/admin/categories/edit/:id',
    name: 'EditCategories',
    component: AddCategoriesView,
    meta: { requiresAuth: true, role: 'Admin' },
  },
  {
    path: '/judge',
    name: 'judge',
    component: JudgeDashboardView,
    meta: { requiresAuth: true, role: 'Judge' },
  },
  {
    path: '/judge/category/:categoryId',
    name: 'JudgeCategoryVote',
    component: JudgeCategoryVoteView,
    meta: { requiresAuth: true, role: 'Judge' },
  },
   {
    path: '/judge/live',
    name: 'JudgeLive',
    component: JudgeLiveView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/live-controls',
    name: 'LiveControls',
    component: LiveControlsView,
    meta: { requiresAuth: true }
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