<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import starImage from "@/assets/img/star.png";
import configurationBanner from "@/assets/img/configuration-banner.png";
import configService from "@/services/configService";

const router = useRouter();

// Viewport & Sidebar State
const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const isMenuHidden = ref(false);

function updateViewportState() {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isSidebarCollapsed.value = false;
    isMobileSidebarOpen.value = false;
    return;
  }
  isMenuHidden.value = false;
}

function handleScrollState() {
  if (!isMobile.value) {
    isMenuHidden.value = false;
    return;
  }
  const scrollTop = window.scrollY || window.pageYOffset;
  isMenuHidden.value = scrollTop > 12;
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  router.push("/login");
}

// State & Feedback
const isLoading = ref(true);
const isSavingEvent = ref(false);
const statusMessage = reactive({ text: "", isError: false });

// Confirmation Modal State
const deleteModal = reactive({
  isOpen: false,
  isProcessing: false,
  type: "", // 'group' | 'category'
  id: "",
  name: "",
});

const eventForm = reactive({
  _id: "",
  eventTitle: "",
  eventDescription: "",
});

const contestantGroups = ref([]);
const categories = ref([]);

function showMessage(msg, isErr = false) {
  statusMessage.text = msg;
  statusMessage.isError = isErr;
  setTimeout(() => {
    if (statusMessage.text === msg) statusMessage.text = "";
  }, 4000);
}

function getCategoriesCountText(catArray) {
  const count = Array.isArray(catArray) ? catArray.length : 0;
  return `${count} ${count === 1 ? "category" : "categories"}`;
}

// ==========================================
// [READ - GET] Load All Initial Data
// ==========================================
async function loadAllData() {
  isLoading.value = true;
  try {
    const [configRes, groupsRes, categoriesRes] = await Promise.allSettled([
      configService.getConfiguration(),
      configService.getContestantGroups(),
      configService.getCategories(),
    ]);

    // 1. GET /configuration
    if (configRes.status === "fulfilled" && configRes.value) {
      const raw = configRes.value;
      const configData = raw.data?.data || raw.data || raw;
      if (configData) {
        eventForm._id = configData._id || "";
        eventForm.eventTitle = configData.eventTitle || "";
        eventForm.eventDescription = configData.eventDescription || "";
      }
    }

    // 2. GET /contestant-groups
    if (groupsRes.status === "fulfilled" && groupsRes.value) {
      const rawGroups = groupsRes.value;
      const groupsList = Array.isArray(rawGroups) ? rawGroups : (Array.isArray(rawGroups.data) ? rawGroups.data : rawGroups.data?.data);
      if (Array.isArray(groupsList)) {
        contestantGroups.value = groupsList;
      }
    }

    // 3. GET /categories
    if (categoriesRes.status === "fulfilled" && categoriesRes.value) {
      const rawCats = categoriesRes.value;
      const catsList = Array.isArray(rawCats) ? rawCats : (Array.isArray(rawCats.data) ? rawCats.data : rawCats.data?.data);
      if (Array.isArray(catsList)) {
        categories.value = catsList;
      }
    }
  } catch (error) {
    console.error("Error loading configuration data:", error);
    showMessage("Failed to load backend configurations", true);
  } finally {
    isLoading.value = false;
  }
}

// ==========================================
// [UPDATE - PUT] Save Global Event Configuration
// ==========================================
async function saveEventConfiguration() {
  if (!eventForm.eventTitle.trim()) {
    return showMessage("Event title is required", true);
  }
  isSavingEvent.value = true;
  try {
    const res = await configService.updateConfiguration({
      eventTitle: eventForm.eventTitle.trim(),
      eventDescription: eventForm.eventDescription.trim(),
    });
    showMessage(res?.message || "Configuration updated successfully");
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || "Failed to update configuration";
    showMessage(errorMsg, true);
  } finally {
    isSavingEvent.value = false;
  }
}

// Navigation helpers
function goToAddGroup() {
  router.push("/admin/contestant-groups/add");
}

