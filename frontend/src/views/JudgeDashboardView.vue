<template>
  <!-- Main Background Container with Figma Linear Gradient -->
  <div 
    class="relative min-h-screen w-full text-white flex flex-col select-none overflow-x-hidden"
    :style="{
      background: 'linear-gradient(180deg, #01010D 28%, #020333 93%)'
    }"
  >
    <!-- Main Star Image Overlay -->
    <div 
      class="fixed inset-0 pointer-events-none bg-no-repeat bg-[center_top] bg-[length:140%_auto] md:bg-[length:115%_auto] opacity-90 z-0"
      :style="{ backgroundImage: `url(${starBg})` }"
    ></div>

    <!-- Top Bar Navigation -->
    <header class="relative z-10 flex items-center justify-between px-8 py-6 w-full">
      <!-- Go Back -->
      <button 
        @click="handleGoBack"
        class="flex items-center gap-2 text-white/90 hover:text-white font-medium text-lg transition-colors cursor-pointer group"
      >
        <ChevronLeft class="w-6 h-6 transition-transform group-hover:-translate-x-1" />
        <span>Go back</span>
      </button>

      <!-- Live Mode Toggle -->
      <div class="flex items-center gap-3">
        <button 
          @click="toggleLiveMode" 
          type="button"
          class="relative w-[62px] h-[26px] rounded-full p-[3px] flex items-center cursor-pointer transition-all duration-300 border border-blue-400/40 shadow-[0_0_12px_rgba(1,30,96,0.5)]"
          :style="{
            background: isLiveMode 
              ? 'linear-gradient(90deg, #FFFFFF 0%, #011E60 100%)' 
              : 'linear-gradient(90deg, #64748b 0%, #0f172a 100%)'
          }"
        >
          <!-- Red Ball Indicator -->
          <div 
            class="w-[20px] h-[20px] rounded-full transition-all duration-300 flex items-center justify-center"
            :class="isLiveMode 
              ? 'translate-x-0 bg-[#E00000] shadow-[0_0_8px_#E00000]' 
              : 'translate-x-[36px] bg-slate-400 shadow-none'"
          >
            <span v-if="isLiveMode" class="w-1.5 h-1.5 rounded-full bg-white/80"></span>
          </div>
        </button>

        <span class="font-croparo text-xs sm:text-sm tracking-[0.2em] text-slate-200 uppercase">
          LIVE MODE
        </span>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="relative z-10 flex-1 flex flex-col items-center justify-start px-4 pb-16 max-w-6xl mx-auto w-full">
      
      <!-- Prominent Welcome Title -->
      <div class="mt-8 md:mt-12 mb-6 flex flex-col justify-center items-center w-full text-center">
        <span class="welcome-subtext font-croparo text-sm sm:text-lg md:text-xl font-bold tracking-[0.45em] uppercase">
          WELCOME
        </span>
        <h1 class="welcome-judge-title font-croparo text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-wider mt-1">
          {{ judgeName }}
        </h1>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center my-12 text-cyan-300">
        <div class="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="font-croparo text-sm mt-3 tracking-widest uppercase">Connecting to Admin...</span>
      </div>

      <!-- Categories 3-3-1 Grid -->
      <div v-else class="w-full max-w-[820px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-x-1 gap-y-14 justify-items-center mt-6">
        <div 
          v-for="(cat, index) in categories" 
          :key="cat._id || cat.id || index"
          @click="selectCategory(cat)"
          class="relative w-[246px] h-[184px] cursor-pointer transition-transform duration-200 hover:scale-[1.03] flex flex-col justify-end items-center group"
          :class="{
            'md:col-span-2': true,
            'md:col-start-2': index === 3,
            'md:col-start-4': index === 4
          }"
        >
          <!-- Card Background Box -->
          <div 
            class="absolute inset-0 rounded-[12px] overflow-hidden border border-blue-400/40 shadow-[0_0_18px_rgba(2,62,198,0.35)]"
            :style="{ background: 'linear-gradient(180deg, #023EC6 0%, #060071 65%)' }"
          >
            <!-- Card Stars Background -->
            <div 
              class="absolute inset-0 pointer-events-none bg-cover bg-center opacity-80"
              :style="starCategoryBg ? { backgroundImage: `url(${starCategoryBg})` } : {}"
            ></div>
          </div>

          <!-- Active Stage Status Indicator -->
          <div 
            v-if="cat.isCurrentlyLive" 
            class="absolute top-2 right-2 z-30 px-2.5 py-0.5 rounded-full bg-red-600/90 border border-red-300 text-[10px] font-bold text-white tracking-widest flex items-center gap-1 shadow-[0_0_8px_#ef4444]"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
            LIVE
          </div>

          <!-- Logo / Model Cutout -->
          <img 
            :src="cat.image" 
            :alt="cat.name"
            @error="handleImageError(cat)"
            class="absolute -top-11 h-[195px] max-w-[170px] object-contain pointer-events-none z-20 drop-shadow-[0_10px_16px_rgba(0,0,0,0.85)] transition-transform duration-300 group-hover:scale-105"
          />

          <!-- Soothing Blue Gradient Pill Badge -->
          <div 
            class="badge-pill relative z-30 w-[94%] min-h-[42px] max-h-[52px] mb-2.5 px-3 py-1.5 rounded-full border border-cyan-400/60 flex items-center justify-center text-center overflow-hidden transition-all shadow-[0_0_15px_rgba(14,165,233,0.35)]"
            :style="{
              background: 'linear-gradient(90deg, #021B79 0%, #0B4ED4 50%, #021B79 100%)'
            }"
          >
            <span 
              class="badge-text font-croparo font-black uppercase text-white select-none text-center"
              :class="getTitleClasses(cat.name)"
            >
              {{ cat.name }}
            </span>
          </div>

        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { logout, getCurrentUser } from '@/services/authService.js'
