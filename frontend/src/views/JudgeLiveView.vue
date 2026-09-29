<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { judgeService } from '@/services/judgeService'
import { getCurrentUser } from '@/services/authService'
import starBg from '@/assets/img/live-mode-bg.png'
import mrMsLogo from '@/assets/img/logo.png.png'
import podiumImg from '@/assets/img/podium.png'

const router = useRouter()
const route = useRoute()

// ── State ─────────────────────────────────────────────────────────────
const isLiveMode = ref(true)
const isLoading = ref(true)
let pollingTimer = null

const liveCategory = ref({ _id: '', name: 'PLAYSUIT' })
const allContestants = ref([])
const activeIndex = ref(0)
const criteriaList = ref([])
const contestantScores = ref({})

// Pageant Cutout Fallbacks
const pageantModels = [
  'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
]

const currentUser = getCurrentUser()
const judgeId = computed(() => currentUser?._id || currentUser?.id || 'default_judge')

const activeContestant = computed(() => {
  return allContestants.value[activeIndex.value] || null
})

const nextContestant = computed(() => {
  if (allContestants.value.length < 2) return null
  const nextIdx = (activeIndex.value + 1) % allContestants.value.length
  return allContestants.value[nextIdx]
})

const thirdContestant = computed(() => {
  if (allContestants.value.length < 3) return null
  const thirdIdx = (activeIndex.value + 2) % allContestants.value.length
  return allContestants.value[thirdIdx]
})

// ── Live Sheet Polling ────────────────────────────────────────────────
async function fetchLiveStatus() {
  try {
    if (allContestants.value.length === 0) {
      try {
        const contRes = await judgeService.getContestants()
        const rawList = contRes?.data || contRes || []
        if (Array.isArray(rawList) && rawList.length > 0) {
          allContestants.value = rawList.map((c, i) => ({
            _id: c._id || `c-${i}`,
            name: c.name || 'Jopeta Mari',
            label: c.label || '1ST YEAR (1)',
            group: (typeof c.group === 'object' ? c.group?.name : c.group) || 'PAGEANT MALE',
            image: c.image && !c.image.includes('example.com') ? c.image : pageantModels[i % pageantModels.length]
          }))
        }
      } catch (_) {}
    }

    const res = await judgeService.getLiveSheet()
    const liveData = res?.data?.data || res?.data || res

    if (liveData?.category) {
      const cat = Array.isArray(liveData.category) ? liveData.category[0] : liveData.category
      if (cat) {
        liveCategory.value = {
          _id: cat._id || cat.id,
          name: (cat.name || 'PLAYSUIT').toUpperCase()
        }

        if (Array.isArray(cat.rubrics) && cat.rubrics.length > 0) {
          criteriaList.value = cat.rubrics.map(r => ({
            id: r._id,
            label: r.name,
            max: r.maxPoints || r.maxScore || 40
          }))
        }
      }
    }

    if (criteriaList.value.length === 0) {
      criteriaList.value = [
        { id: '65f8a123b0a9c12345678911', label: 'Fitness & Form', max: 40 },
        { id: '65f8a123b0a9c12345678912', label: 'Stage Presence', max: 40 },
        { id: '65f8a123b0a9c12345678913', label: 'Poise & Bearing', max: 20 },
      ]
    }

    if (liveData?.contestant) {
      const liveC = liveData.contestant

      if (allContestants.value.length === 0) {
        allContestants.value = [
          {
            _id: liveC._id,
            name: liveC.name || 'Jopeta Mari',
            label: liveC.label || '1ST YEAR (1)',
            group: (typeof liveC.group === 'object' ? liveC.group?.name : liveC.group) || 'PAGEANT MALE',
            image: liveC.image && !liveC.image.includes('example.com') ? liveC.image : pageantModels[0]
          },
          {
            _id: 'c-next-1',
            name: 'Juan Dela Cruz',
            label: '2ND YEAR (2)',
            group: 'PAGEANT MALE',
            image: pageantModels[1]
          },
          {
            _id: 'c-next-2',
            name: 'Mark Anthony',
            label: '3RD YEAR (3)',
            group: 'PAGEANT MALE',
            image: pageantModels[2]
          }
        ]
      }

      const idx = allContestants.value.findIndex(c => c._id === liveC._id)
      if (idx !== -1 && idx !== activeIndex.value) {
        activeIndex.value = idx
      }

      const scoresObj = {}
      criteriaList.value.forEach(crit => {
        scoresObj[crit.id] = ''
      })

      if (Array.isArray(liveData.existingScores)) {
        liveData.existingScores.forEach(item => {
          scoresObj[item.rubricsId] = item.score
        })
      }

      try {
        const cacheKey = `judge_scores_${judgeId.value}_${liveCategory.value._id}`
        const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
        if (cached[allContestants.value[activeIndex.value]?._id]) {
          Object.assign(scoresObj, cached[allContestants.value[activeIndex.value]._id])
        }
      } catch (_) {}

      contestantScores.value = scoresObj
    }
  } catch (err) {
    console.warn('Polling error:', err)
  } finally {
    isLoading.value = false
  }
}

