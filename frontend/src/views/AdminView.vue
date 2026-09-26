<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import dashboardImage from '@/assets/logo/dashboard.png';
import starImage from '@/assets/img/star.png';
import oneStarImage from '@/assets/img/one star.png';
import { BarChart3, BriefcaseBusiness, LayoutGrid, LogOut, Settings2, Users } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMobile = ref(false);

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
  window.addEventListener('resize', updateViewportState);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportState);
});

const navigation = [
  { label: 'DASHBOARD', icon: LayoutGrid },
  { label: 'CONFIGURATIONS', icon: Settings2 },
  { label: 'MANAGEMENT', icon: BriefcaseBusiness },
  { label: 'CONTESTANTS', icon: Users },
  { label: 'REPORTS', icon: BarChart3 },
];

const quickActions = [
  'Generate Reports',
  'View Live Scores',
  'Generate Reports',
  'View Live Scores',
  'Generate Reports',
];

const contestants = [
  'Japhet Bastillada',
  'Leonesa Salmorin',
  'Papap dol',
  'Papap dol',
];

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

      <aside class="sidebar" :class="{ collapsed: isSidebarCollapsed && !isMobile, 'mobile-open': isMobileSidebarOpen && isMobile }">
        <button
          v-if="!isMobile"
          class="sidebar-toggle"
          type="button"
          :aria-label="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          :aria-expanded="!isSidebarCollapsed"
          :title="isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          @click="isSidebarCollapsed = !isSidebarCollapsed"
        >
          <span class="toggle-bar"></span>
          <span class="toggle-bar"></span>
          <span class="toggle-bar"></span>
        </button>

        <button
          v-if="isMobile && isMobileSidebarOpen"
          class="sidebar-close"
          type="button"
          aria-label="Close navigation menu"
          @click="isMobileSidebarOpen = false"
        >
          <span>×</span>
        </button>

        <div
          class="sidebar-brand"
          :style="{ '--brand-star-image': `url(${oneStarImage})` }"
          aria-label="Mrs and Mr Computing Studies 2026"
        >
          <img :src="dashboardImage" alt="Computing Studios 2026" />
        </div>

        <nav class="sidebar-navigation" aria-label="Main navigation">
          <a
            v-for="(item, index) in navigation"
            :key="item.label"
            :class="['sidebar-link', { active: index === 0 }]"
            href="#dashboard"
            :aria-current="index === 0 ? 'page' : undefined"
          >
            <component :is="item.icon" class="sidebar-icon" :size="18" />
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <button class="sign-out" type="button" @click="handleLogout">
          <span>SIGN OUT</span>
          <LogOut class="sign-out-icon" :size="14" />
        </button>
        <div class="sidebar-constellation" aria-hidden="true">
          <i class="constellation-line line-one"></i>
          <i class="constellation-line line-two"></i>
          <i class="constellation-line line-three"></i>
          <i class="constellation-line line-four"></i>
          <i class="constellation-line line-five"></i>
          <span class="constellation-star star-one"></span>
          <span class="constellation-star star-two"></span>
          <span class="constellation-star star-three"></span>
          <span class="constellation-star star-four"></span>
          <span class="constellation-star star-five"></span>
          <span class="constellation-star star-six"></span>
        </div>
      </aside>

      <main id="dashboard" class="main-content">
        <div class="dashboard-content">
          <header class="page-header">
            <h1>DASHBOARD</h1>
          </header>

          <div class="system-status">
            <span>System is on <strong>configuration mode</strong></span>
            <button class="status-toggle" type="button" aria-label="System is on" aria-pressed="true">
              <span></span>
            </button>
          </div>

          <section class="statistics" aria-label="Dashboard statistics">
            <article class="stat-card">
              <strong>5</strong>
              <span>JUDGES</span>
            </article>
            <article class="stat-card">
              <strong>5</strong>
              <span>CONTESTANTS</span>
            </article>
            <article class="stat-card">
              <strong>2</strong>
              <span>COMPETITION</span>
            </article>
          </section>

          <div class="dashboard-lower">
            <section class="quick-actions" aria-labelledby="quick-actions-title">
              <h2 id="quick-actions-title">QUICK ACTIONS</h2>
              <button v-for="(action, index) in quickActions" :key="`${action}-${index}`" type="button">
                {{ action }}
              </button>
            </section>

            <section class="live-scores" aria-label="Live contestant scores">
              <h2 class="live-heading"><span></span>LIVE</h2>
              <div class="contestant-groups">
                <section
                  v-for="group in ['Mrs.', 'Mr.']"
                  :key="group"
                  class="contestant-section"
                  :aria-label="`${group} contestants`"
                >
                  <h3>{{ group }}</h3>
                  <article v-for="(name, index) in contestants" :key="`${group}-${index}`" class="contestant-row">
                    <div class="contestant-photo" aria-hidden="true">
                      <span></span>
                      <i></i>
                    </div>
                    <div class="contestant-details">
                      <div class="contestant-line">
                        <span>{{ name }}</span>
                        <strong>0% Votes</strong>
                      </div>
                      <div class="vote-track" aria-hidden="true">
                        <span :class="`progress-fill-${index + 1}`"></span>
                      </div>
                    </div>
                  </article>
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
.admin-dashboard {
  --ink: #10133d;
  --navy: #090b52;
  --blue: #1115a2;
  --accent: #36a9e8;
  --muted: #777da0;
  min-height: 100vh;
  background: #f4f6f7;
  color: var(--ink);
  font-family: 'Poppins', sans-serif;
}


