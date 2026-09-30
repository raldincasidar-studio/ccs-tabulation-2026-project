<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// Dynamic Contestant Groups loaded from API
const filterTabs = ref([
  { id: 'all', label: 'None (Show All)' }
])

// Auto-sync polling timer
let autoSyncTimer = null

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

// ── Resilient Filter Matching ─────────────────────────────────────────
const filteredCandidates = computed(() => {
  if (activeFilter.value === 'all') return candidates.value

  const filterTarget = String(activeFilter.value).trim().toLowerCase()
  const activeTab = filterTabs.value.find(t => t.id === activeFilter.value)
  const tabName = (activeTab?.name || activeTab?.label || '').trim().toLowerCase()
  const tabId = (activeTab?.groupId || '').trim().toLowerCase()

  return candidates.value.filter(c => {
    const raw = c.rawGroup || c.group
    const candidateName = (typeof raw === 'object' ? (raw?.name || '') : String(raw || '')).trim().toLowerCase()
    const candidateId = (typeof raw === 'object' ? (raw?._id || raw?.id || '') : String(raw || '')).trim().toLowerCase()

    return (
      candidateName === filterTarget ||
      candidateId === filterTarget ||
      (tabName && candidateName === tabName) ||
      (tabId && candidateId === tabId)
    )
  })
})

const toggleLiveMode = () => {
  router.push({
    name: 'JudgeLive',
    query: { category: categoryDisplayName.value }
  })
}

// ── 1. Fetch Dynamic Groups ───────────────────────────────────────────
async function fetchContestantGroups() {
  try {
    const groups = await judgeService.getContestantGroups()
    if (Array.isArray(groups) && groups.length > 0) {
      filterTabs.value = [
        { id: 'all', label: 'None (Show All)' },
        ...groups.map(g => ({
          id: g.name || g._id,
          groupId: g._id,
          name: g.name,
          label: g.name || 'Group'
        }))
      ]
    }
  } catch (err) {
    console.warn('Could not fetch contestant groups dynamically:', err)
  }
}

// ── 2. Background Auto-Refetch (In-Place Score Sync) ──────────────────
async function loadCandidatesAndScores() {
  try {
    const serverScoresMap = {}

    // A. Fetch Live Sheet (Module 7.1)
    let liveSheetData = null
    try {
      const liveRes = await judgeService.getLiveSheet()
      liveSheetData = liveRes?.data || liveRes
      if (liveSheetData?.existingScores && Array.isArray(liveSheetData.existingScores)) {
        const liveContestantId = liveSheetData.contestant?._id || liveSheetData.contestant?.id
        if (liveContestantId) {
          serverScoresMap[liveContestantId] = {}
          liveSheetData.existingScores.forEach(item => {
            serverScoresMap[liveContestantId][item.rubricsId] = item.score
          })
        }
      }
    } catch (e) {
      console.warn('Live sheet fetch notice:', e)
    }

    // B. Fetch Contestants from API (Module 6.1)
    let contestantList = []
    try {
      const contRes = await judgeService.getContestants()
      contestantList = Array.isArray(contRes) ? contRes : (contRes?.data || [])
    } catch (e) {
      console.warn('Contestants fetch notice:', e)
    }

    if (contestantList.length === 0 && liveSheetData?.contestant) {
      contestantList = [liveSheetData.contestant]
    }

    const cachedScores = getCachedScores()
    const isUserTyping = !!savingCandidateId.value

    // If candidates are already rendered, update scores IN-PLACE to prevent losing focus
    if (candidates.value.length > 0 && contestantList.length > 0) {
      candidates.value.forEach(existingCandidate => {
        const serverCandidateScores = serverScoresMap[existingCandidate.id]
        if (serverCandidateScores) {
          criteriaList.value.forEach(crit => {
            const freshScore = serverCandidateScores[crit.id]
            // Only update if server returned a score and the judge isn't typing on this candidate
            if (freshScore !== undefined && freshScore !== '' && (!isUserTyping || existingCandidate.id !== savingCandidateId.value)) {
              existingCandidate.scores[crit.id] = Number(freshScore)
            }
          })
        }
      })
      saveScoresToCache()
      return
    }

    // Initial hydration if candidates list was empty
    candidates.value = contestantList.map((c, idx) => {
      const candidateId = c._id || c.id || `c-${idx}`
      const candidateCache = cachedScores[candidateId] || {}
      const candidateServerScores = serverScoresMap[candidateId] || {}
      const scoresObj = {}

      criteriaList.value.forEach(crit => {
        if (candidateServerScores[crit.id] !== undefined && candidateServerScores[crit.id] !== '') {
          scoresObj[crit.id] = Number(candidateServerScores[crit.id])
        } else if (candidateCache[crit.id] !== undefined && candidateCache[crit.id] !== '') {
          scoresObj[crit.id] = Number(candidateCache[crit.id])
        } else {
          scoresObj[crit.id] = ''
        }
      })

      let avatarUrl = c.image
      if (!avatarUrl || avatarUrl.includes('example.com')) {
        avatarUrl = fallbackAvatars[idx % fallbackAvatars.length]
      }

      const groupDisplay = typeof c.group === 'object' ? c.group?.name : c.group

      return {
        id: candidateId,
        name: c.name || 'Candidate Name',
        label: c.label || `${c.number ? '#' + c.number : 'Candidate'}`,
        group: groupDisplay || 'General',
        rawGroup: c.group,
        avatar: avatarUrl,
        yearDotColor: (c.label || '').includes('2nd') ? 'bg-red-500' : 'bg-yellow-400',
        scores: scoresObj
      }
    })

    saveScoresToCache()
  } catch (err) {
    console.error('Error auto-syncing scores:', err)
  }
}