async function onScoreInput(critId, max) {
  let val = contestantScores.value[critId]
  if (val === '' || val === null || val === undefined) return

  val = Number(val)
  if (isNaN(val) || val < 0) {
    contestantScores.value[critId] = 0
  } else if (val > max) {
    contestantScores.value[critId] = max
  }

  if (activeContestant.value) {
    try {
      const cacheKey = `judge_scores_${judgeId.value}_${liveCategory.value._id}`
      const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')
      cached[activeContestant.value._id] = { ...contestantScores.value }
      localStorage.setItem(cacheKey, JSON.stringify(cached))
    } catch (_) {}

    const rubricsScorePayload = criteriaList.value
      .filter(crit => contestantScores.value[crit.id] !== '' && contestantScores.value[crit.id] !== undefined)
      .map(crit => ({
        rubricsId: crit.id,
        score: Number(contestantScores.value[crit.id])
      }))

    try {
      await judgeService.submitScore({
        categoryId: liveCategory.value._id || '65f8a123b0a9c12345678910',
        contestantId: activeContestant.value._id,
        rubricsScore: rubricsScorePayload
      })
    } catch (err) {
      console.warn('Live score submit notice:', err)
    }
  }
}

function handleImageError(e, fallbackIdx = 0) {
  e.target.src = pageantModels[fallbackIdx % pageantModels.length]
}

function toggleLiveMode() {
  isLiveMode.value = false
  const categoryIdentifier = liveCategory.value._id || route.query.category || 'playsuit'
  router.push({
    name: 'JudgeCategoryVote',
    params: { categoryId: categoryIdentifier },
    query: { category: liveCategory.value.name }
  })
}

onMounted(() => {
  fetchLiveStatus()
  pollingTimer = setInterval(fetchLiveStatus, 3000)
})

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer)
})
</script>

