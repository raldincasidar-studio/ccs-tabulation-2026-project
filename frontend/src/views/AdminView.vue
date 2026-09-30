<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import api from "@/services/api";
import starImage from "@/assets/img/star.png";

const router = useRouter();
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMobile = ref(false);
const isSystemOn = ref(false);
const statistics = ref({ judges: null, contestants: null, categories: null });
const statisticsErrors = ref({ judges: "", contestants: "", categories: "" });
const liveCategory = ref(null);
const activeContestant = ref(null);
const liveGroups = ref([]);
const isLiveLoading = ref(true);
const liveError = ref("");

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

onMounted(() => {
  updateViewportState();
  loadDashboardData();
  window.addEventListener("resize", updateViewportState);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportState);
});

const quickActions = [
  "Generate Reports",
  "View Live Scores",
  "Generate Reports",
  "View Live Scores",
  "Generate Reports",
];

function responseData(response, description) {
  if (response?.success !== true) throw new Error(`Invalid ${description} response`);
  return response.data;
}

async function loadDashboardData() {
  isLiveLoading.value = true;
  liveError.value = "";

  const [judgesResult, contestantsResult, categoriesResult, configurationResult] =
    await Promise.allSettled([
      api.get("/judges"),
      api.get("/contestants"),
      api.get("/categories"),
      api.get("/configuration"),
    ]);

  for (const [key, result] of [
    ["judges", judgesResult],
    ["contestants", contestantsResult],
    ["categories", categoriesResult],
  ]) {
    if (result.status !== "fulfilled") {
      statisticsErrors.value[key] = result.reason?.message || "Unable to load data";
      continue;
    }

    try {
      const records = responseData(result.value, key);
      if (!Array.isArray(records)) throw new Error(`Invalid ${key} response`);
      statistics.value[key] = records.length;
      statisticsErrors.value[key] = "";
    } catch (error) {
      statisticsErrors.value[key] = error.message;
    }
  }

  let contestantRecords = [];
  if (contestantsResult.status === "fulfilled") {
    try {
      contestantRecords = responseData(contestantsResult.value, "contestants");
      if (!Array.isArray(contestantRecords)) throw new Error("Invalid contestants response");
    } catch (error) {
      liveError.value = error.message;
    }
  } else {
    liveError.value = contestantsResult.reason?.message || "Unable to load contestants";
  }

  if (configurationResult.status === "fulfilled") {
    try {
      const configuration = responseData(configurationResult.value, "configuration");
      liveCategory.value = configuration?.liveStatus?.categoryActive || null;
      activeContestant.value = configuration?.liveStatus?.contestantActive || null;
    } catch (error) {
      liveError.value = liveError.value || error.message;
    }
  } else {
    liveError.value = liveError.value || configurationResult.reason?.message || "Unable to load live status";
  }

  const groupsById = new Map();
  for (const contestant of contestantRecords) {
    const group = contestant.group;
    const groupId = typeof group === "object" ? group?._id : group;
    const groupName = typeof group === "object" ? group?.name : "";
    const groupKey = groupId || groupName;
    if (!groupKey) continue;

    if (!groupsById.has(groupKey)) {
      groupsById.set(groupKey, { id: groupId, name: groupName, contestants: [] });
    }
    groupsById.get(groupKey).contestants.push(contestant);
  }

  const currentContestant = activeContestant.value;
  if (currentContestant?._id && !contestantRecords.some((item) => item._id === currentContestant._id)) {
    const groupKey = currentContestant.group || currentContestant._id;
    if (!groupsById.has(groupKey)) {
      groupsById.set(groupKey, { id: null, name: currentContestant.group, contestants: [] });
    }
    groupsById.get(groupKey).contestants.push(currentContestant);
  }

  const groups = [...groupsById.values()];
  const rankingResults = await Promise.allSettled(
    groups.map((group) =>
      group.id
        ? api.get("/reports/final-rankings", { params: { groupId: group.id } })
        : Promise.reject(new Error("Group ID unavailable for rankings")),
    ),
  );

  liveGroups.value = groups.map((group, index) => {
    let rankings = [];
    let rankingsUnavailable = rankingResults[index].status !== "fulfilled";
    const result = rankingResults[index];
    if (result.status === "fulfilled") {
      try {
        rankings = responseData(result.value, "final rankings")?.rankings;
        if (!Array.isArray(rankings)) throw new Error("Invalid final rankings response");
        rankingsUnavailable = false;
      } catch {
        rankings = [];
        rankingsUnavailable = true;
      }
    }

    const rankingsByContestant = new Map(rankings.map((ranking) => [ranking.contestantId, ranking]));
    const contestantsInGroup = group.contestants.map((contestant) => {
      const isActiveContestant = contestant._id === currentContestant?._id;
      const ranking = rankingsByContestant.get(contestant._id);
      return {
        ...contestant,
        name: isActiveContestant ? currentContestant.name : contestant.name,
        image: isActiveContestant ? currentContestant.image : contestant.image,
        label: isActiveContestant ? currentContestant.label : contestant.label,
        group: isActiveContestant ? currentContestant.group : group.name,
        rank: ranking?.rank,
        score: ranking?.final_candidate_score,
        rankingsUnavailable,
      };
    });

    contestantsInGroup.sort((first, second) => {
      if (first.rank == null) return second.rank == null ? 0 : 1;
      if (second.rank == null) return -1;
      return first.rank - second.rank;
    });
    const activeGroupName = contestantsInGroup.some((contestant) => contestant._id === currentContestant?._id)
      ? currentContestant?.group
      : null;
    return { ...group, name: activeGroupName || group.name, contestants: contestantsInGroup };
  });

  isLiveLoading.value = false;
}

