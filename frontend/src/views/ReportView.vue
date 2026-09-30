<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Printer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import api from '@/services/api.js'

const router = useRouter()
const selectedGroup = ref('None')
const contestantGroups = ref([])
const finalRankings = ref([])
const votingProgress = ref([])
const isLoading = ref(true)
const isRankingsLoading = ref(false)
const rankingsError = ref('')
const groupsError = ref('')
const isMobile = ref(false)
const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
const isMenuHidden = ref(false)

function updateViewportState() {
  const mobileMode = window.innerWidth < 768
  isMobile.value = mobileMode

  if (mobileMode) {
    isMobileSidebarOpen.value = false
    isSidebarCollapsed.value = false
    return
  }

  isMobileSidebarOpen.value = false
}

function handleScrollState() {
  if (!isMobile.value) {
    isMenuHidden.value = false
    return
  }

  isMenuHidden.value = (window.scrollY || window.pageYOffset) > 12
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

const categoryColumns = computed(() => {
  const categories = new Map()

  finalRankings.value.forEach(ranking => {
    ranking.categoryScores?.forEach(score => {
      if (!categories.has(score.categoryName)) {
        categories.set(score.categoryName, {
          name: score.categoryName,
          weight: score.weight
        })
      }
    })
  })

  return [...categories.values()]
})

const stars = [
  { left: '8%', top: '24%' },
  { left: '19%', top: '72%' },
  { left: '31%', top: '38%' },
  { left: '47%', top: '18%' },
  { left: '58%', top: '68%' },
  { left: '72%', top: '31%' },
  { left: '83%', top: '74%' },
  { left: '93%', top: '43%' }
]

function unwrapData(response) {
  return response?.data ?? response
}

function getScore(ranking, categoryName) {
  const score = ranking.categoryScores?.find(item => item.categoryName === categoryName)
  return score?.weightedScore ?? 0
}

async function fetchRankings() {
  isRankingsLoading.value = true
  rankingsError.value = ''

  try {
    if (selectedGroup.value !== 'None') {
      const response = await api.get('/reports/final-rankings', {
        params: { groupId: selectedGroup.value }
      })
      const report = unwrapData(response)
      finalRankings.value = Array.isArray(report?.rankings) ? report.rankings : []
      return
    }

    if (contestantGroups.value.length === 0) {
      finalRankings.value = []
      return
    }

    const reports = await Promise.all(contestantGroups.value.map(async group => {
      const response = await api.get('/reports/final-rankings', {
        params: { groupId: group._id }
      })
      return unwrapData(response)
    }))

    finalRankings.value = reports
      .flatMap(report => report?.rankings || [])
      .sort((left, right) => right.final_candidate_score - left.final_candidate_score)
      .map((ranking, index) => ({ ...ranking, rank: index + 1 }))
  } catch (error) {
    finalRankings.value = []
    rankingsError.value = error?.message || 'Unable to load final rankings.'
  } finally {
    isRankingsLoading.value = false
  }
}

async function loadReportData() {
  isLoading.value = true
  groupsError.value = ''

  const [groupsResult, progressResult] = await Promise.allSettled([
    api.get('/contestant-groups'),
    api.get('/reports/voting-progress')
  ])

  if (groupsResult.status === 'fulfilled') {
    const groups = unwrapData(groupsResult.value)
    contestantGroups.value = Array.isArray(groups) ? groups : []
  } else {
    contestantGroups.value = []
    groupsError.value = groupsResult.reason?.message || 'Unable to load contestant groups.'
  }

  if (progressResult.status === 'fulfilled') {
    const progress = unwrapData(progressResult.value)
    votingProgress.value = Array.isArray(progress) ? progress : []
  } else {
    votingProgress.value = []
  }

  await fetchRankings()
  isLoading.value = false
}

function printJudgeVotes() {
  window.print()
}

watch(selectedGroup, () => {
  if (!isLoading.value) fetchRankings()
})

onMounted(() => {
  updateViewportState()
  handleScrollState()
  window.addEventListener('resize', updateViewportState)
  window.addEventListener('scroll', handleScrollState, { passive: true })
  loadReportData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportState)
  window.removeEventListener('scroll', handleScrollState)
})
</script>

