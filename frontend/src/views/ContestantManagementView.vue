<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import starImage from '@/assets/img/star.png';
import { getContestants } from '@/services/contestantService';

const router = useRouter();
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMobile = ref(false);
const contestants = ref([]);
const loading = ref(true);
const error = ref('');

function updateViewportState() {
  const mobileMode = window.innerWidth < 768;
  isMobile.value = mobileMode;

  if (mobileMode) {
    isMobileSidebarOpen.value = false;
    isSidebarCollapsed.value = false;
    return;
  }

  isMobileSidebarOpen.value = false;
}

function getGroupName(group) {
  if (!group) return 'Unassigned';
  if (typeof group === 'string') return group;
  return group.name || 'Unassigned';
}

function hideBrokenImage(event) {
  event.target.hidden = true;
}

async function fetchContestants() {
  loading.value = true;
  error.value = '';

  try {
    const response = await getContestants();
    const data = Array.isArray(response) ? response : response?.data ?? [];
    contestants.value = data;
  } catch (err) {
    contestants.value = [];
    error.value = err?.message || 'Unable to load contestants.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  updateViewportState();
  window.addEventListener('resize', updateViewportState);
  fetchContestants();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportState);
});

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}
</script>

<template>
  <div class="admin-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div
      class="admin-dashboard"
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '180px' }"
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
        :is-mobile="isMobile"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :is-mobile-sidebar-open="isMobileSidebarOpen"
        @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
        @close-mobile-sidebar="isMobileSidebarOpen = false"
        @toggle-mobile-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen"
        @logout="handleLogout"
      />

      <main id="contestants" class="main-content">
        <div class="dashboard-content">
          <section class="w-full bg-[#edf2fb] p-6 md:p-8">
        <div class="mx-auto max-w-6xl">
          <header class="page-header">
            <h1>CONTESTANT MANAGEMENT</h1>
          </header>

          <div class="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div class="text-lg font-semibold text-slate-700">Contestants</div>
              <button
                class="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                type="button"
              >
                + Add
              </button>
            </div>

            <div v-if="loading" class="px-5 py-10 text-center text-slate-500">
              Loading contestants...
            </div>

            <div v-else-if="error" class="px-5 py-10 text-center">
              <p class="text-red-600">{{ error }}</p>
              <button
                class="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                type="button"
                @click="fetchContestants"
              >
                Retry
              </button>
            </div>

            <div v-else-if="contestants.length === 0" class="px-5 py-10 text-center text-slate-500">
              No contestants found.
            </div>

            <div v-else class="contestant-list">
              <article
                v-for="(contestant, index) in contestants"
                :key="contestant._id || contestant.id || index"
                class="contestant-row"
              >
                <div class="contestant-photo" aria-hidden="true">
                  <span></span>
                  <i></i>
                  <img
                    v-if="contestant.image"
                    :src="contestant.image"
                    alt=""
                    loading="lazy"
                    @error="hideBrokenImage"
                  >
                </div>
                <div class="contestant-details">
                  <div class="contestant-line">
                    <div class="contestant-info">
                      <span class="contestant-name">{{ contestant.name }}</span>
                      <span class="contestant-meta">
                        {{ contestant.label }} <span aria-hidden="true">·</span> {{ getGroupName(contestant.group) }}
                      </span>
                    </div>
                    <div class="contestant-actions">
                      <button class="font-semibold text-blue-800 hover:text-blue-950" type="button">
                        Edit
                      </button>
                      <button class="font-semibold text-red-700 hover:text-red-900" type="button">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div class="vote-track" aria-hidden="true">
                    <span></span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>
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
  --sidebar-width: 180px;
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
  padding: 24px 32px 42px;
  transition: margin-left 0.25s ease;
}

.dashboard-content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
}