function goToEditGroup(id) {
  router.push(`/admin/contestant-groups/edit/${id}`);
}

function goToAddCategory() {
  router.push("/admin/categories/add");
}

function goToEditCategory(id) {
  router.push(`/admin/categories/edit/${id}`);
}

// ==========================================
// Modal Trigger Functions
// ==========================================
function promptDeleteGroup(group) {
  deleteModal.isOpen = true;
  deleteModal.type = "group";
  deleteModal.id = group._id;
  deleteModal.name = group.name;
}

function promptDeleteCategory(cat) {
  deleteModal.isOpen = true;
  deleteModal.type = "category";
  deleteModal.id = cat._id;
  deleteModal.name = cat.name;
}

function closeDeleteModal() {
  if (deleteModal.isProcessing) return;
  deleteModal.isOpen = false;
  deleteModal.type = "";
  deleteModal.id = "";
  deleteModal.name = "";
}

// ==========================================
// [DELETE] Execute Deletion
// ==========================================
async function handleConfirmDelete() {
  deleteModal.isProcessing = true;
  try {
    if (deleteModal.type === "group") {
      const res = await configService.deleteContestantGroup(deleteModal.id);
      showMessage(res?.message || "Contestant group deleted successfully");
      contestantGroups.value = contestantGroups.value.filter((g) => g._id !== deleteModal.id);
    } else if (deleteModal.type === "category") {
      const res = await configService.deleteCategory(deleteModal.id);
      showMessage(res?.message || "Category deleted successfully");
      categories.value = categories.value.filter((c) => c._id !== deleteModal.id);
    }
    deleteModal.isOpen = false;
  } catch (error) {
    const defaultMsg = deleteModal.type === "group" 
      ? "Cannot delete group containing registered contestants" 
      : "Cannot delete category linked to active contestant groups";
    const errorMsg = error.response?.data?.error?.message || defaultMsg;
    showMessage(errorMsg, true);
  } finally {
    deleteModal.isProcessing = false;
  }
}

onMounted(() => {
  updateViewportState();
  handleScrollState();
  window.addEventListener("resize", updateViewportState);
  window.addEventListener("scroll", handleScrollState, { passive: true });
  loadAllData();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportState);
  window.removeEventListener("scroll", handleScrollState);
});
</script>