<template>
  <div class="admin-frame">
    <div
      class="admin-dashboard"
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }"
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
        active-item="REPORTS"
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
          <div class="report-content">
            <div class="mx-auto w-full max-w-7xl space-y-4">
      <header class="relative isolate flex h-32 items-start overflow-hidden rounded-xl bg-[#08056d] px-4 pt-3 text-white shadow-sm sm:px-5">
        <div
          class="pointer-events-none absolute inset-0 -z-10 opacity-70"
          style="background-image: radial-gradient(circle at 12% 32%, #fff 0 1px, transparent 2px), radial-gradient(circle at 34% 62%, #c7d2fe 0 1px, transparent 2px), radial-gradient(circle at 68% 16%, #fff 0 1px, transparent 2px), radial-gradient(circle at 88% 54%, #dbeafe 0 1px, transparent 2px)"
          aria-hidden="true"
        ></div>
        <svg class="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-40" viewBox="0 0 600 96" preserveAspectRatio="none" aria-hidden="true">
          <path d="M420 14 470 47 512 24M470 47 452 82M512 24 545 10" fill="none" stroke="#bfdbfe" stroke-width=".6" />
          <circle cx="420" cy="14" r="1.5" fill="#e0f2fe" />
          <circle cx="470" cy="47" r="1.5" fill="#e0f2fe" />
          <circle cx="512" cy="24" r="1.5" fill="#e0f2fe" />
          <circle cx="452" cy="82" r="1.5" fill="#e0f2fe" />
          <circle cx="545" cy="10" r="1.5" fill="#e0f2fe" />
        </svg>
        <span
          v-for="(star, index) in stars"
          :key="index"
          class="pointer-events-none absolute h-1 w-1 rounded-full bg-sky-100 shadow-[0_0_8px_2px_rgba(191,219,254,0.65)]"
          :style="star"
          aria-hidden="true"
        ></span>
        <h1 class="relative z-[1] font-croparo text-[34px] font-medium leading-none tracking-normal text-[#e4eaff] [text-shadow:0_0_7px_rgba(142,171,255,0.4)] uppercase max-[767px]:w-full max-[767px]:text-center max-[767px]:text-[clamp(1.2rem,4vw,2.125rem)] max-[767px]:tracking-[0.08em]">Final Ranking</h1>
      </header>

      <section aria-labelledby="ranking-title" class="space-y-8">
        <div class="flex min-h-[30px] flex-wrap items-center gap-3">
          <h2 id="ranking-title" class="shrink-0 text-base font-bold text-blue-900">Filter:</h2>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filter rankings by contestant group">
            <button
              type="button"
              class="rounded-full px-3 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:px-4"
              :class="selectedGroup === 'None' ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white' : 'bg-gray-200 text-slate-800 hover:bg-gray-300'"
              :aria-pressed="selectedGroup === 'None'"
              @click="selectedGroup = 'None'"
            >
              None (Show All)
            </button>
            <button
              v-for="group in contestantGroups"
              :key="group._id"
              type="button"
              class="rounded-full px-3 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:px-4"
              :class="selectedGroup === group._id ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white' : 'bg-gray-200 text-slate-800 hover:bg-gray-300'"
              :aria-pressed="selectedGroup === group._id"
              @click="selectedGroup = group._id"
            >
              {{ group.name }}
            </button>
          </div>
        </div>

        <p v-if="groupsError" class="text-sm font-medium text-red-700" role="alert">{{ groupsError }}</p>

        <div class="overflow-hidden rounded-md">
          <div class="overflow-x-auto">
            <table class="w-full min-w-max border-separate border-spacing-y-1.5 text-left text-base">
              <thead>
                <tr class="bg-gradient-to-r from-yellow-400 from-10% via-blue-700 to-blue-800">
                  <th scope="col" class="w-14 whitespace-nowrap rounded-l-md px-4 py-4 text-left font-normal text-gray-900">Rank</th>
                  <th scope="col" class="min-w-24 whitespace-nowrap px-4 py-4 text-left font-normal text-gray-900">Name</th>
                  <th scope="col" class="min-w-[90px] whitespace-nowrap px-4 py-4 text-center font-normal text-white">Final Weighted pts</th>
                  <th v-for="category in categoryColumns" :key="category.name" scope="col" class="min-w-24 whitespace-nowrap px-4 py-4 text-center font-normal text-white">
                    <span class="block">{{ category.name }}</span>
                    <span v-if="category.weight !== undefined" class="block">({{ category.weight }}%)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading || isRankingsLoading">
                  <td :colspan="3 + categoryColumns.length" class="px-5 py-8 text-center text-base font-medium text-slate-500">
                    <span class="inline-flex items-center gap-3" role="status">
                      <span class="h-5 w-5 animate-spin rounded-full border-2 border-blue-800 border-t-transparent"></span>
                      Loading final rankings...
                    </span>
                  </td>
                </tr>
                <tr v-else-if="rankingsError">
                  <td :colspan="3 + categoryColumns.length" class="px-5 py-8 text-center text-base font-medium text-red-700" role="alert">
                    {{ rankingsError }}
                  </td>
                </tr>
                <tr v-else-if="finalRankings.length === 0">
                  <td :colspan="3 + categoryColumns.length" class="px-5 py-8 text-center text-base text-slate-500">No rankings available for this group.</td>
                </tr>
                <tr v-for="ranking in finalRankings" v-else :key="ranking.contestantId" class="bg-gradient-to-r from-blue-700 via-blue-800 to-[#08056d] text-white">
                  <td class="rounded-l-md border-r-[8px] border-[#f7f9f8] bg-gradient-to-r from-blue-700 to-slate-400 px-2 py-1 text-center text-base font-bold tabular-nums">{{ ranking.rank }}</td>
                  <td class="min-w-24 rounded-l-md px-2 py-1">
                    <span class="flex items-center gap-1 text-base font-medium text-yellow-300"><span class="h-1 w-1 rounded-full bg-yellow-400"></span>{{ ranking.label }}</span>
                    <span class="mt-0.5 block text-base font-bold">{{ ranking.name }}</span>
                  </td>
                  <td class="px-2 py-1 text-center font-medium tabular-nums">{{ Number(ranking.final_candidate_score || 0).toFixed(1) }} pts</td>
                  <td v-for="category in categoryColumns" :key="category.name" class="px-2 py-1 text-center font-medium tabular-nums text-blue-50">
                    {{ Number(getScore(ranking, category.name)).toFixed(1) }} pts
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section aria-labelledby="progress-title" class="!mt-20 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-2">
          <h2 id="progress-title" class="text-base font-bold text-blue-950">Judge Voting Progress</h2>
          <button
            type="button"
            class="inline-flex w-fit items-center justify-center gap-2 rounded-sm bg-blue-950 px-6 py-2 text-base font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 print:hidden"
            @click="printJudgeVotes"
          >
            <Printer class="h-4 w-4" aria-hidden="true" />
            PRINT JUDGE VOTES
          </button>
        </div>

        <div class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[540px] border-separate border-spacing-y-0 text-left text-base">
              <thead class="bg-gradient-to-r from-[#08056d] to-blue-700 text-white">
                <tr>
                  <th scope="col" class="w-14 px-2 py-1.5 text-center font-semibold">Rank</th>
                  <th scope="col" class="w-20 px-2 py-1.5 font-semibold">Name</th>
                  <th scope="col" class="px-2 py-1.5"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="3" class="px-5 py-8 text-center text-base font-medium text-slate-500">
                    <span class="inline-flex items-center gap-3" role="status">
                      <span class="h-5 w-5 animate-spin rounded-full border-2 border-blue-800 border-t-transparent"></span>
                      Loading judge progress...
                    </span>
                  </td>
                </tr>
                <tr v-else-if="votingProgress.length === 0">
                  <td colspan="3" class="px-5 py-8 text-center text-base text-slate-500">No judge voting progress available.</td>
                </tr>
                <tr v-for="(judge, index) in votingProgress" v-else :key="judge.judgeId">
                  <td class="px-2 py-2 text-center font-bold tabular-nums text-blue-950">{{ index + 1 }}</td>
                  <td class="px-2 py-2 font-medium text-blue-800">{{ judge.judgeName }}</td>
                  <td class="px-2 py-2">
                    <div class="flex items-center gap-3">
                      <div
                        class="h-3 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-200"
                        role="progressbar"
                        :aria-label="`${judge.judgeName} voting progress`"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        :aria-valuenow="Math.min(100, Math.max(0, Number(judge.progressPercentage) || 0))"
                      >
                        <div
                          class="h-full rounded-full bg-gradient-to-r from-yellow-400 to-blue-600 transition-[width] duration-500"
                          :style="{ width: `${Math.min(100, Math.max(0, Number(judge.progressPercentage) || 0))}%` }"
                        ></div>
                      </div>
                      <span class="w-20 shrink-0 text-right text-base font-medium tabular-nums text-slate-900">
                        {{ Number(judge.progressPercentage || 0) }}% progress
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
            </div>
          </div>
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
  padding: 24px 32px 42px;
  transition: margin-left 0.25s ease;
}