.page-header {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 128px;
  align-items: center;
  overflow: hidden;
  padding: 0 20px;
  border: 1px solid rgb(116 148 255 / 22%);
  border-radius: 10px;
  background-color: #080a51;
  background-image: var(--star-image), var(--star-image), var(--star-image), var(--star-image), linear-gradient(110deg, #080a47, #1317a5 54%, #080a47);
  background-repeat: no-repeat;
  background-position: 39% 24%, 58% 76%, 76% 30%, 93% 67%, center;
  background-size: 17px 17px, 12px 12px, 15px 15px, 10px 10px, auto;
  box-shadow: 0 3px 10px rgb(8 12 65 / 12%);
  color: #fff;
}

.page-header::before {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(115deg, transparent 47%, rgb(117 155 255 / 30%) 47.15%, transparent 47.4%),
    linear-gradient(22deg, transparent 37%, rgb(117 155 255 / 24%) 37.15%, transparent 37.4%),
    linear-gradient(155deg, transparent 74%, rgb(117 155 255 / 20%) 74.15%, transparent 74.4%);
  content: '';
  pointer-events: none;
}

.page-header h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  transform: translateY(-18px);
  color: #e4eaff;
  font-family: 'Croparo', sans-serif;
  font-size: 34px;
  font-weight: 400;
  line-height: 100%;
  letter-spacing: 0.08em;
  text-shadow: 0 0 7px rgb(142 171 255 / 40%);
}

.mobile-hamburger {
  position: fixed;
  top: 16px;
  left: 14px;
  z-index: 30;
  display: none;
  width: 52px;
  height: 52px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0;
  border: 1px solid rgb(129 170 255 / 55%);
  border-radius: 12px;
  background: rgb(8 13 49 / 95%);
  box-shadow: 0 8px 18px rgb(11 16 68 / 30%);
  cursor: pointer;
}

.mobile-hamburger span {
  display: block;
  width: 24px;
  height: 3px;
  border-radius: 999px;
  background: #edf3ff;
}

.mobile-sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 12;
  background: rgb(0 0 0 / 42%);
}

.contestant-list {
  padding: 10px 20px 18px;
}

.contestant-row {
  display: flex;
  min-height: 62px;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e8ef;
}

.contestant-photo {
  position: relative;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  overflow: hidden;
  border: 1px solid #bec6da;
  border-radius: 6px;
  background: linear-gradient(145deg, #a9c4ee 0 44%, #d85f5b 45% 70%, #d2a742 71% 100%);
  box-shadow: 0 1px 2px rgb(16 19 61 / 18%);
}

.contestant-photo span {
  position: absolute;
  top: 5px;
  left: 11px;
  width: 9px;
  height: 11px;
  border-radius: 48% 48% 44% 44%;
  background: #d6a07c;
  box-shadow: 0 -3px 0 -1px #30231f;
}

.contestant-photo i {
  position: absolute;
  bottom: -3px;
  left: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50% 50% 0 0;
  background: #bb2935;
}

.contestant-photo img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contestant-details {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  justify-content: center;
}

.contestant-line {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.contestant-info {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  color: #34416b;
  font-family: 'Croparo', 'Poppins', sans-serif;
  text-transform: uppercase;
}

.contestant-name {
  overflow: hidden;
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contestant-meta {
  overflow: hidden;
  color: #687394;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contestant-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 14px;
  font-size: 13px;
}

.vote-track {
  width: 100%;
  height: 12px;
  margin-top: 5px;
  overflow: hidden;
  border-radius: 999px;
  background: #dfe3ea;
}

.vote-track span {
  display: block;
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f2c88 0%, #0c1d72 100%);
}

@media (max-width: 767px) {
  .mobile-hamburger {
    display: flex;
  }

  .admin-dashboard {
    --sidebar-width: 0px;
    overflow: visible;
  }

  .main-content {
    width: 100%;
    margin-left: 0;
    padding: 72px 16px 30px;
    overflow: visible;
  }

  .dashboard-content {
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .contestant-list {
    padding-right: 12px;
    padding-left: 12px;
  }

  .contestant-line {
    align-items: flex-start;
  }

  .contestant-actions {
    gap: 8px;
    font-size: 12px;
  }
}

@media (max-width: 520px) {
  .page-header {
    min-height: 76px;
    margin-top: 6px;
    padding: 0 16px;
    border-radius: 10px;
    background: linear-gradient(90deg, #0b0d52 0%, #1b39a8 100%);
    box-shadow: inset 0 0 0 1px rgb(134 168 255 / 28%);
    justify-content: center;
    text-align: center;
  }

  .page-header h1 {
    display: block;
    width: 100%;
    transform: none;
    font-size: clamp(1.2rem, 6.5vw, 2.3rem);
    letter-spacing: 0.05em;
    text-align: center;
  }
}
</style>