import { judgeService } from '@/services/judgeService.js'

// Image Asset Imports
import starBg from '@/assets/img/star-bg.png'
import starCategoryBg from '@/assets/img/star-bg-category.png'
import mrMsLogo from '@/assets/img/mr-ms-css-logo.png'

const router = useRouter()
const isLiveMode = ref(true)
const isLoading = ref(true)
const judgeName = ref('JUDGE')

const getCategoryOrder = (category) => {
  const name = (category.name || category.title || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

  if (name.includes('PRODUCTION')) return 0
  if (name.includes('PLAYSUIT')) return 1
  if (name.includes('UNIFORM')) return 2
  if (name.includes('FORMAL') || name.includes('EVENINGGOWN')) return 3
  if (name.includes('QA')) return 4
  return 5
}

const sortCategories = (categoryList) => categoryList
  .map((category, index) => ({ category, index }))
  .sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category) || a.index - b.index)
  .map(({ category }) => category)

const isHiddenCategory = (category) => {
  const name = (category.name || category.title || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const isQaCategory = name.startsWith('QA') || name.startsWith('QANDA')

  return name.includes('ADVOCACY') || (isQaCategory && !name.includes('FINAL'))
}

// Initialize categories with logo
const categories = ref([
  { id: 'prod-no', name: 'PRODUCTION NO', image: mrMsLogo, isCurrentlyLive: false },
  { id: 'playsuit', name: 'PLAYSUIT', image: mrMsLogo, isCurrentlyLive: false },
  { id: 'uniform-1', name: 'UNIFORM', image: mrMsLogo, isCurrentlyLive: false },
  { id: 'uniform-2', name: 'UNIFORM', image: mrMsLogo, isCurrentlyLive: false },
  { id: 'qa-final', name: 'Q & A FINAL', image: mrMsLogo, isCurrentlyLive: false }
])

// Load Judge Name from login session
const loadJudgeInfo = () => {
  try {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null
    const stored = user || JSON.parse(localStorage.getItem('user') || '{}')
    if (stored) {
      const fullName = [stored.firstName, stored.lastName].filter(Boolean).join(' ')
      judgeName.value = (fullName || stored.name || stored.username || 'JUDGE').toUpperCase()
    }
  } catch (err) {
    console.warn('Could not read user info:', err)
  }
}

// Dynamic font sizing
const getTitleClasses = (name = '') => {
  const len = name.length
  if (len > 18) {
    return 'text-[11.5px] sm:text-[12.5px] leading-[1.1] tracking-tight line-clamp-2 max-w-[96%]'
  } else if (len > 13) {
    return 'text-[13.5px] sm:text-[14.5px] leading-tight tracking-normal whitespace-nowrap'
  } else if (len > 8) {
    return 'text-[15px] sm:text-[16.5px] leading-none tracking-wide whitespace-nowrap'
  } else {
    return 'text-[18px] sm:text-[20px] leading-none tracking-wider whitespace-nowrap'
  }
}

// Load dynamic data from judgeService
const loadDashboardData = async () => {
  isLoading.value = true
  try {
    const catData = await judgeService.getCategories()
    const fetchedCategories = Array.isArray(catData) ? catData : (catData?.categories || [])

    if (fetchedCategories.length > 0) {
      categories.value = sortCategories(fetchedCategories.map((item, idx) => ({
        ...item,
        name: (item.name || item.title || `Category ${idx + 1}`).toUpperCase(),
        image: (item.image && !item.image.includes('example.com')) ? item.image : mrMsLogo,
        isCurrentlyLive: false
      })).filter(category => !isHiddenCategory(category)))
    }

    const sheetResponse = await judgeService.getLiveSheet()
    const liveData = sheetResponse?.data || sheetResponse

    if (liveData && liveData.contestant) {
      const activeContestant = liveData.contestant
      const activeCategory = Array.isArray(liveData.category) ? liveData.category[0] : liveData.category

      categories.value = categories.value.map(cat => {
        const isMatch = activeCategory && (
          cat._id === activeCategory._id || 
          cat.id === activeCategory._id || 
          cat.name?.toLowerCase() === activeCategory.name?.toLowerCase()
        )

        return {
          ...cat,
          image: isMatch && activeContestant.image && !activeContestant.image.includes('example.com')
            ? activeContestant.image 
            : (cat.image || mrMsLogo),
          isCurrentlyLive: !!isMatch
        }
      })
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.warn('Dashboard fetch notice:', error.message || error)
    }
  } finally {
    isLoading.value = false
  }
}

const handleImageError = (cat) => {
  cat.image = mrMsLogo
}

const toggleLiveMode = () => {
  router.push({ name: 'JudgeLive' })
}

const selectCategory = (category) => {
  const catName = category.name || category.title || 'PLAYSUIT'
  const categoryIdentifier = category.id || category._id || catName.toLowerCase().replace(/\s+/g, '-')

  router.push({
    name: 'JudgeCategoryVote',
    params: { categoryId: categoryIdentifier },
    query: { category: catName }
  })
}

const handleGoBack = async () => {
  await logout()
  router.push('/login')
}

onMounted(() => {
  loadJudgeInfo()
  loadDashboardData()
})
</script>

<style scoped>
/* Prominent Glowing Welcome Subtitle */
.welcome-subtext {
  color: #38bdf8;
  letter-spacing: 0.4em;
  text-shadow: 
    0 0 8px rgba(56, 189, 248, 0.9),
    0 0 16px rgba(14, 165, 233, 0.6);
}

/* Neon Judge Name */
.welcome-judge-title {
  color: #ffffff;
  text-shadow: 
    0 0 12px rgba(56, 189, 248, 0.9),
    0 0 25px rgba(2, 62, 198, 0.8),
    0 0 45px rgba(2, 62, 198, 0.5);
  letter-spacing: 0.14em;
  -webkit-text-stroke: 1px rgba(56, 189, 248, 0.7);
}

/* Softer & legible Pill Badge Text */
.badge-text {
  color: #ffffff;
  letter-spacing: 0.08em;
  text-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.9),
    0 0 8px rgba(56, 189, 248, 0.7);
}
</style>