// ── 3. Initial Setup & Polling Lifecycle ──────────────────────────────
async function initializeScoresheet() {
  isLoading.value = true
  try {
    const routeCategoryParam = route.params.categoryId || route.query.categoryId || route.query.category

    await fetchContestantGroups()

    let categories = []
    try {
      categories = await judgeService.getCategories()
    } catch (e) {
      console.warn('Could not fetch categories:', e)
    }

    let matchedCat = null
    if (categories.length > 0 && routeCategoryParam) {
      matchedCat = categories.find(
        c => c._id === routeCategoryParam || 
             c.name?.toLowerCase() === String(routeCategoryParam).toLowerCase()
      )
    }

    if (!matchedCat && categories.length > 0) {
      matchedCat = categories[0]
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
          max: r.maxPoints || 40
        }))
      }
    }

    if (criteriaList.value.length === 0) {
      criteriaList.value = [
        { id: '65f8a123b0a9c12345678911', label: 'Fitness & Form', max: 40 },
        { id: '65f8a123b0a9c12345678912', label: 'Stage Presence', max: 40 },
        { id: '65f8a123b0a9c12345678913', label: 'Poise & Bearing', max: 20 }
      ]
    }

    await loadCandidatesAndScores()
  } catch (error) {
    console.error('Scoresheet load error:', error)
  } finally {
    isLoading.value = false
  }
}

// Automatically refetches whenever a filter pill is clicked
async function handleFilterChange(tabId) {
  activeFilter.value = tabId
  await loadCandidatesAndScores()
}

// ── 4. Submit Score ───────────────────────────────────────────────────
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
    console.warn('Score saved in local cache:', err)
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

onMounted(async () => {
  await initializeScoresheet()

  // Background auto-sync every 3.5 seconds
  autoSyncTimer = setInterval(() => {
    // Only auto-sync when user isn't in the middle of typing a score
    if (!savingCandidateId.value) {
      loadCandidatesAndScores()
    }
  }, 3500)
})