<template>
  <div class="management-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div
      class="management-shell"
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }"
    >
      <button
        v-if="isMobile"
        class="mobile-menu"
        :class="{ 'is-hidden': isMenuHidden }"
        type="button"
        aria-label="Open navigation menu"
        @click="isMobileSidebarOpen = true"
      >
        <span></span><span></span><span></span>
      </button>

      <div
        v-if="isMobile && isMobileSidebarOpen"
        class="mobile-overlay"
        @click="isMobileSidebarOpen = false"
      ></div>

      <Sidebar
        active-item="CONFIGURATIONS"
        :is-mobile="isMobile"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :is-mobile-sidebar-open="isMobileSidebarOpen"
        @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
        @close-mobile-sidebar="isMobileSidebarOpen = false"
        @logout="handleLogout"
      />

      <main class="main-content">
        <div class="page-content">
          <header class="management-banner" :style="{ '--banner-bg': `url(${configurationBanner})` }">
            <h1>CONFIGURATIONS</h1>
          </header>

          <!-- Toast Message -->
          <div 
            v-if="statusMessage.text" 
            :class="[
              'my-4 px-4 py-2.5 rounded-lg flex items-center justify-between text-sm font-semibold shadow-sm transition',
              statusMessage.isError ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
            ]"
          >
            <span>{{ statusMessage.text }}</span>
            <button @click="statusMessage.text = ''" class="ml-4 font-bold text-lg cursor-pointer">&times;</button>
          </div>

          <!-- Loading Spinner -->
          <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
            <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs font-semibold tracking-wider uppercase text-blue-900">Loading configurations...</span>
          </div>

          <!-- Content Sections -->
          <div v-else class="space-y-8 mt-7">
            <!-- 1. EVENT SECTION (PUT /configuration) -->
            <section class="space-y-4">
              <div class="flex items-center justify-between border-b-2 border-[#00227B] pb-1">
                <h2 class="text-[#00227B] font-extrabold text-base md:text-lg tracking-wider">EVENT</h2>
              </div>

              <div class="space-y-4 pt-1">
                <div>
                  <label class="block text-[#00227B] font-bold text-sm mb-1.5">Event Title</label>
                  <input 
                    v-model="eventForm.eventTitle"
                    type="text" 
                    placeholder="2026 Mr & Ms CCS"
                    class="w-full bg-[#060071] text-white px-4 py-2.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label class="block text-[#00227B] font-bold text-sm mb-1.5">Event Description</label>
                  <input 
                    v-model="eventForm.eventDescription"
                    type="text" 
                    placeholder="The MR and MS CCS of Acquaintance Party"
                    class="w-full bg-[#060071] text-white px-4 py-2.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div class="flex justify-end pt-2">
                  <button 
                    @click="saveEventConfiguration"
                    :disabled="isSavingEvent"
                    class="bg-[#051F68] hover:bg-[#082982] text-white font-bold px-10 py-2 rounded-full text-xs tracking-widest transition shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {{ isSavingEvent ? 'SAVING...' : 'SAVE' }}
                  </button>
                </div>
              </div>
            </section>

            <!-- 2. CONTESTANT GROUP SECTION (GET / DELETE) -->
            <section class="space-y-4">
              <div class="flex items-center justify-between border-b-2 border-[#00227B] pb-1">
                <h2 class="text-[#00227B] font-extrabold text-base md:text-lg tracking-wider">CONTESTANT GROUP</h2>
                <button 
                  @click="goToAddGroup"
                  class="text-[#00227B] hover:text-blue-800 text-sm font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  + Add
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr class="text-[#00227B] text-xs font-black tracking-wide">
                      <th class="px-5 py-2 w-1/3">Name</th>
                      <th class="px-5 py-2 w-1/3">Categories Included</th>
                      <th class="px-5 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr 
                      v-for="(group, index) in contestantGroups" 
                      :key="group._id || index"
                      :class="[
                        'transition-all duration-150',
                        index % 2 === 0 
                          ? 'bg-[#060071] text-white rounded-md shadow-sm' 
                          : 'bg-transparent text-[#060071] font-semibold'
                      ]"
                    >
                      <td class="px-5 py-3 rounded-l-md font-medium text-sm">{{ group.name }}</td>
                      <td class="px-5 py-3 text-sm">{{ getCategoriesCountText(group.categoriesIncluded) }}</td>
                      <td class="px-5 py-3 rounded-r-md text-right text-sm space-x-4">
                        <button @click="goToEditGroup(group._id)" class="hover:underline font-semibold cursor-pointer">Edit</button>
                        <button @click="promptDeleteGroup(group)" class="hover:underline font-semibold cursor-pointer text-red-400 hover:text-red-300">Delete</button>
                      </td>
                    </tr>
                    <tr v-if="contestantGroups.length === 0">
                      <td colspan="3" class="text-center py-6 text-slate-400 text-sm italic">No contestant groups found.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- 3. CATEGORIES SECTION (GET / DELETE) -->
            <section class="space-y-4">
              <div class="flex items-center justify-between border-b-2 border-[#00227B] pb-1">
                <h2 class="text-[#00227B] font-extrabold text-base md:text-lg tracking-wider">CATEGORIES</h2>
                <button 
                  @click="goToAddCategory"
                  class="text-[#00227B] hover:text-blue-800 text-sm font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  + Add
                </button>
              </div>

              <div class="overflow-x-auto space-y-2">
                <div 
                  class="w-full grid grid-cols-12 px-6 py-2.5 rounded-md font-bold text-xs tracking-wider shadow-sm select-none"
                  :style="{
                    background: 'linear-gradient(90deg, #DCE900 0%, #307BE6 45%, #0036B8 100%)'
                  }"
                >
                  <div class="col-span-4 text-[#06184C]">Name</div>
                  <div class="col-span-3 text-white">Weight</div>
                  <div class="col-span-3 text-white">Is Active</div>
                  <div class="col-span-2 text-right text-white">Actions</div>
                </div>

                <div class="space-y-2">
                  <div 
                    v-for="cat in categories" 
                    :key="cat._id"
                    class="w-full grid grid-cols-12 px-6 py-3 bg-[#0334A8] hover:bg-[#022c92] text-white rounded-md text-sm font-medium items-center shadow-sm transition"
                  >
                    <div class="col-span-4 font-semibold tracking-wide">{{ cat.name }}</div>
                    <div class="col-span-3">{{ cat.weight }}%</div>
                    <div class="col-span-3">{{ cat.isActive ? 'Yes' : 'No' }}</div>
                    <div class="col-span-2 text-right space-x-3">
                      <button @click="goToEditCategory(cat._id)" class="text-white hover:underline font-semibold cursor-pointer">Edit</button>
                      <button @click="promptDeleteCategory(cat)" class="text-[#FF2222] hover:underline font-bold cursor-pointer">Delete</button>
                    </div>
                  </div>
                  <div v-if="categories.length === 0" class="text-center py-6 text-slate-400 text-sm italic">
                    No categories found.
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>

    <!-- Confirmation Modal -->
    <div
      v-if="deleteModal.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
      @click.self="closeDeleteModal"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
        <!-- Modal Header / Icon -->
        <div class="p-6 text-center">
          <div class="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 class="text-lg font-bold text-slate-800">
            Delete {{ deleteModal.type === 'group' ? 'Contestant Group' : 'Category' }}
          </h3>
          <p class="text-sm text-slate-500 mt-2">
            Are you sure you want to delete <span class="font-bold text-slate-700">"{{ deleteModal.name }}"</span>? 
            This action cannot be undone.
          </p>
        </div>

        <!-- Modal Actions -->
        <div class="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
          <button
            type="button"
            :disabled="deleteModal.isProcessing"
            @click="closeDeleteModal"
            class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            :disabled="deleteModal.isProcessing"
            @click="handleConfirmDelete"
            class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <span v-if="deleteModal.isProcessing" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ deleteModal.isProcessing ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
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
  font-size: clamp(2rem, 3vw, 3.1rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  -webkit-text-stroke: 0.35px #fff;
  text-shadow: 0 0 8px rgba(180, 200, 255, 0.4);
}

