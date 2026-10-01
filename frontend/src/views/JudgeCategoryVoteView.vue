<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { judgeService } from '@/services/judgeService'
import { getCurrentUser } from '@/services/authService'
import starBg from '@/assets/img/star-bg.png'
import mrMsLogo from '@/assets/img/mr-ms-css-logo.png'

const router = useRouter()
const route = useRoute()

// ── State ─────────────────────────────────────────────────────────────
const isLiveMode = ref(true)
const isLoading = ref(true)
const activeFilter = ref('all')
const savingCandidateId = ref(null)

const selectedCategory = ref({ _id: '', name: 'PLAYSUIT' })
const criteriaList = ref([])
const candidates = ref([])

// Current Judge Info
const currentUser = getCurrentUser()
const judgeId = computed(() => currentUser?._id || currentUser?.id || 'default_judge')

// Scoped localStorage cache key (per judge and category)
const cacheKey = computed(() => {
  const catKey = selectedCategory.value._id || selectedCategory.value.name || route.params.categoryId || 'default_cat'
  return `judge_scores_${judgeId.value}_${catKey}`
})

function saveScoresToCache() {
  try {
    const scoreCache = {}
    candidates.value.forEach(c => {
      scoreCache[c.id] = c.scores
    })
    localStorage.setItem(cacheKey.value, JSON.stringify(scoreCache))
  } catch (err) {
    console.warn('Could not cache scores to localStorage:', err)
  }
}