onUnmounted(() => {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer)
  }
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

    <!-- ── TOP BAR NAVIGATION ── -->
    <header class="relative z-10 flex items-center justify-between px-8 py-6 w-full">
      <button 
        @click="goBack"
        class="flex items-center gap-2 text-white/90 hover:text-white font-medium text-lg transition-colors cursor-pointer group"
      >
        <ChevronLeft class="w-6 h-6 transition-transform group-hover:-translate-x-1" />
        <span>Go back</span>
      </button>

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

    <!-- ── MAIN CONTENT ── -->
    <main class="relative z-10 flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">

      <!-- ── LOGO & CATEGORY TITLE BANNER ── -->
      <div class="flex flex-col items-center justify-center text-center mt-2 mb-8">
        <img 
          :src="mrMsLogo" 
          alt="Mr & Ms College of Computing Studies 2026" 
          class="h-28 sm:h-36 md:h-40 w-auto object-contain drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)] mb-2"
        />

        <div class="relative flex items-center justify-center mt-3 mb-3 select-none">
          <span 
            class="neon-ambient-glow font-croparo text-3xl sm:text-5xl md:text-6xl tracking-widest uppercase text-center absolute select-none pointer-events-none"
            aria-hidden="true"
          >
            {{ categoryDisplayName }}
          </span>

          <h1 
            class="neon-category-title font-croparo text-3xl sm:text-5xl md:text-6xl tracking-widest uppercase text-center relative z-10"
            :data-text="categoryDisplayName"
          >
            {{ categoryDisplayName }}
          </h1>
        </div>
      </div>

      <!-- ── DYNAMIC FILTER PILLS & LIVE SYNC STATUS ── -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div class="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <span class="text-sm md:text-base font-semibold text-gray-200 mr-1">
            Filter:
          </span>

          <button
            v-for="tab in filterTabs"
            :key="tab.id"
            @click="handleFilterChange(tab.id)"
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

        <!-- Automatic Live Sync Status Badge -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/40 border border-blue-400/20 text-xs text-blue-300">
          <span class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          <span class="font-medium tracking-wide">Auto-syncing scores</span>
        </div>
      </div>

      <!-- ── LOADING SPINNER ── -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-cyan-300">
        <div class="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="font-croparo text-sm mt-3 tracking-widest uppercase">Loading Scoresheet...</span>
      </div>

      <div v-else>
        <!-- ── TABLE HEADER ── -->
        <div 
          class="w-full rounded-t-xl overflow-hidden shadow-lg grid grid-cols-12 items-center py-3.5 px-3 sm:px-6 text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-black"
          style="background: linear-gradient(90deg, #FAD02C 0%, #D8BE36 28%, #1D4ED8 70%, #0047FF 100%);"
        >
          <div class="col-span-5 sm:col-span-4 pl-1 sm:pl-2 text-black font-extrabold">
            Candidate
          </div>
          <div 
            class="col-span-7 sm:col-span-8 grid text-center text-white px-1"
            :class="criteriaList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
          >
            <span 
              v-for="criterion in criteriaList" 
              :key="criterion.id"
              class="px-1 leading-snug whitespace-normal"
            >
              {{ criterion.label }}
            </span>
          </div>
        </div>

        <!-- ── ALL CANDIDATES ROWS ── -->
        <div class="space-y-3 mt-3 relative">
          <div
            v-for="(candidate, idx) in filteredCandidates"
            :key="candidate.id"
            class="relative w-full rounded-2xl p-3 sm:p-4 grid grid-cols-12 items-center border border-blue-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.006]"
            style="background: linear-gradient(90deg, #021B79 0%, #0529A8 40%, #001254 100%);"
          >
            <!-- Candidate Info -->
            <div class="col-span-5 sm:col-span-4 flex items-center gap-2.5 sm:gap-4 pl-1">
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

            <!-- Scoring Inputs Columns -->
            <div 
              class="col-span-7 sm:col-span-8 grid gap-1.5 sm:gap-4 items-center"
              :class="criteriaList.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
            >
              <div 
                v-for="criterion in criteriaList" 
                :key="criterion.id"
                class="flex items-center justify-center gap-1 sm:gap-2"
              >
                <!-- Score Input Box -->
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
            </div>
          </div>

          <!-- Empty state -->
          <div 
            v-if="filteredCandidates.length === 0" 
            class="text-center py-12 text-gray-400 bg-blue-950/20 rounded-xl border border-blue-900/40"
          >
            No candidates found in this filter group.
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<style scoped>
.neon-ambient-glow {
  color: #FACC15;
  filter: blur(14px);
  opacity: 0.85;
  transform: scale(1.02);
  z-index: 1;
}

.neon-category-title {
  background: linear-gradient(90deg, #00FFFB 0%, #3B82F6 55%, #7D1F59 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  position: relative;
  filter: drop-shadow(-8px 0 14px rgba(0, 255, 251, 0.9))
          drop-shadow(0 0 20px rgba(234, 179, 8, 0.75))
          drop-shadow(8px 0 16px rgba(125, 31, 89, 0.8));
}

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