<template>
  <div 
    class="min-h-[100dvh] relative w-full overflow-hidden text-white font-sans flex flex-col select-none"
    style="background: linear-gradient(180deg, #01010D 20%, #020333 90%);"
  >
    <!-- Background Star Image Overlay -->
    <div 
      class="absolute inset-0 pointer-events-none bg-no-repeat bg-[center_top] bg-[length:200%_auto] md:bg-[length:115%_auto] opacity-90 z-0"
      :style="{ backgroundImage: `url(${starBg})` }"
    ></div>

    <!-- ── TOP BAR (Full Width Header) ── -->
    <header class="relative z-50 w-full flex flex-wrap items-start justify-between px-4 sm:px-8 md:px-12 pt-4 sm:pt-6">
      
      <!-- Top Left: MR & MS CCS Logo -->
      <router-link to="/judge/dashboard" class="cursor-pointer group block z-10">
        <img 
          :src="mrMsLogo" 
          alt="Mr & Ms CCS" 
          class="h-12 sm:h-16 md:h-24 lg:h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.25)] group-hover:scale-105 transition-transform"
        />
      </router-link>

      <!-- Center: Now Showing Header (Absolute Center on Desktop, Normal flow on mobile) -->
      <div class="absolute left-1/2 -translate-x-1/2 top-4 sm:top-6 md:top-10 lg:top-12 flex flex-col items-center text-center w-full max-w-[200px] sm:max-w-md pointer-events-none z-0">
        <span class="text-[10px] sm:text-xs md:text-sm text-gray-300 font-medium tracking-[0.25em] flex items-center gap-1.5 mb-1 sm:mb-1.5 mt-10 sm:mt-0">
          <span class="text-[10px] sm:text-xs">✦</span> Now Showing
        </span>
        <h1 
          class="font-croparo text-xl sm:text-3xl md:text-5xl lg:text-6xl tracking-widest uppercase text-transparent bg-clip-text"
          style="
            background-image: linear-gradient(90deg, #7D1F59 0%, #00FFFB 100%);
            -webkit-text-stroke: 1px rgba(255, 255, 255, 0.35);
            filter: drop-shadow(0 0 8px rgba(125, 31, 89, 0.6)) drop-shadow(0 0 15px rgba(0, 255, 251, 0.5));
          "
        >
          {{ liveCategory.name }}
        </h1>
      </div>

      <!-- Top Right: Live Mode Capsule Switch -->
      <div class="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 pt-1 z-10">
        <button 
          @click="toggleLiveMode" 
          type="button"
          class="relative w-[50px] sm:w-[62px] h-[22px] sm:h-[26px] rounded-full p-[3px] flex items-center cursor-pointer transition-all duration-300 border border-blue-400/40 shadow-[0_0_12px_rgba(1,30,96,0.5)] scale-90 sm:scale-100 origin-right sm:origin-center"
          style="background: linear-gradient(90deg, #FFFFFF 0%, #011E60 100%);"
        >
          <div 
            class="w-[16px] sm:w-[20px] h-[16px] sm:h-[20px] rounded-full transition-all duration-300 flex items-center justify-center translate-x-[26px] sm:translate-x-[36px] bg-[#E00000] shadow-[0_0_8px_#E00000]"
          >
            <span class="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-white animate-ping"></span>
          </div>
        </button>

        <span class="font-croparo text-[10px] sm:text-xs md:text-sm tracking-[0.2em] text-slate-200 uppercase select-none text-right">
          LIVE<br class="block sm:hidden"/> MODE
        </span>
      </div>
    </header>

    <!-- ── STAGE VIEWPORT ── -->
    <main class="relative z-10 flex-1 w-full h-full flex flex-col items-center justify-end overflow-hidden pb-4 md:pb-0">

      <!-- ── LEFT: SCORE SHEET RUBRICS CARDS ── -->
      <div class="absolute left-0 top-[32%] sm:top-[38%] md:top-[42%] -translate-y-1/2 z-40 flex flex-col gap-1.5 sm:gap-2 md:gap-2.5 pointer-events-none">
        <h2 
          class="font-croparo text-sm sm:text-lg md:text-xl tracking-widest uppercase mb-0.5 pl-4 sm:pl-8 text-transparent bg-clip-text font-bold"
          style="background-image: linear-gradient(to right, #ABFCFE 0%, #FEB301 36%, #078EE4 61%, #999999 100%); filter: drop-shadow(0 0 10px rgba(7, 142, 228, 0.4));"
        >
          SCORE SHEET
        </h2>

        <!-- Rubric Card 1 -->
        <div 
          v-if="criteriaList[0]"
          class="pointer-events-auto w-[220px] sm:w-[250px] md:w-[270px] rounded-r-xl md:rounded-r-2xl py-1.5 sm:py-2 md:py-2.5 px-3 sm:pl-8 sm:pr-5 flex items-center justify-between border-t border-b border-r border-blue-400/40 shadow-[0_8px_25px_rgba(2,25,95,0.7)] backdrop-blur-md"
          style="background: linear-gradient(90deg, rgba(8, 26, 92, 0.92) 0%, rgba(13, 44, 130, 0.85) 100%);"
        >
          <span class="text-xs sm:text-sm md:text-base font-semibold text-gray-100 truncate pr-2">
            {{ criteriaList[0].label }}
          </span>
          <div class="flex items-center gap-1 shrink-0">
            <input 
              type="number"
              min="0"
              :max="criteriaList[0].max"
              v-model.number="contestantScores[criteriaList[0].id]"
              @input="onScoreInput(criteriaList[0].id, criteriaList[0].max)"
              placeholder="___"
              class="w-8 sm:w-10 text-center font-bold text-xs sm:text-base bg-transparent border-b border-cyan-400 text-white focus:outline-none focus:border-yellow-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span class="text-[10px] sm:text-xs font-semibold text-gray-300">
              /{{ criteriaList[0].max }}
            </span>
          </div>
        </div>

        <!-- Rubric Card 2 -->
        <div 
          v-if="criteriaList[1]"
          class="pointer-events-auto w-[240px] sm:w-[300px] md:w-[330px] rounded-r-xl md:rounded-r-2xl py-1.5 sm:py-2 md:py-2.5 px-3 sm:pl-8 sm:pr-5 flex items-center justify-between border-t border-b border-r border-blue-400/40 shadow-[0_8px_25px_rgba(2,25,95,0.7)] backdrop-blur-md"
          style="background: linear-gradient(90deg, rgba(8, 26, 92, 0.92) 0%, rgba(13, 44, 130, 0.85) 100%);"
        >
          <span class="text-xs sm:text-sm md:text-base font-semibold text-gray-100 truncate pr-2">
            {{ criteriaList[1].label }}
          </span>
          <div class="flex items-center gap-1 shrink-0">
            <input 
              type="number"
              min="0"
              :max="criteriaList[1].max"
              v-model.number="contestantScores[criteriaList[1].id]"
              @input="onScoreInput(criteriaList[1].id, criteriaList[1].max)"
              placeholder="___"
              class="w-8 sm:w-10 text-center font-bold text-xs sm:text-base bg-transparent border-b border-cyan-400 text-white focus:outline-none focus:border-yellow-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span class="text-[10px] sm:text-xs font-semibold text-gray-300">
              /{{ criteriaList[1].max }}
            </span>
          </div>
        </div>

        <!-- Rubric Card 3 -->
        <div 
          v-if="criteriaList[2]"
          class="pointer-events-auto w-[260px] sm:w-[360px] md:w-[400px] rounded-r-xl md:rounded-r-2xl py-1.5 sm:py-2 md:py-2.5 px-3 sm:pl-8 sm:pr-5 flex items-center justify-between border-t border-b border-r border-blue-400/40 shadow-[0_8px_25px_rgba(2,25,95,0.7)] backdrop-blur-md"
          style="background: linear-gradient(90deg, rgba(8, 26, 92, 0.92) 0%, rgba(13, 44, 130, 0.85) 100%);"
        >
          <span class="text-xs sm:text-sm md:text-base font-semibold text-gray-100 truncate pr-2">
            {{ criteriaList[2].label }}
          </span>
          <div class="flex items-center gap-1 shrink-0">
            <input 
              type="number"
              min="0"
              :max="criteriaList[2].max"
              v-model.number="contestantScores[criteriaList[2].id]"
              @input="onScoreInput(criteriaList[2].id, criteriaList[2].max)"
              placeholder="___"
              class="w-8 sm:w-10 text-center font-bold text-xs sm:text-base bg-transparent border-b border-cyan-400 text-white focus:outline-none focus:border-yellow-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span class="text-[10px] sm:text-xs font-semibold text-gray-300">
              /{{ criteriaList[2].max }}
            </span>
          </div>
        </div>
      </div>

      <!-- ── CENTER: ACTIVE CONTESTANT ON PODIUM (z-30) ── -->
      <div class="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end z-30 pointer-events-none">
        
        <Transition name="contestant-fade" mode="out-in">
          <div 
            v-if="activeContestant"
            :key="activeContestant._id"
            class="relative z-20 flex flex-col items-center justify-end mb-[-40px] sm:mb-[-58px] md:mb-[-82px]"
          >
            <!-- Responsive heights and widths for candidate -->
            <div class="relative max-w-[220px] sm:max-w-[360px] md:max-w-[420px] h-[320px] sm:h-[470px] md:h-[520px] flex items-end justify-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.92)]">
              <img 
                :src="activeContestant.image" 
                :alt="activeContestant.name" 
                @error="(e) => handleImageError(e, 0)"
                class="w-full h-full object-contain object-bottom pointer-events-auto"
              />
            </div>
            <!-- Shadow Grounding -->
            <div class="w-32 sm:w-60 md:w-72 h-2 sm:h-3.5 bg-black/70 blur-sm rounded-full mt-[-4px] sm:mt-[-8px] pointer-events-none"></div>
          </div>
        </Transition>

        <!-- Responsive Podium -->
        <div class="relative w-[300px] sm:w-[480px] md:w-[620px] z-10 -mb-1 sm:-mb-2 flex flex-col justify-end">
          <img 
            :src="podiumImg" 
            alt="Podium Pedestal" 
            class="w-full h-auto object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.95)] pointer-events-none"
          />

          <!-- Text overlay perfectly scaled -->
          <Transition name="text-fade" mode="out-in">
            <div 
              v-if="activeContestant"
              :key="activeContestant._id"
              class="absolute inset-x-0 bottom-1.5 sm:bottom-3 md:bottom-4 z-30 flex flex-col items-center text-center px-2 sm:px-4 pointer-events-auto"
            >
              <h2 
                class="font-croparo text-lg sm:text-3xl md:text-[42px] font-black uppercase text-white tracking-widest leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.9)] mb-0.5 sm:mb-1"
                style="text-shadow: 0 0 18px rgba(0, 255, 251, 0.75), 0 2px 8px rgba(0, 0, 0, 0.95);"
              >
                {{ activeContestant.name }}
              </h2>

              <div class="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                <span class="font-croparo text-[8px] sm:text-xs md:text-sm font-bold tracking-[0.2em] text-cyan-300 uppercase px-2 sm:px-3 py-0.5 rounded-full bg-blue-950/85 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,255,251,0.5)] backdrop-blur-md">
                  {{ activeContestant.label }}
                </span>
                <span class="font-croparo text-[8px] sm:text-[10px] md:text-xs font-semibold tracking-[0.2em] text-slate-300 uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  {{ activeContestant.group }}
                </span>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- ── RIGHT: NEXT CONTESTANT (z-20) ── -->
      <div class="absolute right-1 sm:right-10 md:right-20 lg:right-24 bottom-[28%] sm:bottom-12 md:bottom-14 z-20 flex flex-col items-center text-center pointer-events-none transition-all duration-700">
        
        <div 
          v-if="nextContestant" 
          class="relative mb-1 sm:mb-2 opacity-85 flex flex-col items-center"
        >
          <div class="relative flex flex-col items-center">
            <div class="absolute -top-3 z-30 flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 rounded-full bg-cyan-950/95 border border-cyan-400/60 shadow-[0_0_12px_rgba(0,255,251,0.6)] backdrop-blur-md scale-[0.65] sm:scale-100 origin-bottom animate-badge-fade">
              <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span class="text-[10px] font-bold tracking-[0.2em] text-cyan-300 uppercase whitespace-nowrap">
                UPCOMING NEXT
              </span>
            </div>

            <img 
              :src="nextContestant.image" 
              :alt="nextContestant.name" 
              @error="(e) => handleImageError(e, 1)"
              class="max-w-[110px] sm:max-w-[150px] md:max-w-[195px] lg:max-w-[215px] h-[170px] sm:h-[260px] md:h-[300px] lg:h-[340px] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.7)]"
            />
          </div>
        </div>

        <Transition name="subtle-fade" mode="out-in">
          <div 
            v-if="nextContestant"
            :key="nextContestant._id"
            class="flex flex-col items-center opacity-70 hover:opacity-90 transition-opacity duration-500 max-w-[115px] sm:max-w-[220px]"
          >
            <h3 class="font-croparo text-[10px] sm:text-base md:text-xl font-bold uppercase text-slate-200 tracking-wider leading-tight mb-0.5 sm:mb-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] text-center">
              {{ nextContestant.name }}
            </h3>
            <div class="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
              <span class="font-croparo text-[7px] sm:text-[10px] md:text-[11px] font-bold tracking-[0.15em] text-cyan-300 uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-400/40 shadow-[0_0_8px_rgba(0,255,251,0.3)]">
                {{ nextContestant.label }}
              </span>
              <span class="font-croparo text-[6px] sm:text-[9px] md:text-[10px] font-medium tracking-[0.15em] text-slate-400/90 uppercase text-center mt-0.5 sm:mt-0">
                {{ nextContestant.group }}
              </span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- ── BACKGROUND: THIRD / DISTANT CONTESTANT (z-10 - FIXED VISIBILITY) ── -->
      <!-- Pushed higher up on the right side behind the Next Contestant -->
      <div 
        v-if="thirdContestant" 
        class="absolute right-[5%] sm:right-[15%] md:left-[64%] bottom-[45%] sm:bottom-[50%] lg:bottom-72 pointer-events-none opacity-40 md:opacity-50 blur-[1px] md:blur-[0.4px] transition-all duration-700 z-10 origin-bottom scale-[0.6] sm:scale-[0.8] md:scale-100"
      >
        <img 
          :src="thirdContestant.image" 
          :alt="thirdContestant.name" 
          @error="(e) => handleImageError(e, 2)"
          class="max-w-[90px] sm:max-w-[120px] md:max-w-[160px] h-[150px] sm:h-[220px] md:h-[260px] object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
        />
      </div>

    </main>
  </div>
</template>

<style scoped>
.contestant-fade-enter-active,
.contestant-fade-leave-active {
  transition: opacity 0.45s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.contestant-fade-enter-from {
  opacity: 0;
  transform: translateY(25px) scale(0.96);
}

.contestant-fade-leave-to {
  opacity: 0;
  transform: translateY(-25px) scale(0.96);
}

.text-fade-enter-active,
.text-fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.text-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.text-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.subtle-fade-enter-active,
.subtle-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.subtle-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.subtle-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes badgeFadePulse {
  0%, 100% {
    opacity: 1;
    transform: translateY(0);
    filter: drop-shadow(0 0 12px rgba(0, 255, 251, 0.6));
  }
  50% {
    opacity: 0.15;
    transform: translateY(-2px);
    filter: drop-shadow(0 0 2px rgba(0, 255, 251, 0.1));
  }
}

.animate-badge-fade {
  animation: badgeFadePulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>