function getCachedScores() {
  try {
    const raw = localStorage.getItem(cacheKey.value)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// Fallback Avatars
const fallbackAvatars = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
]

const filterTabs = [
  { id: 'all', label: 'None (Show All)' },
  { id: 'Pageant Male', label: 'Pageant Male' },
  { id: 'Pageant Female', label: 'Pageant Female' },
  { id: 'Musical Extravaganza', label: 'Musical Extravaganza' },
]

function isHexId(val) {
  return /^[0-9a-fA-F]{24}$/.test(String(val))
}

// ── Category Display Name ─────────────────────────────────────────────
const categoryDisplayName = computed(() => {
  if (route.query.category && !isHexId(route.query.category)) {
    return String(route.query.category).toUpperCase()
  }
  if (selectedCategory.value?.name) {
    return String(selectedCategory.value.name).toUpperCase()
  }
  const param = route.params.categoryId
  if (param && !isHexId(param)) {
    return String(param).replace(/[-_]/g, ' ').toUpperCase()
  }
  return 'PLAYSUIT'
})

// ── Filter Contestants by Group ───────────────────────────────────────
const filteredCandidates = computed(() => {
  if (activeFilter.value === 'all') return candidates.value
  return candidates.value.filter(c => {
    const gName = typeof c.group === 'object' ? c.group?.name : c.group
    return gName?.toLowerCase() === activeFilter.value.toLowerCase()
  })
})

const toggleLiveMode = () => {
  // When switching Live Mode ON, navigate to the Live Page
  router.push({
    name: 'JudgeLive',
    query: { category: categoryDisplayName.value }
  })
}
// ── Data Initialization (API Contract + Local Hydration) ─────────────
async function initializeScoresheet() {
  isLoading.value = true
  try {
    const routeCategoryParam = route.params.categoryId || route.query.categoryId || route.query.category

    // 1. Fetch Categories & Rubrics (GET /api/v1/categories)
    let categories = []
    try {
      const catRes = await judgeService.getCategories()
      categories = catRes?.data || catRes || []
    } catch (e) {
      console.warn('Could not fetch categories list:', e)
    }

    let matchedCat = null
    if (categories.length > 0 && routeCategoryParam) {
      matchedCat = categories.find(
        c => c._id === routeCategoryParam || 
             c.name?.toLowerCase() === String(routeCategoryParam).toLowerCase()
      )
    }

    // 2. Fetch Live Sheet (GET /api/v1/scores/live-sheet)
    let liveSheetData = null
    try {
      const liveRes = await judgeService.getLiveSheet()
      liveSheetData = liveRes?.data || liveRes
    } catch (e) {
      console.warn('Could not fetch live sheet:', e)
    }

    if (!matchedCat && liveSheetData?.category) {
      matchedCat = Array.isArray(liveSheetData.category) ? liveSheetData.category[0] : liveSheetData.category
    }

    if (matchedCat) {
      selectedCategory.value = {
        _id: matchedCat._id,
        name: matchedCat.name
      }

      if (Array.isArray(matchedCat.rubrics) && matchedCat.rubrics.length > 0) {
        criteriaList.value = matchedCat.rubrics.map(r => ({
          id: r._id,
          label: r.name,
          max: r.maxPoints || r.maxScore || 40
        }))
      }
    }

    // Fallback rubrics if none returned
    if (criteriaList.value.length === 0) {
      criteriaList.value = [
        { id: '65f8a123b0a9c12345678918', label: 'Adherence & Neatness', max: 50 },
        { id: '65f8a123b0a9c12345678919', label: 'Bearing & Deportment', max: 50 }
      ]
    }

    // 3. Map Live Sheet Scores (for active contestant)
    const liveScoresMap = {}
    if (liveSheetData?.existingScores && Array.isArray(liveSheetData.existingScores)) {
      liveSheetData.existingScores.forEach(item => {
        liveScoresMap[item.rubricsId] = item.score
      })
    }

    // 4. Fetch All Contestants (GET /api/v1/contestants)
    let contestantList = []
    try {
      const contRes = await judgeService.getContestants()
      contestantList = contRes?.data || contRes || []
    } catch (e) {
      console.warn('Could not fetch contestants list:', e)
    }

    if (!Array.isArray(contestantList) || contestantList.length === 0) {
      if (liveSheetData?.contestant) {
        contestantList = [liveSheetData.contestant]
      }
    }

    // 5. Hydrate from Cache and Server
    const cachedScores = getCachedScores()

    candidates.value = contestantList.map((c, idx) => {
      const isLiveContestant = liveSheetData?.contestant && 
        (c._id === liveSheetData.contestant._id || c._id === '65f8a123b0a9c12345678920')

      const candidateCache = cachedScores[c._id || c.id] || {}
      const scoresObj = {}

      criteriaList.value.forEach(crit => {
        if (candidateCache[crit.id] !== undefined && candidateCache[crit.id] !== '') {
          scoresObj[crit.id] = Number(candidateCache[crit.id])
        } else if (isLiveContestant && liveScoresMap[crit.id] !== undefined) {
          scoresObj[crit.id] = Number(liveScoresMap[crit.id])
        } else {
          scoresObj[crit.id] = ''
        }
      })

      let avatarUrl = c.image
      if (!avatarUrl || avatarUrl.includes('example.com')) {
        avatarUrl = fallbackAvatars[idx % fallbackAvatars.length]
      }

      const groupName = typeof c.group === 'object' ? c.group?.name : c.group

      return {
        id: c._id || `c-${idx}`,
        name: c.name || 'Candidate Name',
        label: c.label || '1st Year',
        group: groupName || 'Pageant Male',
        avatar: avatarUrl,
        yearDotColor: (c.label || '').includes('2nd') ? 'bg-red-500' : 'bg-yellow-400',
        scores: scoresObj
      }
    })

    saveScoresToCache()
  } catch (error) {
    console.error('Scoresheet load error:', error)
  } finally {
    isLoading.value = false
  }
}

// ── Submit Score (POST /api/v1/scores/submit + Local Cache) ───────────
async function onScoreInput(candidate, criterionId, max) {
  let val = candidate.scores[criterionId]

  if (val === '' || val === null || val === undefined) {
    candidate.scores[criterionId] = ''
    saveScoresToCache()
    return
  }

  val = Number(val)
  if (isNaN(val) || val < 0) {
    candidate.scores[criterionId] = 0
  } else if (val > max) {
    candidate.scores[criterionId] = max
  }

  saveScoresToCache()

  savingCandidateId.value = candidate.id
  const rubricsScorePayload = criteriaList.value
    .filter(crit => candidate.scores[crit.id] !== '' && candidate.scores[crit.id] !== undefined)
    .map(crit => ({
      rubricsId: crit.id,
      score: Number(candidate.scores[crit.id])
    }))

  try {
    await judgeService.submitScore({
      categoryId: selectedCategory.value._id || '65f8a123b0a9c12345678910',
      contestantId: candidate.id,
      rubricsScore: rubricsScorePayload
    })
  } catch (err) {
    console.warn('Score submission error / saved in local cache:', err)
  } finally {
    setTimeout(() => {
      savingCandidateId.value = null
    }, 400)
  }
}

function handleImageError(e, idx) {
  e.target.src = fallbackAvatars[idx % fallbackAvatars.length]
}

function goBack() {
  router.push('/judge/dashboard')
}

function formatScore(val) {
  if (val === '' || val === null || val === undefined) return ''
  const num = Number(val)
  return isNaN(num) ? '' : num < 10 && num >= 0 ? `0${num}` : `${num}`
}

onMounted(() => {
  initializeScoresheet()
})
</script>

<template>
  <div 
    class="min-h-screen relative w-full text-white font-sans flex flex-col select-none overflow-x-hidden selection:bg-blue-600 selection:text-white"
    style="background: linear-gradient(180deg, #01010D 28%, #020333 93%);"
  >
    <!-- Background Star Image -->
    <div 
      class="fixed inset-0 pointer-events-none bg-no-repeat bg-[center_top] bg-[length:140%_auto] md:bg-[length:115%_auto] opacity-90 z-0"
      :style="{ backgroundImage: `url(${starBg})` }"
    ></div>

    <!-- ── FULL-WIDTH TOP BAR NAVIGATION (Exact Dashboard Placement: px-8 py-6 w-full) ── -->
    <header class="relative z-10 flex items-center justify-between px-8 py-6 w-full">
      <!-- Go Back -->
      <button 
        @click="goBack"
        class="flex items-center gap-2 text-white/90 hover:text-white font-medium text-lg transition-colors cursor-pointer group"
      >
        <ChevronLeft class="w-6 h-6 transition-transform group-hover:-translate-x-1" />
        <span>Go back</span>
      </button>

      <!-- Live Mode Toggle (Exact Figma Colors & Gradient) -->
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
          <!-- Red Ball Indicator (#E00000) -->
          <div 
            class="w-[20px] h-[20px] rounded-full transition-all duration-300 flex items-center justify-center"
            :class="isLiveMode 
              ? 'translate-x-0 bg-[#E00000] shadow-[0_0_8px_#E00000]' 
              : 'translate-x-[36px] bg-slate-400 shadow-none'"
          >
            <span v-if="isLiveMode" class="w-1.5 h-1.5 rounded-full bg-white/80"></span>
          </div>
        </button>

        <span class="font-croparo text-xs sm:text-sm tracking-[0.2em] text-slate-200 uppercase select-none">
          LIVE MODE
        </span>
      </div>
    </header>

    <!-- ── MAIN CONTENT (Centered Max-W-6xl) ── -->
    <main class="relative z-10 flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">

      <!-- ── LOGO & CATEGORY TITLE BANNER ── -->
      <div class="flex flex-col items-center justify-center text-center mt-2 mb-8">
        <img 
          :src="mrMsLogo" 
          alt="Mr & Ms College of Computing Studies 2026" 
          class="h-28 sm:h-36 md:h-40 w-auto object-contain drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)] mb-2"
        />

        <!-- Category Title (Cyan Left -> Purple Right with Underlying Golden Aura) -->
        <div class="relative flex items-center justify-center mt-3 mb-3 select-none">
          <!-- Layer 1: Ambient Golden Glow Layer -->
          <span 
            class="neon-ambient-glow font-croparo text-3xl sm:text-5xl md:text-6xl tracking-widest uppercase text-center absolute select-none pointer-events-none"
            aria-hidden="true"
          >
            {{ categoryDisplayName }}
          </span>

          <!-- Layer 2: Main Gradient Neon Title -->
          <h1 
            class="neon-category-title font-croparo text-3xl sm:text-5xl md:text-6xl tracking-widest uppercase text-center relative z-10"
            :data-text="categoryDisplayName"
          >
            {{ categoryDisplayName }}
          </h1>
        </div>
      </div>

      <!-- ── FILTER PILLS ── -->
      <div class="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-8">
        <span class="text-sm md:text-base font-semibold text-gray-200 mr-1">
          Filter:
        </span>

        <button
          v-for="tab in filterTabs"
          :key="tab.id"
          @click="activeFilter = tab.id"
          class="px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm"
          :class="[
            activeFilter === tab.id
              ? 'bg-[#3A6BFF] text-white shadow-[0_0_12px_rgba(58,107,255,0.6)]'
              : 'bg-[#D9D9D9] text-[#1E293B] hover:bg-white'
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ── LOADING SPINNER ── -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-cyan-300">
        <div class="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="font-croparo text-sm mt-3 tracking-widest uppercase">Loading Scoresheet...</span>
      </div>

      <div v-else>
        <div class="overflow-x-auto pb-2">
          <table class="min-w-[980px] w-full table-fixed border-separate border-spacing-y-2 text-left">
            <thead>
              <tr class="rounded-t-xl overflow-hidden shadow-lg" style="background: linear-gradient(90deg, #FAD02C 0%, #D8BE36 28%, #1D4ED8 70%, #0047FF 100%);">
                <th class="w-[25%] px-3 py-3.5 text-left text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-black rounded-l-xl">
                  CANDIDATE
                </th>
                <th
                  v-for="criterion in criteriaList.slice(0, 5)"
                  :key="criterion.id"
                  class="w-[15%] px-2 py-3.5 text-center text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-white"
                >
                  <span class="block leading-tight">{{ criterion.label }}</span>
                  <span class="mt-1 block text-[10px] sm:text-[11px] font-semibold text-white/90">({{ criterion.max }})</span>
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="(candidate, idx) in filteredCandidates"
                :key="candidate.id"
                class="border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.006]"
                style="background: linear-gradient(90deg, #021B79 0%, #0529A8 40%, #001254 100%);"
              >
                <td class="w-[25%] px-3 py-3 sm:px-4 rounded-l-xl align-middle">
                  <div class="flex items-center gap-2.5 sm:gap-4 min-w-0">
                    <div class="relative w-11 h-13 sm:w-14 sm:h-16 shrink-0 rounded-lg overflow-hidden bg-gradient-to-b from-yellow-400 to-amber-600 p-0.5 shadow-md">
                      <img 
                        :src="candidate.avatar" 
                        :alt="candidate.name" 
                        @error="(e) => handleImageError(e, idx)"
                        class="w-full h-full object-cover object-top rounded-md"
                      />
                    </div>

                    <div class="flex flex-col min-w-0">
                      <div class="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
                        <span :class="['w-2 h-2 rounded-full shrink-0', candidate.yearDotColor]"></span>
                        <span class="truncate">{{ candidate.label }}</span>
                      </div>
                      <h2 class="text-sm sm:text-base font-bold text-white truncate drop-shadow">
                        {{ candidate.name }}
                      </h2>
                    </div>
                  </div>
                </td>

                <td
                  v-for="criterion in criteriaList.slice(0, 5)"
                  :key="criterion.id"
                  class="w-[15%] px-2 py-3 text-center align-middle"
                >
                  <div class="flex items-center justify-center gap-1 sm:gap-2">
                    <input
                      type="number"
                      min="0"
                      :max="criterion.max"
                      v-model.number="candidate.scores[criterion.id]"
                      @input="onScoreInput(candidate, criterion.id, criterion.max)"
                      :placeholder="formatScore(candidate.scores[criterion.id]) || '00'"
                      class="w-11 h-9 sm:w-16 sm:h-10 text-center font-bold text-sm sm:text-lg bg-[#00144D]/80 border border-blue-400/60 rounded-md text-white placeholder-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span class="text-xs sm:text-sm font-semibold text-gray-200 select-none">
                      / {{ criterion.max }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div 
          v-if="filteredCandidates.length === 0" 
          class="text-center py-12 text-gray-400 bg-blue-950/20 rounded-xl border border-blue-900/40 mt-3"
        >
          No candidates found in this filter category.
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
/* 
  Figma Linear Gradient:
  LEFT (0%):    #00FFFB (Cyan / Aqua)
  MID (55%):    #3B82F6 (Electric Blue)
  RIGHT (100%): #7D1F59 (Purple / Magenta)
*/

/* 1. Underlying Golden Neon Halo */
.neon-ambient-glow {
  color: #FACC15;
  filter: blur(14px);
  opacity: 0.85;
  transform: scale(1.02);
  z-index: 1;
}

/* 2. Main Title: Left Cyan -> Right Purple with outer electrical drop-shadow */
.neon-category-title {
  background: linear-gradient(90deg, #00FFFB 0%, #3B82F6 55%, #7D1F59 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  position: relative;
  /* Left cyan glow + center gold warmth + right magenta glow */
  filter: drop-shadow(-8px 0 14px rgba(0, 255, 251, 0.9))
          drop-shadow(0 0 20px rgba(234, 179, 8, 0.75))
          drop-shadow(8px 0 16px rgba(125, 31, 89, 0.8));
}

/* 3. Inline hollow stroke layer for the dual-tube neon effect */
.neon-category-title::before {
  content: attr(data-text);
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #00FFFB 0%, #60A5FA 55%, #A82D77 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  -webkit-text-stroke: 1.2px transparent;
  z-index: -1;
  pointer-events: none;
}
</style>