<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import Sidebar from "@/components/Sidebar.vue";
import JudgeManagementView from "@/views/JudgeManagementView.vue";
import starImage from "@/assets/img/star.png";
import imgPlaceholder from "@/assets/img/img-placeholder.png";

const route = useRoute();
const router = useRouter();

const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMobile = ref(false);
const isConfigurationMode = ref(true);
const isMenuHidden = ref(false);

// Dynamic Dashboard Data States
const judgesCount = ref(0);
const contestantsCount = ref(0);
const categoriesCount = ref(0);
const displayedGroups = ref([]);
const isLoadingData = ref(false);

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

function handleScrollState() {
  if (!isMobile.value) {
    isMenuHidden.value = false;
    return;
  }

  const scrollTop = window.scrollY || window.pageYOffset;
  isMenuHidden.value = scrollTop > 12;
}

// Fetch all dashboard data adhering to the contract specification
async function fetchDashboardData() {
  isLoadingData.value = true;
  try {
    // 1. Fetch Global Configuration (Counts & Status)
    try {
      const configRes = await api.get("/configuration");
      const configData = configRes.data?.data || configRes.data || {};

      if (configData.stats) {
        judgesCount.value = configData.stats.totalJudges ?? 0;
        contestantsCount.value = configData.stats.totalContestants ?? 0;
      }
      if (typeof configData.isConfigurationMode === "boolean") {
        isConfigurationMode.value = configData.isConfigurationMode;
      }
    } catch (err) {
      console.warn("Failed to fetch configuration:", err.message);
    }

    // 2. Fetch Categories Count
    try {
      const catRes = await api.get("/categories");
      const catData = catRes.data?.data || catRes.data || [];
      categoriesCount.value = Array.isArray(catData) ? catData.length : 0;
    } catch (err) {
      console.warn("Failed to fetch categories:", err.message);
    }

    // 3. Fetch Contestants & Groups
    try {
      const [groupsRes, contestantsRes] = await Promise.allSettled([
        api.get("/contestant-groups"),
        api.get("/contestants"),
      ]);

      const groups =
        groupsRes.status === "fulfilled"
          ? groupsRes.value.data?.data || groupsRes.value.data || []
          : [];

      const allContestants =
        contestantsRes.status === "fulfilled"
          ? contestantsRes.value.data?.data || contestantsRes.value.data || []
          : [];

      // Create lookup map for photos and information
      const contestantMap = new Map();
      allContestants.forEach((c) => {
        if (c._id) contestantMap.set(c._id, c);
        if (c.name) contestantMap.set(c.name.toLowerCase().trim(), c);
      });

      // 4. Fetch ranking sheet per group
      const groupsWithRankings = await Promise.all(
        groups.map(async (group) => {
          let rows = [];
          try {
            // Section 8.3: /reports/paper/final-ranking-sheet?groupId=...
            const reportRes = await api.get("/reports/paper/final-ranking-sheet", {
              params: { groupId: group._id },
            });
            const reportData = reportRes.data?.data || reportRes.data || {};
            rows = reportData.rows || [];
          } catch {
            // Fallback to registered contestants if scores are not yet available (404)
            rows = allContestants
              .filter((c) => (c.group?._id || c.group) === group._id)
              .map((c) => ({
                rank: null,
                nameAndLabel: `${c.label ? c.label + " - " : ""}${c.name}`,
                contestantId: c._id,
                contestantName: c.name,
                image: c.image,
                final_candidate_score: 0,
              }));
          }

          // Format items and match contestant photo with fallback state
          const formattedRankings = rows.map((item) => {
            const rawName = item.nameAndLabel
              ? item.nameAndLabel.split("-").pop().trim()
              : item.name || item.contestantName || "";

            const matchedContestant =
              (item.contestantId && contestantMap.get(item.contestantId)) ||
              contestantMap.get(rawName.toLowerCase()) ||
              {};

            return {
              rank: item.rank || null,
              name: rawName || item.nameAndLabel || "Candidate",
              score: item.final_candidate_score ?? 0,
              image: item.image || matchedContestant.image || "",
              imageFailed: false, // Flag used to toggle fallback avatar on 404
            };
          });

          return {
            id: group._id,
            name: group.name,
            rankings: formattedRankings,
          };
        })
      );

      displayedGroups.value = groupsWithRankings;
    } catch (err) {
      console.warn("Failed to fetch ranking sheet data:", err.message);
    }
  } catch (error) {
    console.error("Dashboard data load error:", error);
  } finally {
    isLoadingData.value = false;
  }
}

onMounted(() => {
  updateViewportState();
  handleScrollState();
  fetchDashboardData();
  window.addEventListener("resize", updateViewportState);
  window.addEventListener("scroll", handleScrollState, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportState);
  window.removeEventListener("scroll", handleScrollState);
});

const quickActions = [
  { label: "Generate Reports", route: "/reports" },
  { label: "View Live Scores", route: "/reports" },
  { label: "Add Contestants", route: "/admin/add-contestant" },
  { label: "Judge Management", route: "/admin/judges" },
  { label: "Event Configuration", route: "/admin/configurations" },
];

