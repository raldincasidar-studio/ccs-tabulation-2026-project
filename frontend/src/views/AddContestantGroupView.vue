<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import configService from "@/services/configService";
import starImage from "@/assets/img/star.png";
import configurationBanner from "@/assets/img/configuration-banner.png";

const router = useRouter();
const route = useRoute();

const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);

function updateViewportState() {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isSidebarCollapsed.value = false;
    isMobileSidebarOpen.value = false;
  }
}

const groupId = computed(() => route.params.id || null);
const isEditing = computed(() => Boolean(groupId.value));
const groupName = ref("");
const categoriesList = ref([]);
const selectedCategories = ref([]);

const isSubmitting = ref(false);
const message = ref({ text: "", isError: false });

function showFeedback(msg, isErr = false) {
  message.value = { text: msg, isError: isErr };
  setTimeout(() => {
    message.value.text = "";
  }, 4000);
}

function toggleCategory(catId) {
  const idx = selectedCategories.value.indexOf(catId);
  if (idx > -1) {
    selectedCategories.value.splice(idx, 1);
  } else {
    selectedCategories.value.push(catId);
  }
}

function isCategorySelected(catId) {
  return selectedCategories.value.includes(catId);
}

// ==========================================
// [READ - GET] Load Categories & Group Details
// ==========================================
async function loadData() {
  try {
    const catsRes = await configService.getCategories();
    categoriesList.value = catsRes.data?.data || catsRes.data || [];

    // If editing: prefill with existing group name and selected category IDs
    if (isEditing.value) {
      const groupsRes = await configService.getContestantGroups();
      const groups = groupsRes.data?.data || groupsRes.data || [];
      const current = groups.find((g) => g._id === groupId.value);
      if (current) {
        groupName.value = current.name || "";
        selectedCategories.value = (current.categoriesIncluded || []).map((c) =>
          typeof c === "object" ? c._id : c
        );
      }
    }
  } catch (err) {
    console.error("Error loading group data:", err);
  }
}

// ==========================================
// [CREATE - POST / UPDATE - PUT] Save Group
// ==========================================
async function handleSave() {
  if (!groupName.value.trim()) {
    return showFeedback("Group name is required", true);
  }

  isSubmitting.value = true;
  try {
    const payload = {
      name: groupName.value.trim(),
      categoriesIncluded: selectedCategories.value,
    };

    if (isEditing.value) {
      await configService.updateContestantGroup(groupId.value, payload);
      showFeedback("Contestant group updated successfully!");
    } else {
      await configService.createContestantGroup(payload);
      showFeedback("Contestant group created successfully!");
    }

    setTimeout(() => {
      router.push("/admin/configurations");
    }, 700);
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || "Failed to save contestant group";
    showFeedback(errorMsg, true);
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  updateViewportState();
  window.addEventListener("resize", updateViewportState);
  loadData();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportState);
});
</script>

