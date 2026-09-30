<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import starImage from '@/assets/img/star.png';
import { deleteContestant, getContestants } from '@/services/contestantService';

const router = useRouter();
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMobile = ref(false);
const contestants = ref([]);
const loading = ref(true);
const error = ref('');
const deletingContestantId = ref('');

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

function goToAddContestant() {
  router.push('/admin/add-contestant');
}

function goToEditContestant(contestant) {
  const id = contestant._id || contestant.id;
  if (!id) {
    error.value = 'This contestant cannot be edited because it has no ID.';
    return;
  }

  router.push({ path: '/admin/add-contestant', query: { id } });
}

async function removeContestant(contestant) {
  const id = contestant._id || contestant.id;
  if (!id || !window.confirm(`Delete ${contestant.name}? This cannot be undone.`)) return;

  deletingContestantId.value = id;
  error.value = '';
  try {
    await deleteContestant(id);
    contestants.value = contestants.value.filter((item) => (item._id || item.id) !== id);
  } catch (err) {
    error.value = err?.message || 'Unable to delete contestant.';
  } finally {
    deletingContestantId.value = '';
  }
}

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
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }"
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
        active-item="CONTESTANTS"
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
          <header class="management-banner">
            <h1>CONTESTANT MANAGEMENT</h1>
          </header>

          <div class="contestant-management-list">
            <div class="management-toolbar">
              <button class="management-add" type="button" @click="goToAddContestant">+ Add</button>
            </div>

            <div v-if="loading" class="management-state">
              Loading contestants...
            </div>

            <div v-else-if="error" class="management-state">
              <p class="text-red-600">{{ error }}</p>
              <button
                class="management-retry"
                type="button"
                @click="fetchContestants"
              >
                Retry
              </button>
            </div>

            <div v-else-if="contestants.length === 0" class="management-state">
              No contestants found.
            </div>

            <div v-else class="management-table-scroll">
              <table class="management-table">
                <colgroup>
                  <col class="number-column">
                  <col class="name-column">
                  <col class="label-column">
                  <col class="group-column">
                  <col class="actions-column">
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Label</th>
                    <th scope="col">Group</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(contestant, index) in contestants"
                    :key="contestant._id || contestant.id || index"
                  >
                    <td class="row-number"><span>{{ index + 1 }}</span></td>
                    <td>{{ contestant.name }}</td>
                    <td>{{ contestant.label }}</td>
                    <td>{{ getGroupName(contestant.group) }}</td>
                    <td class="row-actions">
                      <button type="button" @click="goToEditContestant(contestant)">Edit</button>
                      <button
                        class="delete-action"
                        type="button"
                        :disabled="deletingContestantId === (contestant._id || contestant.id)"
                        @click="removeContestant(contestant)"
                      >
                        {{ deletingContestantId === (contestant._id || contestant.id) ? 'Deleting...' : 'Delete' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
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
  width: 100%;
  max-width: 1040px;
  margin: 0 auto;
  box-sizing: border-box;
}

.management-banner {
  position: relative;
  display: flex;
  width: min(100%, 965px);
  height: clamp(120px, 13vw, 170px);
  align-items: flex-start;
  overflow: hidden;
  padding: clamp(18px, 2vw, 27px) clamp(18px, 2vw, 24px);
  border-radius: 17px;
  background-color: #09065d;
  background-image:
    var(--star-image), var(--star-image), var(--star-image), var(--star-image),
    linear-gradient(110deg, #09065d 0%, #111075 54%, #1710b5 100%);
  background-repeat: no-repeat;
  background-position: 39% 23%, 35% 66%, 72% 71%, 91% 43%, center;
  background-size: 17px 17px, 12px 12px, 12px 12px, 10px 10px, auto;
  box-sizing: border-box;
}

.management-banner::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(32deg, transparent 31%, rgb(161 184 255 / 35%) 31.1%, transparent 31.25%),
    linear-gradient(122deg, transparent 82%, rgb(161 184 255 / 30%) 82.1%, transparent 82.25%);
  content: '';
  pointer-events: none;
}

.management-banner h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #dedfff;
  font-family: 'Croparo', sans-serif;
  font-size: clamp(2rem, 3vw, 3.1rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  -webkit-text-stroke: 0.35px #fff;
  text-shadow: 0 0 5px rgb(200 203 255 / 35%);
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

.contestant-management-list {
  width: min(100%, 965px);
  margin: 16px 0 0;
}

.management-toolbar {
  display: flex;
  min-height: 30px;
  justify-content: flex-end;
  align-items: flex-start;
  margin-top: 12px;
}

.management-add {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 1px solid #062f9b;
  border-radius: 4px;
  background: #073dd0;
  box-shadow: 0 1px 3px rgb(8 12 65 / 20%);
  color: #fff;
  cursor: pointer;
  font-family: 'Poppins', sans-serif;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  transform: translateY(-1px);
}

.management-add:hover {
  background: #062f9b;
}

.management-state {
  padding: 24px 12px;
  color: #687394;
  text-align: center;
}

.management-retry {
  margin-top: 12px;
  padding: 7px 12px;
  border: 0;
  border-radius: 4px;
  background: #10146d;
  color: #fff;
  cursor: pointer;
}

.management-table-scroll {
  width: 100%;
  overflow-x: auto;
}

.management-table {
  width: 100%;
  min-width: 640px;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0 4px;
  color: #fff;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
}

.management-table .number-column { width: 7%; }
.management-table .name-column { width: 30%; }
.management-table .label-column { width: 25%; }
.management-table .group-column { width: 23%; }
.management-table .actions-column { width: 15%; }

.management-table thead tr {
  background: linear-gradient(105deg, #eff000 0%, #b2c51b 34%, #3a9b9a 62%, #063cd2 100%);
}

.management-table th {
  height: 50px;
  padding: 0 10px;
  background: transparent;
  color: #000000;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

.management-table th:nth-child(2),
.management-table th:nth-child(3),
.management-table th:nth-child(4) {
  text-align: left;
}

.management-table th:first-child {
  border-radius: 4px 0 0 4px;
}

.management-table th:last-child {
  border-radius: 0 4px 4px 0;
}

.management-table td {
  height: 50px;
  overflow: hidden;
  padding: 0 10px;
  background: #0841c5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.management-table td:first-child {
  border-radius: 4px 0 0 4px;
}

.management-table td:last-child {
  border-radius: 0 4px 4px 0;
}

.management-table td.row-number {
  padding: 0 4px 0 0;
  background: transparent;
  color: #eff000;
  text-align: center;
}

.row-number span {
  display: flex;
  width: 100%;
  height: 50px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: linear-gradient(90deg, #001c5b 0%, #063ba7 100%);
}

.management-table td:nth-child(2) {
  border-radius: 4px 0 0 4px;
}

.management-table .row-actions {
  text-align: center;
}

.row-actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
}

.row-actions button:hover,
.row-actions button:focus-visible {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.row-actions button + button {
  margin-left: 12px;
}

.row-actions .delete-action {
  color: #ff0019;
}

@media (max-width: 1100px) {
  .main-content {
    padding-right: 24px;
    padding-left: 24px;
  }

  .dashboard-content,
  .management-banner {
    width: 100%;
  }
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
    padding: 78px 18px 36px;
    overflow: visible;
  }

  .dashboard-content {
    max-width: 100%;
  }

  .management-banner {
    height: auto;
    min-height: 132px;
    align-items: center;
    padding: 20px 18px;
    border-radius: 14px;
  }

  .management-banner h1 {
    font-size: clamp(1.8rem, 7vw, 3.2rem);
    line-height: 1.05;
    letter-spacing: 0.04em;
  }
}

@media (max-width: 640px) {
  .management-table {
    font-size: 14px;
  }

  .management-table th {
    font-size: 16px;
  }

  .management-table th,
  .management-table td {
    padding-right: 8px;
    padding-left: 8px;
  }

  .row-actions button + button {
    margin-left: 8px;
  }
}

</style>