.sidebar-toggle {
  position: absolute;
  top: 18px;
  left: 12px;
  z-index: 8;
  display: flex;
  width: 30px;
  height: 30px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0;
  border: 1px solid rgba(120, 171, 255, 0.5);
  border-radius: 9px;
  background: rgba(10, 17, 58, 0.92);
  box-shadow: 0 0 0 1px rgba(96, 143, 255, 0.18), 0 8px 18px rgba(11, 18, 72, 0.26);
  color: #edf3ff;
  cursor: pointer;
  transition: all 0.25s ease;
}

.sidebar-toggle:hover {
  border-color: rgba(166, 201, 255, 0.8);
  box-shadow: 0 0 0 1px rgba(132, 186, 255, 0.24), 0 10px 20px rgba(25, 39, 118, 0.3);
  transform: translateY(-1px);
}

.toggle-bar {
  display: block;
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: #edf3ff;
  box-shadow: 0 0 6px rgb(151 197 255 / 45%);
}

.sidebar.collapsed .sidebar-toggle {
  left: 15px;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 2;
  display: flex;
  width: 180px;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border-top: 1px solid rgb(56 190 255 / 64%);
  border-bottom: 1px solid rgb(56 190 255 / 78%);
  background:
    radial-gradient(ellipse at 78% 73%, rgb(24 73 181 / 20%), transparent 40%),
    radial-gradient(ellipse at 18% 91%, rgb(21 74 181 / 24%), transparent 40%),
    linear-gradient(180deg, #050817 0%, #080d2b 49%, #0b1c52 100%);
  color: #fff;
  transition: width 0.25s ease;
}

.sidebar.collapsed {
  width: 60px;
  overflow: visible;
}

.sidebar.collapsed .sidebar-brand {
  flex: 0 0 auto;
  height: 94px;
  margin-top: 52px;
  padding: 0 2px;
  transition: height 0.25s ease, margin-top 0.25s ease, padding 0.25s ease;
}

.sidebar.collapsed .sidebar-brand::after {
  display: none;
}

.sidebar.collapsed .sidebar-brand img {
  width: 76px;
  max-width: 76px;
  max-height: 90px;
  height: auto;
  filter: drop-shadow(0 0 10px rgb(122 197 255 / 65%)) brightness(1.12);
  transition: width 0.25s ease, max-width 0.25s ease, max-height 0.25s ease, filter 0.25s ease;
}

.sidebar.collapsed .sidebar-navigation {
  align-items: center;
  margin-top: 10px;
  padding-top: 0;
}

.sidebar.collapsed .sidebar-link,
.sidebar.collapsed .sign-out {
  justify-content: center;
  padding-inline: 0;
}

.sidebar.collapsed .sidebar-link span,
.sidebar.collapsed .sign-out span {
  display: none;
}

.sidebar.collapsed .sign-out {
  margin-bottom: 16px;
}

.sidebar.collapsed .sidebar-link,
.sidebar.collapsed .sign-out {
  gap: 0;
}

.sidebar.collapsed .sign-out-icon {
  width: 14px;
  height: 14px;
}

.sidebar::before,
.sidebar::after {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(76 196 255 / 25%), transparent);
  content: '';
  pointer-events: none;
}

