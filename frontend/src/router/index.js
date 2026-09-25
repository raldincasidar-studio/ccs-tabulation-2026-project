import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import JudgeView from '@/views/JudgeView.vue';
import AdminView from '@/views/AdminView.vue';
import ProjectionView from '@/views/ProjectionView.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView },
  { 
    path: '/judge', 
    name: 'judge', 
    component: JudgeView,
    meta: { requiresAuth: true, role: 'Judge' } 
  },
  { 
    path: '/admin', 
    name: 'admin', 
    component: AdminView,
    meta: { requiresAuth: true, role: 'Admin' } 
  },
  { path: '/projection', name: 'projection', component: ProjectionView }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Simple Auth Navigation Guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  if (to.meta.requiresAuth && !token) {
    return next('/login');
  }
  if (to.meta.role && user?.userType !== to.meta.role) {
    return next('/login');
  }
  next();
});

export default router;