.dashboard-content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  box-sizing: border-box;
}

.report-content {
  min-height: 100%;
  color: #0f172a;
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
  transition: opacity 0.2s ease, transform 0.2s ease;
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

@media (max-width: 767px) {
  .mobile-hamburger {
    display: flex;
  }

  .mobile-hamburger.is-hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-8px);
  }

  .admin-dashboard {
    --sidebar-width: 0px;
    overflow: visible;
  }

  .main-content {
    width: 100%;
    margin-left: 0;
    padding: 72px 16px 30px;
    overflow: visible;
  }

  .dashboard-content {
    max-width: 100%;
  }
}

@media (min-width: 768px) {
  .admin-dashboard :deep(.sidebar-navigation) {
    padding-top: 78px;
  }

  .admin-dashboard :deep(.sidebar-link),
  .admin-dashboard :deep(.sidebar-link.active) {
    min-height: 50px;
  }
}

@media (max-width: 520px) {
  .admin-dashboard :deep(.sidebar) {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(100vw, 360px);
    height: 100vh;
    padding: 0 0 10px;
  }

  .admin-dashboard :deep(.sidebar-brand) {
    height: 90px;
    padding-top: 14px;
  }

  .admin-dashboard :deep(.sidebar-navigation) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 18px 0;
  }

  .admin-dashboard :deep(.sidebar-navigation .sidebar-link),
  .admin-dashboard :deep(.sidebar .sign-out) {
    gap: 10px;
    min-height: 52px;
    padding: 0 12px;
    font-size: 1.1rem;
    letter-spacing: 0.05em;
  }

  .main-content {
    min-height: 100vh;
    padding: 10px 8px 24px;
  }

  .dashboard-content {
    width: 100%;
  }
}
</style>