.sidebar::before {
  top: 0;
}

.sidebar::after {
  bottom: 0;
}

.sidebar-brand {
  position: relative;
  z-index: 1;
  display: flex;
  height: 120px;
  flex: 0 0 120px;
  align-items: center;
  justify-content: center;
  padding: 10px 8px 0;
  transition: height 0.25s ease, padding 0.25s ease, margin-top 0.25s ease;
}

.sidebar-brand img {
  display: block;
  width: 100%;
  max-width: 124px;
  max-height: 96px;
  object-fit: contain;
  filter: drop-shadow(0 0 8px rgb(122 197 255 / 40%));
  transition: width 0.25s ease, max-width 0.25s ease, max-height 0.25s ease, filter 0.25s ease;
}

.sidebar-navigation {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 18px;
}

.sidebar-link,
.sign-out {
  display: flex;
  width: 100%;
  min-height: 37px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 5px;
  color: #d5dcff;
  font-family: 'Croparo', sans-serif;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 1px;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
}

.sidebar-link.active {
  min-height: 39px;
  background: linear-gradient(90deg, #111a65, #151f77 50%, #111a65);
  color: #fff;
  text-shadow: 0 0 7px rgb(139 181 255 / 30%);
}

.sidebar-link:not(.active):hover {
  color: #fff;
}

.sign-out {
  margin-top: auto;
  margin-bottom: 22px;
  border: 0;
  background: transparent;
  color: #d9b9df;
  cursor: pointer;
  text-shadow: 0 0 8px rgb(214 168 235 / 20%);
}

.sign-out:hover {
  color: #f0d7f5;
}

.sidebar-constellation {
  position: absolute;
  right: 16px;
  bottom: 76px;
  left: 16px;
  height: 184px;
  opacity: 0.58;
  pointer-events: none;
}

.sidebar-constellation::before {
  position: absolute;
  inset: 25% 2% 8%;
  background: radial-gradient(ellipse, rgb(49 116 255 / 12%), transparent 68%);
  content: '';
}

.constellation-line {
  position: absolute;
  z-index: 1;
  height: 1px;
  transform-origin: left center;
  background: linear-gradient(90deg, rgb(112 183 255 / 6%), rgb(156 200 255 / 52%), rgb(112 183 255 / 8%));
}

.line-one { top: 34%; left: 16%; width: 44px; transform: rotate(-29deg); }
.line-two { top: 13%; left: 54%; width: 36px; transform: rotate(54deg); }
.line-three { top: 42%; left: 69%; width: 37px; transform: rotate(31deg); }
.line-four { top: 60%; left: 27%; width: 44px; transform: rotate(11deg); }
.line-five { top: 65%; left: 63%; width: 28px; transform: rotate(-48deg); }

.constellation-star {
  position: absolute;
  z-index: 2;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #d6eaff;
  box-shadow: 0 0 5px 1px rgb(102 174 255 / 80%);
}

.constellation-star::after {
  position: absolute;
  inset: -2px 1px;
  background: rgb(215 236 255 / 68%);
  content: '';
  transform: scaleX(0.35);
}

.star-one { top: 33%; left: 15%; }
.star-two { top: 12%; left: 53%; width: 4px; height: 4px; }
.star-three { top: 41%; left: 68%; }
.star-four { top: 61%; left: 27%; width: 4px; height: 4px; }
.star-five { top: 65%; left: 62%; }
.star-six { top: 79%; left: 42%; width: 2px; height: 2px; }

.main-content {
  min-height: 100vh;
  margin-left: var(--sidebar-width, 180px);
  padding: 24px clamp(24px, 4vw, 58px) 42px;
  transition: margin-left 0.25s ease;
}

.page-header {
  display: flex;
  min-height: 88px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 24px;
  border-radius: 9px;
  background: linear-gradient(105deg, #080a4b, #1116a8 68%, #080a4b);
  box-shadow: 0 5px 14px rgb(11 16 88 / 14%);
  color: #fff;
}

.page-header h1 {
  margin: 0;
  font-size: clamp(21px, 2.6vw, 31px);
  font-weight: 600;
}

.header-status {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.system-pill,
.mode-pill {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 8px;
  padding: 0 11px;
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: 20px;
  background: rgb(255 255 255 / 10%);
  color: #f4f5ff;
  font-size: 10px;
  white-space: nowrap;
}

.system-pill .status-dot {
  width: 7px;
  height: 7px;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.stat-card {
  display: flex;
  min-height: 82px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 17px 20px;
  border: 1px solid #e2e5ed;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 3px 10px rgb(16 19 61 / 5%);
}

.stat-card span {
  color: #727895;
  font-size: 12px;
  font-weight: 500;
}

.stat-card strong {
  color: var(--navy);
  font-size: 28px;
  font-weight: 600;
}

.dashboard-lower {
  display: grid;
  grid-template-columns: minmax(180px, 0.72fr) minmax(320px, 1.55fr);
  align-items: start;
  gap: clamp(22px, 4vw, 48px);
  margin-top: 28px;
}

.quick-actions h2,
.contestant-section h2 {
  margin: 0 0 12px;
  color: #626a91;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.quick-actions button {
  display: flex;
  width: 100%;
  min-height: 39px;
  align-items: center;
  gap: 9px;
  margin-bottom: 7px;
  padding: 0 12px;
  border: 1px solid #1c218f;
  border-radius: 5px;
  background: linear-gradient(100deg, #10146c, #090a4d);
  box-shadow: 0 2px 4px rgb(10 13 77 / 13%);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 10px;
  text-align: left;
  transition: transform 140ms ease, filter 140ms ease;
}

.quick-actions button:hover {
  filter: brightness(1.18);
  transform: translateY(-1px);
}

.quick-actions button svg {
  flex: 0 0 auto;
  color: #b8c8ff;
}

.contestant-groups {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.contestant-section h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
  color: #242c68;
  text-transform: none;
}

.contestant-section:first-child h2::before {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #e74655;
  content: '';
}

.contestant-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  padding: 4px 9px;
  border: 1px solid #e7e9ef;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(16 19 61 / 4%);
}

.contestant-avatar {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid #d9dff4;
  border-radius: 7px;
  background: linear-gradient(145deg, #e9edff, #c9d5ff);
  color: #11166a;
  font-size: 13px;
  font-weight: 700;
}

.contestant-details {
  min-width: 0;
  flex: 1;
}

.contestant-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  color: #394064;
  font-size: 9px;
}

.contestant-line span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contestant-line strong {
  flex: 0 0 auto;
  color: #15266b;
  font-size: 9px;
  font-weight: 600;
}

.vote-track {
  height: 7px;
  margin-top: 4px;
  overflow: hidden;
  border-radius: 5px;
  background: #e3e5e9;
}

.vote-track span {
  display: block;
  width: 0;
  height: 100%;
  border-radius: inherit;
  background: #102573;
}

@media (max-width: 760px) {
  .main-content {
    margin-left: 0;
    padding: 18px 16px 30px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
    padding: 16px;
  }

  .header-status {
    justify-content: flex-start;
  }

  .dashboard-lower {
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }
}

@media (max-width: 767px) {
  .sidebar-toggle,
  .sidebar.collapsed {
    display: none;
  }

  .mobile-hamburger {
    position: fixed;
    top: 18px;
    left: 16px;
    z-index: 30;
    display: flex;
    width: 46px;
    height: 46px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 0;
    border: 1px solid rgb(97 142 255 / 45%);
    border-radius: 10px;
    background: rgba(8, 13, 49, 0.9);
    box-shadow: 0 6px 18px rgba(14, 18, 74, 0.3);
    box-sizing: border-box;
    cursor: pointer;
    outline: none;
  }

  .admin-dashboard {
    --sidebar-width: 0px;
  }

  .mobile-hamburger span {
    display: block;
    width: 20px;
    height: 2px;
    border-radius: 999px;
    background: #edf3ff;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 6%);
  }

  .mobile-sidebar-overlay {
    position: fixed;
    inset: 0;
    z-index: 12;
    background: rgba(0, 0, 0, 0.42);
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 20;
    width: min(85vw, 300px);
    transform: translateX(-105%);
    transition: transform 0.25s ease;
  }

  .sidebar.mobile-open {
    transform: translateX(0);
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
    background: rgba(13, 19, 62, 0.7);
    color: #edf3ff;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
  }

  .sidebar-close span {
    display: block;
    transform: translateY(-1px);
  }

  .main-content {
    margin-left: 0;
    padding-top: 72px;
  }
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

  .sidebar-brand img {
    position: static;
    top: auto;
    left: auto;
    width: 250px;
    max-width: none;
    height: 120px;
    max-height: 120px;
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
    gap: 4px;
    padding: 0 8px;
    font-size: clamp(0.78rem, 3.5vw, 1.1rem);
    letter-spacing: 0.06em;
  }

  .sign-out {
    margin: auto 0 18px;
    font-size: clamp(0.8rem, 3.2vw, 1.05rem);
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
    min-height: 70px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .system-status {
    width: 100%;
    font-size: 8px;
  }

  .statistics {
    width: 100%;
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .stat-card {
    min-height: 62px;
    padding: 6px;
  }

  .stat-card strong {
    font-size: 20px;
  }

  .stat-card span {
    font-size: 6px;
  }

  .dashboard-lower {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin-top: 24px;
  }

  .quick-actions button {
    width: 150px;
  }

  .live-scores {
    width: 100%;
  }
}

.admin-frame {
  min-height: 100vh;
  padding: 0;
  background: #f3f5f4;
}

.admin-dashboard {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: #f3f5f4;
  color: #101747;
}

.sidebar {
  position: absolute;
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 2;
  width: 180px;
  height: 100vh;
  padding: 0;
  background-color: #080a47;
  background-image:
    linear-gradient(35deg, transparent 31%, rgb(117 155 255 / 25%) 31.2%, transparent 31.6%),
    linear-gradient(145deg, transparent 61%, rgb(117 155 255 / 22%) 61.2%, transparent 61.6%),
    linear-gradient(180deg, #080a47 0%, #10147e 53%, #080a47 100%);
  background-repeat: no-repeat;
  background-position: center, center, center;
  background-size: auto, auto, auto;
  border-top: 1px solid rgb(56 190 255 / 64%);
  border-right: 0;
  border-bottom: 2px solid #36d7ff;
  transition: width 0.25s ease;
}

.sidebar.collapsed {
  width: 60px;
  overflow: visible;
}

.sidebar.collapsed .sidebar-brand {
  height: 96px;
  flex: 0 0 auto;
  margin-top: 52px;
  padding: 0 2px;
  transition: height 0.25s ease, margin-top 0.25s ease, padding 0.25s ease;
}

.sidebar.collapsed .sidebar-brand::after {
  display: none;
}

.sidebar.collapsed .sidebar-brand img {
  width: 76px;
  max-width: 76px;
  max-height: 90px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgb(122 197 255 / 65%)) brightness(1.12);
  transition: width 0.25s ease, max-width 0.25s ease, max-height 0.25s ease, filter 0.25s ease;
}

.sidebar.collapsed .sidebar-navigation {
  margin-top: 10px;
}

.sidebar.mobile-open {
  transform: translateX(0);
}

.sidebar-brand {
  position: relative;
  display: flex;
  height: 115px;
  flex: 0 0 115px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 6px 2px;
  color: #fff;
  font-family: 'Croparo', sans-serif;
  font-size: 9px;
  line-height: 1.1;
  text-align: center;
  transition: height 0.25s ease, padding 0.25s ease, margin-top 0.25s ease;
}

.sidebar-brand::after {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 1;
  width: 70px;
  height: 90px;
  transform: translateY(-50%);
  background: var(--brand-star-image) center / 90px 90px no-repeat;
  content: '';
  pointer-events: none;
}

.sidebar-brand img {
  display: block;
  position: relative;
  z-index: 2;
  width: 320px;
  max-width: none;
  height: 160px;
  max-height: 160px;
  object-fit: contain;
}

.sidebar-brand .brand-year {
  margin-bottom: 4px;
  color: #cbd3ff;
  font-family: 'Poppins', sans-serif;
  font-size: 6px;
  line-height: 1.15;
}

.sidebar-brand strong {
  font-size: 9px;
  font-weight: 400;
}

.sidebar-navigation {
  gap: 0;
  padding-top: 0;
  border-top: 1px solid rgb(255 255 255 / 15%);
}

.sidebar-navigation a,
.sidebar-link,
.sign-out {
  display: flex;
  width: 100%;
  min-height: 34px;
  align-items: center;
  gap: 7px;
  padding: 0 4px;
  color: #b9c0e1;
  font-family: 'Croparo', sans-serif;
  font-size: 11px;
  line-height: 1.2;
  text-decoration: none;
  white-space: nowrap;
}

.sidebar-link svg,
.sign-out svg {
  width: 13px;
  height: 13px;
  flex: 0 0 13px;
}

.sidebar-link span {
  width: auto;
  height: auto;
  flex: 0 1 auto;
  line-height: inherit;
}

.sidebar-link.active {
  min-height: 35px;
  color: #f5f6ff;
  background: #11156d;
}

.sidebar-link:hover,
.sign-out:hover {
  background: rgb(255 255 255 / 10%);
}

.sign-out {
  width: 100%;
  min-height: 24px;
  margin: auto 0 19px;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  justify-content: center;
  text-align: center;
}

.sign-out:hover {
  color: #f87171;
}

.main-content {
  margin-left: var(--sidebar-width, 180px);
  min-height: calc(100vh - 24px);
  padding: 16px 28px 52px 7%;
  transition: margin-left 0.25s ease;
}

.dashboard-content {
  width: min(94%, 1050px);
}

.page-header {
  position: relative;
  display: flex;
  min-height: 102px;
  align-items: center;
  overflow: hidden;
  padding: 0 20px;
  border: 1px solid rgb(116 148 255 / 22%);
  border-radius: 10px;
  background-color: #080a51;
  background-image:
    var(--star-image),
    var(--star-image),
    var(--star-image),
    var(--star-image),
    linear-gradient(110deg, #080a47, #1317a5 54%, #080a47);
  background-repeat: no-repeat;
  background-position: 39% 24%, 58% 76%, 76% 30%, 93% 67%, center;
  background-size: 17px 17px, 12px 12px, 15px 15px, 10px 10px, auto;
  box-shadow: 0 3px 10px rgb(8 12 65 / 12%);
  color: #fff;
}

.page-header::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(115deg, transparent 47%, rgb(117 155 255 / 30%) 47.15%, transparent 47.4%),
    linear-gradient(22deg, transparent 37%, rgb(117 155 255 / 24%) 37.15%, transparent 37.4%),
    linear-gradient(155deg, transparent 74%, rgb(117 155 255 / 20%) 74.15%, transparent 74.4%);
  content: '';
  pointer-events: none;
}

.page-header h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #e4eaff;
  font-family: 'Croparo', sans-serif;
  font-size: 40px;
  font-weight: 400;
  line-height: 1;
  text-shadow: 0 0 7px rgb(142 171 255 / 40%);
}

.system-status {
  display: flex;
  width: 96%;
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
  font-size: 12px;
}

.system-status strong {
  font-weight: 700;
}

.status-toggle {
  position: relative;
  width: 38px;
  height: 17px;
  flex: 0 0 38px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: #c5c9d0;
  cursor: default;
}

.status-toggle span {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #151aa0;
  box-shadow: 0 0 5px rgb(25 36 183 / 55%);
}

.statistics {
  display: grid;
  width: 96%;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
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
  background-image:
    var(--star-image),
    var(--star-image),
    linear-gradient(130deg, #101477, #080944);
  background-repeat: no-repeat;
  background-position: 65% 30%, 84% 70%, center;
  background-size: 13px 13px, 10px 10px, auto;
  box-shadow: 0 2px 5px rgb(10 13 77 / 16%);
  color: #e8ebff;
}

.stat-card strong {
  color: #f5f6ff;
  font-family: 'Croparo', sans-serif;
  font-size: 32px;
  font-weight: 400;
  line-height: 1;
}

.stat-card span {
  color: #c7cbea;
  font-family: 'Croparo', sans-serif;
  font-size: 10px;
  font-weight: 400;
}

.dashboard-lower {
  display: grid;
  width: min(100%, 760px);
  grid-template-columns: clamp(150px, 19vw, 190px) 280px;
  align-items: start;
  gap: clamp(90px, 12vw, 110px);
  margin-top: 31px;
}

.quick-actions h2 {
  margin: 0 0 10px;
  color: #58639c;
  font-family: 'Croparo', sans-serif;
  font-size: 10px;
  font-weight: 400;
  line-height: 1.2;
  text-transform: uppercase;
}

.quick-actions {
  padding-left: 3px;
}

.quick-actions button {
  display: block;
  width: calc(clamp(105px, 19vw, 150px) - 1px);
  min-height: 26px;
  margin: 0 0 6px;
  padding: 0 11px;
  border: 1px solid #20247f;
  border-radius: 4px;
  background: linear-gradient(105deg, #10146b, #080a4e);
  box-shadow: 0 1px 3px rgb(8 12 65 / 18%);
  color: #f1f2ff;
  cursor: pointer;
  font: inherit;
  font-size: 9px;
  text-align: left;
}

.quick-actions button:hover {
  filter: brightness(1.14);
}

.live-scores {
  width: 228px;
  max-width: 100%;
  min-width: 0;
}

.live-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 13px;
  color: #5b6597;
  font-family: 'Croparo', sans-serif;
  font-size: 10px;
  font-weight: 400;
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
  gap: 23px;
}

.contestant-section h3 {
  margin: 0 0 5px;
  color: #58608b;
  font-family: 'Croparo', sans-serif;
  font-size: 8px;
  font-weight: 400;
  line-height: 1;
}

.contestant-row {
  display: flex;
  min-height: 33px;
  align-items: center;
  gap: 8px;
  margin: 0 0 3px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.contestant-photo {
  position: relative;
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  overflow: hidden;
  border: 1px solid #bec6da;
  border-radius: 6px;
  background: linear-gradient(145deg, #a9c4ee 0 44%, #d85f5b 45% 70%, #d2a742 71% 100%);
  box-shadow: 0 1px 2px rgb(16 19 61 / 18%);
}

.contestant-photo span {
  position: absolute;
  top: 5px;
  left: 12px;
  width: 9px;
  height: 11px;
  border-radius: 48% 48% 44% 44%;
  background: #d6a07c;
  box-shadow: 0 -3px 0 -1px #30231f;
}

.contestant-photo i {
  position: absolute;
  bottom: -5px;
  left: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50% 50% 0 0;
  background: #bb2935;
}

.contestant-details {
  min-width: 0;
  flex: 1;
}

.contestant-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #34416b;
  font-size: 8px;
  line-height: 1.2;
}

.contestant-line span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contestant-line strong {
  flex: 0 0 auto;
  color: #10245f;
  font-size: 8px;
  font-weight: 700;
  white-space: nowrap;
}

.vote-track {
  height: 7px;
  margin-top: 4px;
  overflow: hidden;
  border-radius: 5px;
  background: #d8dadd;
}

.vote-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #0b246c;
}

.progress-fill-1 {
  width: 30%;
}

.progress-fill-2 {
  width: 66%;
}

.progress-fill-3,
.progress-fill-4 {
  width: 92%;
}

@media (max-width: 680px) {
  .admin-frame {
    padding: 5px;
  }

  .admin-dashboard,
  .main-content {
    min-height: calc(100vh - 10px);
  }
}

@media (max-width: 480px) {
  .page-header {
    min-height: 70px;
  }

  .page-header h1 {
    font-size: 22px;
  }

  .system-status {
    width: 100%;
    font-size: 8px;
  }

  .statistics {
    width: 100%;
    gap: 7px;
  }

  .stat-card {
    min-height: 62px;
    padding: 6px;
  }

  .stat-card strong {
    font-size: 20px;
  }

  .stat-card span {
    font-size: 6px;
  }

  .dashboard-lower {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin-top: 24px;
  }

  .quick-actions button {
    width: 150px;
  }

  .live-scores {
    width: 100%;
  }
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
    width: 180px;
    height: 100vh;
    padding: 0 0 10px;
  }

  .sidebar-brand img {
    position: static;
    top: auto;
    left: auto;
    width: 320px;
    max-width: none;
    height: 160px;
    max-height: 160px;
  }

  .sidebar-navigation .sidebar-link,
  .sidebar .sign-out {
    gap: 4px;
    padding: 0 4px;
    font-size: 8px;
  }

  .main-content {
    min-height: 100vh;
    margin-left: 0;
    padding: 10px 8px 24px;
  }

  .dashboard-content {
    width: 100%;
  }
}

</style>