.mobile-menu {
  display: none;
}

@media (max-width: 1100px) {
  .management-frame,
  .management-shell {
    overflow-x: hidden;
  }
  .main-content { padding-right: 24px; padding-left: 24px; }
  .page-content { width: 100%; }
  .management-banner { width: 100%; }
}

@media (max-width: 767px) {
  .management-frame,
  .management-shell {
    overflow-x: hidden;
  }

  .main-content {
    margin-left: 0;
    padding: 78px 18px 36px;
  }
  .page-content { width: 100%; }
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

  .mobile-menu {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
    display: flex;
    width: 38px;
    height: 34px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px solid #2d25c8;
    border-radius: 5px;
    background: #08065a;
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    transition: opacity 0.2s ease, transform 0.2s ease, visibility 0.2s ease;
  }

  .mobile-menu.is-hidden {
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    pointer-events: none;
  }
  .mobile-menu span { width: 18px; height: 2px; background: #fff; }
  .mobile-overlay { position: fixed; inset: 0; z-index: 12; background: rgb(0 0 0 / 45%); }
}

@media (min-width: 768px) {
  .management-shell :deep(.sidebar-navigation) { padding-top: 78px; }
  .management-shell :deep(.sidebar-link) { min-height: 50px; }
  .management-shell :deep(.sidebar-link.active) { min-height: 50px; }
}
</style>