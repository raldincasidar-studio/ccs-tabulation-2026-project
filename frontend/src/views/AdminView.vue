<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import AdminScoringMonitor from "@/components/AdminScoringMonitor.vue";
import JudgeManagementView from "@/views/JudgeManagementView.vue";
import starImage from "@/assets/img/star.png";

const route = useRoute();
const router = useRouter();
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMobile = ref(false);

function updateViewportState() {
  isMobile.value = window.innerWidth < 768;
  isMobileSidebarOpen.value = false;
  if (isMobile.value) isSidebarCollapsed.value = false;
}

onMounted(() => {
  updateViewportState();
  window.addEventListener("resize", updateViewportState);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportState);
});

function handleLogout() {
  // Sidebar invalidates the server session and clears local auth storage.
  router.push("/login");
}
</script>

<template>
  <div class="admin-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div
      class="admin-dashboard"
      :style="{
        '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px',
      }"
      :class="{
        'sidebar-collapsed': isSidebarCollapsed && !isMobile,
        'mobile-sidebar-open': isMobileSidebarOpen && isMobile,
      }"
    >
      <button
        v-if="isMobile"
        class="mobile-hamburger"
        type="button"
        aria-label="Open navigation menu"
        aria-controls="admin-navigation"
        :aria-expanded="isMobileSidebarOpen"
        @click="isMobileSidebarOpen = !isMobileSidebarOpen"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div
        v-if="isMobile && isMobileSidebarOpen"
        class="mobile-sidebar-overlay"
        @click="isMobileSidebarOpen = false"
      ></div>

      <Sidebar
        id="admin-navigation"
        :active-item="route.path === '/admin/judges' ? 'JUDGES' : 'DASHBOARD'"
        :is-mobile="isMobile"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :is-mobile-sidebar-open="isMobileSidebarOpen"
        @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
        @close-mobile-sidebar="isMobileSidebarOpen = false"
        @toggle-mobile-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen"
        @logout="handleLogout"
      />

      <main id="dashboard" class="main-content">
        <div class="dashboard-content">
          <header class="page-header" :class="{ 'judge-page-header': route.path === '/admin/judges' }">
            <h1>{{ route.path === "/admin/judges" ? "JUDGE MANAGEMENT" : "DASHBOARD" }}</h1>
          </header>

          <div v-if="route.path === '/admin/judges'" class="judge-management-content">
            <JudgeManagementView />
          </div>

          <AdminScoringMonitor v-else />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.admin-frame {
  min-height: 100vh;
  padding: 0;
  background: #f3f5f4;
}

.admin-dashboard {
  --sidebar-width: 218px;
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f3f5f4;
  color: #101747;
}

.main-content {
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 24px);
  margin-left: var(--sidebar-width);
  padding: clamp(22px, 2.5vw, 56px) clamp(18px, 2.8vw, 58px) 56px;
  transition: margin-left 0.25s ease;
}

.dashboard-content {
  width: min(100%, 1240px);
  margin: 0 auto;
  box-sizing: border-box;
}

.judge-management-content {
  margin-top: 80px;
}

.page-header {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 130px;
  align-items: center;
  overflow: hidden;
  padding: 0 20px;
  border: 1px solid rgb(116 148 255 / 22%);
  border-radius: 10px;
  background-color: #080a51;
  background-image: var(--star-image), var(--star-image), var(--star-image), var(--star-image),
    linear-gradient(110deg, #080a47, #1317a5 54%, #080a47);
  background-repeat: no-repeat;
  background-position: 39% 24%, 58% 76%, 76% 30%, 93% 67%, center;
  background-size: 17px 17px, 12px 12px, 15px 15px, 10px 10px, auto;
  box-shadow: 0 3px 10px rgb(8 12 65 / 12%);
  color: #fff;
}

.page-header.judge-page-header {
  top: 6px;
  left: 29px;
  width: 985px;
  height: 200px;
  min-height: 200px;
  flex: 0 0 985px;
  border-radius: 17px;
}

.page-header::before {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(115deg, transparent 47%, rgb(117 155 255 / 30%) 47.15%, transparent 47.4%),
    linear-gradient(22deg, transparent 37%, rgb(117 155 255 / 24%) 37.15%, transparent 37.4%),
    linear-gradient(155deg, transparent 74%, rgb(117 155 255 / 20%) 74.15%, transparent 74.4%);
  content: "";
  pointer-events: none;
}

.page-header h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #e4eaff;
  font-family: "Croparo", sans-serif;
  font-size: 55px;
  font-weight: 500;
  line-height: 100%;
  letter-spacing: 0;
  text-shadow: 0 0 7px rgb(142 171 255 / 40%);
}

.page-header.judge-page-header h1 {
  transform: translateY(-40px);
}

.mobile-hamburger {
  position: fixed;
  top: 16px;
  left: 14px;
  z-index: 30;
  display: none;
  width: 38px;
  height: 34px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 1px solid #2d25c8;
  border-radius: 5px;
  background: #08065a;
  box-sizing: border-box;
  cursor: pointer;
}

.mobile-hamburger span {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: #fff;
}

.mobile-sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 12;
  background: rgb(0 0 0 / 42%);
}

@media (max-width: 760px) {
  .main-content {
    margin-left: 0;
    padding: 18px 16px 30px;
  }

}

@media (max-width: 767px) {
  .mobile-hamburger {
    display: flex;
  }

  .admin-dashboard {
    --sidebar-width: 0px;
  }

  .main-content {
    width: 100%;
    margin-left: 0;
    padding-top: 72px;
  }
}

@media (max-width: 520px) {
  .page-header { min-height: 100px; padding: 0 16px; }
  .page-header h1 { font-size: 38px; }
}
</style>