<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';

const route = useRoute();
const router = useRouter();
const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isReportRoute = computed(() => route.name === 'reports');

function updateViewportState() {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isMobileSidebarOpen.value = false;
    isSidebarCollapsed.value = false;
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
  router.push('/login');
}

onMounted(() => {
  updateViewportState();
  window.addEventListener('resize', updateViewportState);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportState);
});
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-slate-100 antialiased">
    <div
      v-if="isReportRoute"
      class="min-h-screen bg-slate-100"
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '180px' }"
    >
      <button
        v-if="isMobile"
        type="button"
        class="fixed left-4 top-4 z-30 flex h-12 w-12 flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-300/50 bg-[#080d31] shadow-lg md:hidden"
        aria-label="Open navigation menu"
        :aria-expanded="isMobileSidebarOpen"
        @click="isMobileSidebarOpen = !isMobileSidebarOpen"
      >
        <span class="h-0.5 w-6 rounded-full bg-white"></span>
        <span class="h-0.5 w-6 rounded-full bg-white"></span>
        <span class="h-0.5 w-6 rounded-full bg-white"></span>
      </button>
      <div
        v-if="isMobile && isMobileSidebarOpen"
        class="fixed inset-0 z-[12] bg-black/40 md:hidden"
        @click="isMobileSidebarOpen = false"
      ></div>
      <Sidebar
        :is-mobile="isMobile"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :is-mobile-sidebar-open="isMobileSidebarOpen"
        @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
        @close-mobile-sidebar="isMobileSidebarOpen = false"
        @logout="handleLogout"
      />
      <div :class="isMobile ? '' : 'ml-[var(--sidebar-width)]'">
        <router-view />
      </div>
    </div>
    <router-view v-else />
  </div>
</template>