function toggleSystemStatus() {
  isSystemOn.value = !isSystemOn.value;
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}
</script>

<template>
  <div class="admin-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div
      class="admin-dashboard"
      :style="{
        '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '180px',
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

      <main id="dashboard" class="main-content">
        <div class="dashboard-content">
          <header class="page-header">
            <h1>DASHBOARD</h1>
          </header>

          <div class="system-status">
            <span>System is on <strong>configuration mode</strong></span>
            <button
              class="status-toggle"
              :class="{ 'is-on': isSystemOn }"
              type="button"
              :aria-label="isSystemOn ? 'System is on' : 'System is off'"
              :aria-pressed="isSystemOn"
              @click="toggleSystemStatus"
            >
              <span></span>
            </button>
          </div>

          <section class="statistics" aria-label="Dashboard statistics">
            <article class="stat-card">
              <strong :title="statisticsErrors.judges">{{ statistics.judges ?? "—" }}</strong>
              <span>JUDGES</span>
            </article>
            <article class="stat-card">
              <strong :title="statisticsErrors.contestants">{{ statistics.contestants ?? "—" }}</strong>
              <span>CONTESTANTS</span>
            </article>
            <article class="stat-card">
              <strong :title="statisticsErrors.categories">{{ statistics.categories ?? "—" }}</strong>
              <span>CATEGORIES</span>
            </article>
          </section>

          <div class="dashboard-lower">
            <section class="quick-actions" aria-labelledby="quick-actions-title">
              <h2 id="quick-actions-title">QUICK ACTIONS</h2>
              <button
                v-for="(action, index) in quickActions"
                :key="`${action}-${index}`"
                type="button"
              >
                {{ action }}
              </button>
            </section>

            <section class="live-scores" aria-label="Live contestant scores">
              <h2 class="live-heading">
                <span></span>LIVE<span v-if="liveCategory?.name"> · {{ liveCategory.name }}</span>
              </h2>
              <div class="contestant-groups">
                <section
                  v-for="group in liveGroups"
                  :key="group.id || group.name"
                  class="contestant-section"
                  :aria-label="`${group.name} contestants`"
                >
                  <h3>{{ group.name }}</h3>
                  <article
                    v-for="contestant in group.contestants"
                    :key="contestant._id"
                    class="contestant-row"
                  >
                    <div class="contestant-photo" aria-hidden="true">
                      <img
                        v-if="contestant.image"
                        :src="contestant.image"
                        alt=""
                        @error="contestant.image = ''"
                        style="width: 100%; height: 100%; object-fit: cover"
                      />
                      <template v-else>
                        <span></span>
                        <i></i>
                      </template>
                    </div>
                    <div class="contestant-details">
                      <div class="contestant-line">
                        <span>
                          {{ contestant.name }}<template v-if="contestant.label"> · {{ contestant.label }}</template>
                        </span>
                        <strong>
                          <template v-if="contestant.rankingsUnavailable">UNAVAILABLE</template>
                          <template v-else-if="contestant.rank != null">#{{ contestant.rank }} · {{ contestant.score ?? "—" }}</template>
                          <template v-else>—</template>
                        </strong>
                      </div>
                      <div class="vote-track" aria-hidden="true">
                        <span :style="{ width: contestant.score == null ? '0%' : `${Math.max(0, Math.min(100, contestant.score))}%` }"></span>
                      </div>
                    </div>
                  </article>
                </section>
                <section v-if="isLiveLoading" class="contestant-section">
                  <h3>Loading live results...</h3>
                </section>
                <section v-else-if="liveGroups.length === 0" class="contestant-section">
                  <h3>{{ liveError || "No live contestants available" }}</h3>
                </section>
              </div>
            </section>
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
  --sidebar-width: 320px;
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
  min-height: 102px;
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

