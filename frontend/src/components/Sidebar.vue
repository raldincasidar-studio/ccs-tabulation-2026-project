<script setup>
import { useRouter } from "vue-router";
import dashboardImage from "@/assets/img/logo.png.png";
import oneStarImage from "@/assets/img/one star.png";
import {
  BarChart3,
  BriefcaseBusiness,
  LayoutGrid,
  LogOut,
  Settings2,
  Users,
} from "lucide-vue-next";

const props = defineProps({
  activeItem: {
    type: String,
    default: "DASHBOARD",
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  isSidebarCollapsed: {
    type: Boolean,
    default: false,
  },
  isMobileSidebarOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  "toggle-sidebar",
  "toggle-mobile-sidebar",
  "close-mobile-sidebar",
  "logout",
]);

const router = useRouter();

const navigation = [
  { label: "DASHBOARD", icon: LayoutGrid, route: "/admin" },
  { label: "CONFIGURATIONS", icon: Settings2, route: "/admin" },
  { label: "JUDGES", icon: BriefcaseBusiness, route: "/admin" },
  { label: "CONTESTANTS", icon: Users, route: "/admin/add-contestant" },
  { label: "REPORTS", icon: BarChart3, route: "/admin" },
];

function handleNavigation(item) {
  emit("close-mobile-sidebar");
  if (item.route) {
    router.push(item.route);
  }
}

function handleLogout() {
  emit("logout");
  router.push("/login");
}
</script>

<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: props.isSidebarCollapsed && !props.isMobile,
      'mobile-open': props.isMobileSidebarOpen && props.isMobile,
    }"
  >
    <button
      v-if="!props.isMobile"
      class="sidebar-toggle"
      type="button"
      :aria-label="props.isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :aria-expanded="!props.isSidebarCollapsed"
      :title="props.isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="emit('toggle-sidebar')"
    >
      <span class="toggle-bar"></span>
      <span class="toggle-bar"></span>
      <span class="toggle-bar"></span>
    </button>

    <button
      v-if="props.isMobile && props.isMobileSidebarOpen"
      class="sidebar-close"
      type="button"
      aria-label="Close navigation menu"
      @click="emit('close-mobile-sidebar')"
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
      <button
        v-for="(item, index) in navigation"
        :key="item.label"
        type="button"
        class="sidebar-link"
        :class="{ active: item.label === props.activeItem }"
        :aria-current="item.label === props.activeItem ? 'page' : undefined"
        @click="handleNavigation(item)"
      >
        <component :is="item.icon" class="sidebar-icon" :size="18" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <button class="sign-out" type="button" @click="handleLogout()">
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
</template>

<style scoped>
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
  border: 1px solid rgb(120 171 255 / 50%);
  border-radius: 9px;
  background: rgb(10 17 58 / 92%);
  box-shadow: 0 0 0 1px rgb(96 143 255 / 18%), 0 8px 18px rgb(11 18 72 / 26%);
  color: #edf3ff;
  cursor: pointer;
  transition: all 0.25s ease;
}

.sidebar-toggle:hover {
  border-color: rgb(166 201 255 / 80%);
  box-shadow: 0 0 0 1px rgb(132 186 255 / 24%), 0 10px 20px rgb(25 39 118 / 30%);
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

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 2;
  display: flex;
  width: var(--sidebar-width);
  flex-direction: column;
  height: 100vh;
  padding: 0;
  background-color: #080a47;
  background-image: linear-gradient(35deg, transparent 31%, rgb(117 155 255 / 25%) 31.2%, transparent 31.6%),
    linear-gradient(145deg, transparent 61%, rgb(117 155 255 / 22%) 61.2%, transparent 61.6%),
    linear-gradient(180deg, #080a47 0%, #10147e 53%, #080a47 100%);
  background-repeat: no-repeat;
  background-position: center, center, center;
  border-top: 1px solid rgb(56 190 255 / 64%);
  border-right: 0;
  border-bottom: 2px solid #36d7ff;
  color: #fff;
  transition: width 0.25s ease, transform 0.25s ease;
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
  position: relative;
  top: auto;
  left: auto;
  width: 56px;
  max-width: 56px;
  max-height: 90px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgb(122 197 255 / 65%)) brightness(1.12);
}

.sidebar.collapsed .sidebar-navigation {
  align-items: center;
  margin-top: 10px;
}

.sidebar.collapsed .sidebar-link,
.sidebar.collapsed .sign-out {
  justify-content: center;
  gap: 0;
  padding-inline: 0;
}

.sidebar.collapsed .sidebar-link span,
.sidebar.collapsed .sign-out span {
  display: none;
}

.sidebar.collapsed .sign-out {
  margin-bottom: 16px;
}

.sidebar::before,
.sidebar::after {
  position: absolute;
  right: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(76 196 255 / 25%), transparent);
  content: "";
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
  display: flex;
  height: 115px;
  flex: 0 0 130px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 6px 2px;
  color: #fff;
  font-family: "Croparo", sans-serif;
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
  content: "";
  pointer-events: none;
}

.sidebar-brand img {
  position: absolute;
  top: 11px;
  left: 44px;
  z-index: 2;
  display: block;
  width: 174px;
  max-width: none;
  height: 143px;
  max-height: 143px;
  object-fit: contain;
}

.sidebar-navigation {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-top: 0;
  border-top: 1px solid rgb(255 255 255 / 15%);
}

.sidebar-navigation a,
.sidebar-link,
.sign-out {
  display: flex;
  width: 100%;
  min-height: 42px;
  align-items: center;
  gap: 6px;
  padding: 0 8px 0 12px;
  color: #b9c0e1;
  font-family: "Croparo", sans-serif;
  font-size: clamp(0.68rem, 0.35vw + 0.54rem, 0.98rem);
  font-weight: 400;
  letter-spacing: 0.02em;
  line-height: 1.1;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.sidebar-link svg,
.sign-out svg,
.sign-out-icon {
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
}

.sidebar-link span {
  width: auto;
  height: auto;
  flex: 1 1 auto;
  min-width: 0;
  line-height: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
}

.sidebar-link.active {
  min-height: 35px;
  color: #f5f6ff;
  background: #11156d;
}

.sidebar-link:not(.active):hover,
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
  content: "";
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
  content: "";
  transform: scaleX(0.35);
}

.star-one { top: 33%; left: 15%; }
.star-two { top: 12%; left: 53%; width: 4px; height: 4px; }
.star-three { top: 41%; left: 68%; }
.star-four { top: 61%; left: 27%; width: 4px; height: 4px; }
.star-five { top: 65%; left: 62%; }
.star-six { top: 79%; left: 42%; width: 2px; height: 2px; }

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

@media (max-width: 767px) {
  .mobile-hamburger {
    display: flex;
  }

  .sidebar-toggle,
  .sidebar.collapsed {
    display: none;
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
}

@media (max-width: 520px) {
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
    left: 35px;
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
}
</style>