<template>
  <div class="management-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div
      class="management-shell"
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }"
    >
      <Sidebar
        active-item="CONFIGURATIONS"
        :is-mobile="isMobile"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :is-mobile-sidebar-open="isMobileSidebarOpen"
        @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
        @close-mobile-sidebar="isMobileSidebarOpen = false"
      />

      <main class="main-content">
        <div class="page-content">
          <header class="management-banner" :style="{ '--banner-bg': `url(${configurationBanner})` }">
            <h1>CONTESTANT GROUP: {{ (groupName || 'PAGEANT MALE').toUpperCase() }}</h1>
          </header>

          <div
            v-if="message.text"
            :class="[
              'my-4 px-4 py-2.5 rounded-lg text-sm font-semibold transition',
              message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            ]"
          >
            {{ message.text }}
          </div>

          <form @submit.prevent="handleSave" class="mt-8 space-y-7">
            <div>
              <label class="block text-sm font-bold text-[#00227B] mb-2">Group Name</label>
              <input
                v-model="groupName"
                type="text"
                placeholder="Pageant Male"
                class="gradient-field w-full max-w-sm text-white px-5 py-2.5 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <div class="border-b-2 border-[#00227B] pb-1 mb-4">
                <h2 class="text-base font-extrabold text-[#00227B]">Categories Included</h2>
              </div>

              <!-- Alternating Table List seamlessly blending into background -->
              <div class="overflow-hidden rounded-md">
                <div
                  v-for="(cat, index) in categoriesList"
                  :key="cat._id"
                  @click="toggleCategory(cat._id)"
                  :class="[
                    'flex items-center gap-3.5 px-4 py-2.5 cursor-pointer transition select-none',
                    index % 2 === 0
                      ? 'bg-[#060071] text-white hover:brightness-110'
                      : 'bg-[#f5f6f6] text-[#1948cc] hover:bg-slate-200/50'
                  ]"
                >
                  <!-- Checkbox Box -->
                  <div
                    :class="[
                      'w-[18px] h-[18px] rounded-[2px] flex items-center justify-center border transition-colors shrink-0',
                      index % 2 === 0
                        ? 'border-[#231b99] bg-[#060071]'
                        : 'border-[#9ab2eb] bg-[#f5f6f6]'
                    ]"
                  >
                    <!-- Golden Yellow Checkmark -->
                    <svg
                      v-if="isCategorySelected(cat._id)"
                      class="w-3.5 h-3.5 stroke-[2.5] fill-none stroke-[#e5b300]"
                      viewBox="0 0 24 24"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>

                  <span class="text-sm font-medium tracking-wide">
                    {{ cat.name }}
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-4 flex items-center gap-4">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="bg-[#051F68] hover:bg-[#082982] text-white font-bold px-12 py-2 rounded-full text-xs tracking-widest transition disabled:opacity-50 cursor-pointer"
              >
                {{ isSubmitting ? 'SAVING...' : 'SAVE' }}
              </button>

              <button
                type="button"
                @click="router.push('/admin/configurations')"
                class="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.management-frame,
.management-shell {
  min-height: 100vh;
  background: #f5f6f6;
}

.management-shell {
  --sidebar-width: 218px;
  position: relative;
  overflow-x: hidden;
  color: #08065a;
}

.main-content {
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  padding: clamp(22px, 2.5vw, 56px) clamp(18px, 2.8vw, 58px) 56px;
  transition: margin-left 0.25s ease;
}

.page-content {
  width: min(100%, 1040px);
  margin: 0 auto;
}

.gradient-field {
  background: linear-gradient(90deg, #023EC6 0%, #011E60 100%) !important;
}

.management-banner {
  position: relative;
  display: flex;
  width: min(100%);
  height: clamp(120px, 13vw, 170px);
  align-items: flex-start;
  overflow: hidden;
  padding: clamp(18px, 2vw, 27px) clamp(18px, 2vw, 36px);
  border-radius: 17px;
  background-color: #02004a;
  background-image: var(--banner-bg), linear-gradient(90deg, #02004a 0%, #0500b0 100%);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  box-sizing: border-box;
}

.management-banner::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(32deg, transparent 31%, rgb(161 184 255 / 20%) 31.1%, transparent 31.25%),
    linear-gradient(122deg, transparent 82%, rgb(161 184 255 / 15%) 82.1%, transparent 82.25%);
  content: "";
  pointer-events: none;
}

.management-banner h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #dedfff;
  font-family: "Croparo", Regular, sans-serif;
  font-size: clamp(1.8rem, 2.8vw, 2.8rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  -webkit-text-stroke: 0.35px #fff;
  text-shadow: 0 0 8px rgba(180, 200, 255, 0.4);
}

@media (min-width: 768px) {
  .management-shell :deep(.sidebar-navigation) { padding-top: 78px; }
  .management-shell :deep(.sidebar-link) { min-height: 50px; }
  .management-shell :deep(.sidebar-link.active) { min-height: 50px; }
}

@media (max-width: 767px) {
  .main-content {
    margin-left: 0;
    padding: 78px 18px 36px;
  }
}
</style>