.system-status {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 13px;
  padding: 0 12px;
  border: 1px solid rgb(116 148 255 / 20%);
  border-radius: 7px;
  background: #10146d;
  color: #e8ebff;
  font-family: "Croparo", sans-serif;
  font-size: 15px;
}

.page-header h1,
.system-status,
.stat-card strong,
.stat-card span,
.sidebar-navigation a,
.sidebar-link,
.sign-out {
  font-family: "Croparo", sans-serif;
}

.system-status strong {
  font-family: "Croparo", sans-serif;
  font-weight: 700;
}

.status-toggle {
  position: relative;
  z-index: 1;
  width: 38px;
  height: 17px;
  flex: 0 0 38px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: #c5c9d0;
  cursor: pointer;
  pointer-events: auto;
}

.status-toggle span {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #151aa0;
  box-shadow: 0 0 5px rgb(25 36 183 / 55%);
  transition: left 0.2s ease, right 0.2s ease;
}

.status-toggle.is-on span {
  left: auto;
  right: 3px;
}

.statistics {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 12px;
}

.stat-card {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 86px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  overflow: hidden;
  padding: 10px 18px;
  border: 1px solid #292e91;
  border-radius: 7px;
  background-color: #080a53;
  background-image: var(--star-image), var(--star-image), linear-gradient(130deg, #101477, #080944);
  background-repeat: no-repeat;
  background-position: 65% 30%, 84% 70%, center;
  background-size: 13px 13px, 10px 10px, auto;
  box-shadow: 0 2px 5px rgb(10 13 77 / 16%);
  color: #e8ebff;
  font-family: "Croparo", sans-serif;
}

.stat-card strong {
  color: #f5f6ff;
  font-family: "Croparo", sans-serif;
  font-size: 34px;
  font-weight: 500;
  line-height: 1;
}

.stat-card span {
  color: #c7cbea;
  font-family: "Croparo", sans-serif;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.dashboard-lower {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(500px, 2fr);
  align-items: start;
  gap: 56px;
  width: 100%;
  margin-top: 31px;
}

.quick-actions {
  width: 100%;
  padding-left: 3px;
}

.quick-actions h2 {
  margin: 0 0 10px;
  color: #58639c;
  font-family: "Croparo", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  text-transform: uppercase;
}

.quick-actions button {
  display: block;
  width: 100%;
  min-height: 42px;
  margin: 0 0 6px;
  padding: 0 11px;
  border: 1px solid #20247f;
  border-radius: 4px;
  background: linear-gradient(105deg, #10146b, #080a4e);
  box-shadow: 0 1px 3px rgb(8 12 65 / 18%);
  color: #f1f2ff;
  cursor: pointer;
  font-family: "Croparo", sans-serif;
  font-size: 15px;
  font-weight: 500;
  text-align: left;
}

.quick-actions button:hover {
  filter: brightness(1.14);
}

.live-scores {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.live-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  color: #5b6597;
  font-family: "Croparo", sans-serif;
  font-size: 18px;
  font-weight: 500;
  line-height: 1;
}

.live-heading span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e32637;
  box-shadow: 0 0 4px rgb(227 38 55 / 28%);
}

.contestant-groups {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.contestant-section h3 {
  margin: 0 0 8px;
  color: #58608b;
  font-family: "Croparo", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 1;
}

.contestant-row {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 58px;
  align-items: center;
  gap: 14px;
  margin: 0 0 8px;
  padding: 8px 6px 8px 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
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

.contestant-details {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  max-width: 100%;
}

.contestant-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  color: #34416b;
  font-family: "Croparo", sans-serif;
  font-size: 15px;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.contestant-line span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: "Croparo", sans-serif;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.contestant-line strong {
  flex: 0 0 auto;
  color: #10245f;
  font-family: "Croparo", sans-serif;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.vote-track {
  width: 100%;
  height: 16px;
  margin-top: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #dfe3ea;
}

.vote-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f2c88 0%, #0c1d72 100%);
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
  box-sizing: border-box;
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

.sidebar.mobile-open {
  transform: translateX(0);
  box-shadow: 0 0 0 1px rgb(89 137 255 / 20%), 0 22px 40px rgb(6 9 34 / 35%);
}

.sidebar-close {
  position: absolute;
  top: 18px;
  right: 16px;
  z-index: 4;
  display: flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(118 163 255 / 42%);
  border-radius: 8px;
  background: rgb(13 19 62 / 70%);
  color: #edf3ff;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.sidebar-close span {
  display: block;
  transform: translateY(-1px);
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
  box-sizing: border-box;
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

@media (max-width: 760px) {
  .main-content {
    margin-left: 0;
    padding: 18px 16px 30px;
  }

  .dashboard-lower {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
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
    padding-top: 72px;
    overflow: visible;
  }

  .dashboard-content {
    max-width: 100%;
  }
}

@media (max-width: 680px) {
  .admin-frame { padding: 5px; }
  .admin-dashboard,
  .main-content { min-height: calc(100vh - 10px); }
}

@media (max-width: 520px) {
  .admin-frame {
    padding: 0;
  }

  .admin-dashboard {
    min-height: 100vh;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(100vw, 360px);
    height: 100vh;
    padding: 0 0 10px;
  }

  .sidebar-brand {
    height: 90px;
    padding-top: 14px;
  }

  .sidebar-brand::after {
    top: 50%;
    right: 18px;
    left: auto;
    width: 52px;
    height: 52px;
    background-size: 48px 48px;
    opacity: 0.9;
    transform: translateY(-50%);
  }

  .sidebar-brand img {
    position: relative;
    top: auto;
    left: auto;
    width: 250px;
    max-width: none;
    height: 120px;
    max-height: 120px;
    margin-right: 18px;
  }

  .sidebar-navigation {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 18px 0;
  }

  .sidebar-navigation .sidebar-link,
  .sidebar .sign-out {
    gap: 10px;
    min-height: 52px;
    padding: 0 12px;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
  }

  .sign-out {
    margin: auto 0 18px;
    font-size: 1.1rem;
  }

  .main-content {
    min-height: 100vh;
    margin-left: 0;
    padding: 10px 8px 24px;
  }

  .dashboard-content {
    width: 100%;
  }

  .page-header {
    display: flex;
    min-height: 66px;
    margin-top: 6px;
    padding: 0 16px;
    border-radius: 10px;
    background: linear-gradient(90deg, #0b0d52 0%, #1b39a8 100%);
    box-shadow: inset 0 0 0 1px rgb(134 168 255 / 28%);
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .page-header h1 {
    display: block;
    width: 100%;
    font-size: clamp(1.4rem, 6vw, 2.2rem);
    letter-spacing: 0.08em;
    text-align: center;
  }

  .system-status {
    width: 100%;
    min-height: 46px;
    padding: 6px 12px;
    font-size: 0.78rem;
  }

  .statistics {
    width: 100%;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    min-height: 72px;
    padding: 10px 14px;
  }

  .stat-card strong {
    font-size: 2.1rem;
  }

  .stat-card span {
    font-size: 0.9rem;
  }

  .dashboard-lower {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin-top: 24px;
  }

  .quick-actions h2 {
    font-size: 1rem;
  }

  .quick-actions button {
    width: 100%;
    min-height: 44px;
    font-size: 0.92rem;
  }

  .live-scores {
    width: 100%;
  }

  .live-heading {
    gap: 5px;
    margin: 0 0 12px;
    font-size: 1rem;
  }

  .contestant-groups {
    gap: 12px;
  }

  .contestant-section h3 {
    margin: 0 0 7px;
    font-size: 0.9rem;
  }

  .contestant-row {
    width: 100%;
    max-width: 100%;
    height: auto;
    min-height: 58px;
    gap: 10px;
    margin: 0 0 10px;
    padding: 0;
  }

  .contestant-photo {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .contestant-details {
    max-width: none;
    width: 100%;
    min-width: 0;
  }

  .contestant-line {
    gap: 8px;
    font-size: 0.8rem;
  }

  .contestant-line span {
    font-size: 0.9rem;
  }

  .contestant-line strong {
    font-size: 0.75rem;
    text-align: right;
  }

  .vote-track {
    width: 100%;
    height: 10px;
    margin-top: 5px;
  }
}
</style>