function toggleSystemStatus() {
  isConfigurationMode.value = !isConfigurationMode.value;
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
        :class="{ 'is-hidden': isMenuHidden }"
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

          <template v-else>
            <!-- System Status -->
            <div class="system-status">
              <span>
                System is on
                <strong>{{ isConfigurationMode ? "configuration mode" : "live mode" }}</strong>
              </span>
              <button
                class="status-toggle"
                :class="{ 'is-on': !isConfigurationMode }"
                type="button"
                :aria-label="isConfigurationMode ? 'System is in configuration mode' : 'System is live'"
                :aria-pressed="!isConfigurationMode"
                @click="toggleSystemStatus"
              >
                <span></span>
              </button>
            </div>

            <!-- Dynamic Statistics Cards -->
            <section class="statistics" aria-label="Dashboard statistics">
              <article class="stat-card">
                <strong>{{ judgesCount }}</strong>
                <span>JUDGES</span>
              </article>
              <article class="stat-card">
                <strong>{{ contestantsCount }}</strong>
                <span>CONTESTANTS</span>
              </article>
              <article class="stat-card">
                <strong>{{ categoriesCount }}</strong>
                <span>CATEGORIES</span>
              </article>
            </section>

            <div class="dashboard-lower">
              <!-- Quick Actions -->
              <section class="quick-actions" aria-labelledby="quick-actions-title">
                <h2 id="quick-actions-title">QUICK ACTIONS</h2>
                <button
                  v-for="(action, index) in quickActions"
                  :key="`${action.label}-${index}`"
                  type="button"
                  @click="router.push(action.route)"
                >
                  {{ action.label }}
                </button>
              </section>

              <!-- Final Ranking / Live Scores Dynamic List -->
              <section class="live-scores" aria-label="Live contestant scores">
                <h2 class="live-heading"><span></span>FINAL RANKING</h2>

                <div v-if="displayedGroups.length === 0" class="empty-state">
                  <p>{{ isLoadingData ? "Loading rankings..." : "No contestant group data found." }}</p>
                </div>

                <div v-else class="contestant-groups">
                  <section
                    v-for="group in displayedGroups"
                    :key="group.id"
                    class="contestant-section"
                  >
                    <h3>{{ group.name }}</h3>

                    <div v-if="group.rankings.length === 0" class="no-contestants">
                      No candidates listed for this group.
                    </div>

                    <article
                      v-for="(contestant, cIndex) in group.rankings"
                      :key="`${group.id}-${cIndex}`"
                      class="contestant-row"
                    >
                      <!-- Candidate Photo -->
                      <div class="contestant-photo" aria-hidden="true">
                        <img
                          v-if="contestant.image && !contestant.imageFailed"
                          :src="contestant.image"
                          :alt="contestant.name"
                          class="candidate-img"
                          loading="lazy"
                          @error="contestant.imageFailed = true"
                        />
                        <img
                          v-else
                          :src="imgPlaceholder"
                          alt="Contestant placeholder"
                          class="candidate-img placeholder-img"
                        />
                      </div>

                      <div class="contestant-details">
                        <div class="contestant-line">
                          <span>
                            <strong v-if="contestant.rank" class="rank-tag">#{{ contestant.rank }}</strong>
                            {{ contestant.name }}
                          </span>
                          <strong>
                            {{ contestant.score > 0 ? `${contestant.score}%` : "0% Votes" }}
                          </strong>
                        </div>
                        <div class="vote-track" aria-hidden="true">
                          <span
                            class="progress-fill"
                            :style="{ width: `${Math.min(Math.max(contestant.score, 0), 100)}%` }"
                          ></span>
                        </div>
                      </div>
                    </article>
                  </section>
                </div>
              </section>
            </div>
          </template>
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
  width: min(100%, 1040px);
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

.empty-state,
.no-contestants {
  padding: 12px;
  color: #65719e;
  font-family: "Croparo", sans-serif;
  font-size: 14px;
}

.contestant-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contestant-section h3 {
  margin: 0 0 14px;
  color: #58608b;
  font-family: "Croparo", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
}

.contestant-row {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-height: 70px;
  align-items: center;
  gap: 16px;
  margin: 0 0 14px;
  padding: 6px 0;
  border: 0;
  background: transparent;
}

/* Photo Container: Exact Figma 135deg gradient (Dark Blue top-left to Grey bottom-right) */
.contestant-photo {
  position: relative;
  width: 60px;
  height: 60px;
  flex: 0 0 60px;
  overflow: visible; /* Allows crown/head to break out */
  border-radius: 12px;
  background: linear-gradient(135deg, #011e60 0%, #d9d9d9 100%);
  box-shadow: 0 4px 10px rgb(1 30 96 / 25%);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* Uploaded real contestant images */
.candidate-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
  display: block;
}

/* Placeholder Pageant Model: scaled & shifted to match Figma overlap */
/* Placeholder Pageant Model: perfectly centered & scaled */
.candidate-img.placeholder-img {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-75%) scale(2.7);
  transform-origin: bottom center;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: contain;
  object-position: bottom center;
  border-radius: 0;
  pointer-events: none;
}

.contestant-details {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
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
}

.rank-tag {
  color: #10245f;
  margin-right: 6px;
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

.vote-track .progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f2c88 0%, #1737a8 100%);
  transition: width 0.4s ease;
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
  }

  .main-content {
    width: 100%;
    margin-left: 0;
    padding-top: 72px;
  }
}

@media (max-width: 520px) {
  .contestant-photo {
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
  }
}
</style>