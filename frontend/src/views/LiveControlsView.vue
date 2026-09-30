<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import configService from '@/services/configService';
import judgeService from '@/services/judgeService';
import Sidebar from '@/components/Sidebar.vue';

// Sidebar & Layout State
const isSidebarCollapsed = ref(false);
const isMobile = ref(false);
const isMobileSidebarOpen = ref(false);

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 767;
  if (!isMobile.value) {
    isMobileSidebarOpen.value = false;
  }
};

// Data State
const categories = ref([]);
const groups = ref([]);
const contestants = ref([]);

const selectedCategory = ref('');
const selectedContestant = ref('');

const loading = ref(true);
const saving = ref(false);
const message = ref(null);

onMounted(async () => {
  checkMobile();
  window.addEventListener('resize', checkMobile);

  try {
    loading.value = true;

    // Fetch base data
    const [configRes, catData, grpData] = await Promise.all([
      configService.getConfiguration(),
      judgeService.getCategories(),
      judgeService.getContestantGroups()
    ]);

    const configData = configRes.data?.data || configRes.data || configRes;
    categories.value = catData || [];
    groups.value = grpData || [];

    // Set initial selections from current live status
    const liveStatus = configData?.liveStatus;
    if (liveStatus?.categoryActive?._id) {
      selectedCategory.value = liveStatus.categoryActive._id;
      
      // Pre-fetch contestants for the initially selected category
      const linkedGroup = groups.value.find(g => g.categoriesIncluded?.includes(selectedCategory.value));
      if (linkedGroup) {
        const contData = await judgeService.getContestants({ groupId: linkedGroup._id });
        contestants.value = contData || [];
        
        if (liveStatus?.contestantActive?._id) {
          selectedContestant.value = liveStatus.contestantActive._id;
        }
      }
    }
  } catch (error) {
    console.error("Failed to load live control data:", error);
    message.value = { type: 'error', text: 'Failed to load configuration data.' };
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

// Handle Category change to fetch respective contestants
const handleCategoryChange = async () => {
  selectedContestant.value = ''; // Reset contestant when category changes
  contestants.value = [];

  if (!selectedCategory.value) return;

  const linkedGroup = groups.value.find(g => g.categoriesIncluded?.includes(selectedCategory.value));
  
  if (linkedGroup) {
    try {
      const contData = await judgeService.getContestants({ groupId: linkedGroup._id });
      contestants.value = contData || [];
    } catch (error) {
      console.error("Failed to fetch contestants for group:", error);
    }
  }
};

const handleSave = async () => {
  if (!selectedCategory.value || !selectedContestant.value) {
    message.value = { type: 'error', text: 'Please select both a category and a contestant.' };
    return;
  }

  saving.value = true;
  message.value = null;

  try {
    await configService.updateLiveStatus({
      categoryActive: selectedCategory.value,
      contestantActive: selectedContestant.value
    });
    
    message.value = { type: 'success', text: 'Live status updated successfully!' };
    setTimeout(() => { message.value = null; }, 4000);
  } catch (error) {
    console.error("Failed to update live status:", error);
    message.value = { type: 'error', text: 'Failed to update live status. Please try again.' };
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="admin-layout">
    
    <!-- 1. Mobile Hamburger Button (Shows only on <= 767px) -->
    <button
      v-if="isMobile"
      class="mobile-hamburger"
      type="button"
      aria-label="Open navigation menu"
      @click="isMobileSidebarOpen = true"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- 2. Dark Overlay Backdrop (Closes sidebar on tap) -->
    <div
      v-if="isMobile && isMobileSidebarOpen"
      class="mobile-sidebar-overlay"
      aria-hidden="true"
      @click="isMobileSidebarOpen = false"
    ></div>

    <!-- 3. Sidebar Component -->
    <Sidebar
      active-item="LIVE CONTROLS"
      :is-sidebar-collapsed="isSidebarCollapsed"
      :is-mobile="isMobile"
      :is-mobile-sidebar-open="isMobileSidebarOpen"
      @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
      @toggle-mobile-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen"
      @close-mobile-sidebar="isMobileSidebarOpen = false"
    />

    <!-- 4. Main Content Area -->
    <main
      class="main-content"
      :class="{
        'sidebar-collapsed': isSidebarCollapsed && !isMobile,
        'mobile-view': isMobile
      }"
    >
      <div v-if="loading" class="loading-state">
        Loading Live Controls...
      </div>

      <div v-else class="content-wrapper">
        <!-- Top Banner -->
        <div class="banner">
          <h1 class="banner-text">LIVE CONTROLS</h1>
          <div class="star star-1"></div>
          <div class="star star-2"></div>
          <div class="star star-3"></div>
          <div class="star-line"></div>
        </div>

        <!-- Centered Dropdowns Container -->
        <div class="form-container">
          <h2 class="section-title">SET ACTIVE JUDGING STATUS</h2>

          <div class="form-card">
            <!-- Category Dropdown -->
            <div class="form-group">
              <label>Active Category</label>
              <select
                v-model="selectedCategory"
                @change="handleCategoryChange"
                class="custom-select"
              >
                <option value="" disabled>-- Select Event Category --</option>
                <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                  {{ cat.name }}
                </option>
              </select>
            </div>

            <!-- Contestant Dropdown -->
            <div class="form-group">
              <label>Active Contestant</label>
              <select
                v-model="selectedContestant"
                :disabled="!selectedCategory || contestants.length === 0"
                class="custom-select"
              >
                <option value="" disabled>
                  {{ !selectedCategory 
                      ? '-- Select a Category First --' 
                      : (contestants.length === 0 ? '-- No Contestants in this Category --' : '-- Select Contestant --') 
                  }}
                </option>
                <option v-for="cont in contestants" :key="cont._id" :value="cont._id">
                  {{ cont.label }} - {{ cont.name }}
                </option>
              </select>
            </div>

            <!-- Action Area -->
            <div class="action-area">
              <div class="message-wrapper">
                <p v-if="message" :class="['message', message.type === 'success' ? 'msg-success' : 'msg-error']">
                  {{ message.text }}
                </p>
              </div>
              
              <button
                @click="handleSave"
                :disabled="saving || !selectedCategory || !selectedContestant"
                class="save-button"
              >
                {{ saving ? 'SAVING...' : 'SAVE' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Layout Root */
.admin-layout {
  --sidebar-width: 240px;
  display: flex;
  min-height: 100vh;
  background-color: #f4f5f8;
  font-family: Arial, sans-serif;
  position: relative;
}

/* Mobile Hamburger Button matching Sidebar styles */
.mobile-hamburger {
  position: fixed;
  top: 16px;
  left: 14px;
  z-index: 30;
  display: none;
  width: 46px;
  height: 46px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  border: 1px solid rgb(129 170 255 / 55%);
  border-radius: 10px;
  background: rgb(8 13 49 / 95%);
  box-shadow: 0 8px 18px rgb(11 16 68 / 30%);
  box-sizing: border-box;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.mobile-hamburger:active {
  transform: scale(0.95);
}

.mobile-hamburger span {
  display: block;
  width: 22px;
  height: 2.5px;
  border-radius: 999px;
  background: #edf3ff;
}

/* Overlay Backdrop */
.mobile-sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 15;
  background: rgb(0 0 0 / 50%);
  backdrop-filter: blur(2px);
}

/* Main Content Area */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  padding: 2.5rem 3.5rem;
  transition: margin-left 0.25s ease;
  min-width: 0;
  box-sizing: border-box;
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
}

.loading-state {
  color: #03014b;
  font-weight: bold;
  font-size: 1.2rem;
  text-align: center;
  margin-top: 4rem;
}

/* Centered Form Wrapper */
.content-wrapper {
  max-width: 880px;
  margin: 0 auto;
  width: 100%;
}

/* Banner Styles */
.banner {
  background-color: #01004c;
  background-image: linear-gradient(135deg, #01004c 40%, #0d0f7a 100%);
  border-radius: 14px;
  height: 180px;
  margin-bottom: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.banner-text {
  font-family: 'Arial Black', Impact, sans-serif;
  font-size: 3.2rem;
  letter-spacing: 0.15em;
  color: transparent;
  -webkit-text-stroke: 1.5px #fff;
  z-index: 10;
}

/* Banner Stars */
.star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8);
}
.star::before, .star::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
.star::before { width: 1px; height: 15px; }
.star::after { width: 15px; height: 1px; }

.star-1 { top: 30%; left: 20%; transform: scale(1.2); }
.star-2 { bottom: 25%; left: 45%; transform: scale(0.8); opacity: 0.7; }
.star-3 { top: 25%; right: 15%; transform: scale(1); }

.star-line {
  position: absolute;
  top: 0; right: 20%;
  width: 1px; height: 100%;
  background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: rotate(35deg);
}

/* Form Styles */
.form-container {
  width: 100%;
}

.section-title {
  color: #03014b;
  font-size: 1.15rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #03014b;
  padding-bottom: 0.6rem;
  margin-bottom: 2rem;
}

.form-card {
  width: 100%;
}

.form-group {
  margin-bottom: 1.8rem;
}

.form-group label {
  display: block;
  color: #03014b;
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
}

.custom-select {
  width: 100%;
  background-color: #050146;
  color: white;
  padding: 14px 18px;
  border-radius: 6px;
  border: none;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  box-sizing: border-box;
}

.custom-select:focus {
  box-shadow: 0 0 0 2px rgba(96, 143, 255, 0.6);
}

.custom-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Action Area */
.action-area {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3rem;
}

.message-wrapper {
  flex: 1;
  padding-right: 1.5rem;
}

.message {
  font-size: 0.9rem;
  font-weight: bold;
  padding: 10px 14px;
  border-radius: 6px;
}

.msg-success {
  background-color: #d1fae5;
  color: #065f46;
  border: 1px solid #34d399;
}

.msg-error {
  background-color: #fee2e2;
  color: #991b1b;
  border: 1px solid #f87171;
}

.save-button {
  background-color: #01004c;
  color: white;
  font-weight: bold;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  padding: 12px 42px;
  border-radius: 99px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, opacity 0.2s;
  text-transform: uppercase;
}

.save-button:hover:not(:disabled) {
  background-color: #12108c;
}

.save-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .mobile-hamburger {
    display: flex;
  }

  .main-content {
    margin-left: 0 !important;
    padding: 5rem 1.25rem 2rem !important; /* Top padding accommodates the hamburger icon */
  }

  .banner {
    height: 120px;
    margin-bottom: 1.5rem;
  }

  .banner-text {
    font-size: 1.8rem;
  }

  .action-area {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 1rem;
  }

  .message-wrapper {
    padding-right: 0;
  }
}
</style>