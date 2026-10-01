<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Printer, RefreshCw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import ReportNavigation from '@/components/ReportNavigation.vue'
import CategoryResultsPaper from '@/components/CategoryResultsPaper.vue'
import api from '@/services/api.js'
import { formatReportDate, rowStatusLabel } from '@/utils/reportFormat.js'
import mrMsLogo from '@/assets/img/mr-ms-css-logo.png'
import ccsLogo from '@/assets/img/ccs-logo.png'

const router = useRouter()
const selectedGroup = ref('None')
const contestantGroups = ref([])
const rankingReports = ref([])
const finalRankings = ref([])
const votingProgress = ref([])
const isLoading = ref(true)
const isRankingsLoading = ref(false)
const isProgressLoading = ref(false)
const rankingsError = ref('')
const progressError = ref('')
const groupsError = ref('')
const isMobile = ref(false)
const isSidebarCollapsed = ref(false)
const isMobileSidebarOpen = ref(false)
const isMenuHidden = ref(false)
const printMode = ref('')
const paperJudgeReport = ref(null)
const paperAggregateReport = ref(null)
const paperProgressRows = ref([])
const paperProgressGroup = ref('')
const paperProgressTime = ref('')
const printError = ref('')
const isCategoryPickerOpen = ref(false)
const isPreparingCategorySheet = ref(false)
const selectedCategoryName = ref('')
const isResultsPickerOpen = ref(false)
const selectedResultCategoryId = ref('')
const categoryResultsReport = ref(null)
const resultDetails = ref({ eventDate: '', venue: '', tabulatorName: '', chairpersonName: '', includeChairperson: true })
const resultsDetailsSnapshot = ref({})
const printDetailsSnapshot = ref({})
const isPrinting = ref(false)
const printArea = ref(null)
const resultsDialog = ref(null)
const categoryDialog = ref(null)
const resultsPreview = ref(null)
let dialogOpener
const progressGeneratedAt = ref('')
let mounted = false
let groupsController
let dataController
let paperController
let dataRequest = 0
let paperRequest = 0

const clone = value => JSON.parse(JSON.stringify(value))
const unwrapData = response => response?.data ?? response
const points = (value, decimals = 1) => value == null ? '—' : `${Number(value).toFixed(decimals)} pts`
const raw = value => value == null ? '—' : String(value)
const controlsBusy = computed(() => isPrinting.value || isPreparingCategorySheet.value)
const selectedGroupName = computed(() => selectedGroup.value === 'None' ? 'All groups' : contestantGroups.value.find(group => group._id === selectedGroup.value)?.name || 'Selected group')
const categoryColumns = computed(() => {
  const categories = new Map()
  rankingReports.value.forEach(report => (report.categories || []).forEach(category => {
    if (!categories.has(category.categoryId)) categories.set(category.categoryId, { ...category, name: category.name })
  }))
  return [...categories.values()]
})
const resultCategories = computed(() => selectedGroup.value === 'None' ? [] : categoryColumns.value)
const judgeScoreCategories = computed(() => paperJudgeReport.value?.contestants?.[0]?.categoryBreakdown || [])
const categorySheetRows = computed(() => {
  const rows = (paperJudgeReport.value?.contestants || []).map(contestant => ({
    ...contestant,
    categoryScore: contestant.categoryBreakdown?.find(category => category.categoryName === selectedCategoryName.value)?.score ?? null,
    categoryStatus: contestant.categoryBreakdown?.find(category => category.categoryName === selectedCategoryName.value)?.status ?? 'not_started',
  })).sort((a, b) => a.categoryScore === null ? b.categoryScore === null ? 0 : 1 : b.categoryScore === null ? -1 : Number(b.categoryScore) - Number(a.categoryScore))
  let previous = null
  let previousRank = null
  return rows.map((row, index) => {
    const value = row.categoryScore === null ? null : Number(row.categoryScore)
    const rank = value === null ? null : previous !== null && Math.abs(value - previous) <= 1e-9 ? previousRank : index + 1
    previous = value
    previousRank = rank
    return { ...row, rank }
  })
})
const paperJudgeLabel = computed(() => {
  const index = votingProgress.value.findIndex(judge => judge.judgeId === paperJudgeReport.value?.judgeId)
  return index >= 0 ? `Judge ${index + 1}` : 'Judge'
})
const printRankingRows = computed(() => paperAggregateReport.value?.rows || [])
const hasRankedScores = computed(() => rankingReports.value.some(report => report.canPrint))
const stars = [
  { left: '8%', top: '24%' }, { left: '19%', top: '72%' },
  { left: '31%', top: '38%' }, { left: '47%', top: '18%' },
  { left: '58%', top: '68%' }, { left: '72%', top: '31%' },
  { left: '83%', top: '74%' }, { left: '93%', top: '43%' },
]

function updateViewportState() {
  isMobile.value = window.innerWidth < 768
  isMobileSidebarOpen.value = false
  if (isMobile.value) isSidebarCollapsed.value = false
}
function handleScrollState() { isMenuHidden.value = isMobile.value && (window.scrollY || window.pageYOffset) > 12 }
function handleLogout() { router.push('/login') }
function getScore(ranking, categoryId) { return ranking.categoryScores?.find(item => item.categoryId === categoryId)?.weightedScore ?? null }

async function fetchRankings() {
  dataController?.abort()
  const controller = new AbortController()
  dataController = controller
  const request = ++dataRequest
  const groupId = selectedGroup.value
  const groups = groupId === 'None' ? contestantGroups.value : contestantGroups.value.filter(group => group._id === groupId)
  isRankingsLoading.value = true
  isProgressLoading.value = true
  rankingsError.value = ''
  progressError.value = ''
  finalRankings.value = []
  rankingReports.value = []
  votingProgress.value = []
  const [rankings, progress] = await Promise.allSettled([
    Promise.all(groups.map(async group => {
      const report = unwrapData(await api.get('/reports/final-rankings', {
        params: { groupId: group._id }, signal: controller.signal, timeout: 15000,
      }))
      if (report?.scope?.groupId !== group._id || !Array.isArray(report.rankings) || !Array.isArray(report.categories)) {
        throw new Error('The rankings do not match the requested group. Please refresh reports.')
      }
      return report
    })),
    api.get('/reports/voting-progress', {
      params: groupId === 'None' ? {} : { groupId }, signal: controller.signal, timeout: 15000,
    }),
  ])
  if (!mounted || request !== dataRequest) return
  if (rankings.status === 'fulfilled') {
    rankingReports.value = rankings.value
    // Preserve each group's rank. Male/Female never compete in a fictional
    // combined ranking even when the screen shows every group.
    finalRankings.value = rankings.value.flatMap(report => (report.rankings || []).map(row => ({ ...row, group: report.group })))
  } else if (rankings.reason?.code !== 'ERR_CANCELED') {
    rankingsError.value = rankings.reason?.message || 'Unable to load final rankings.'
  }
  if (progress.status === 'fulfilled' && Array.isArray(unwrapData(progress.value))) {
    votingProgress.value = unwrapData(progress.value)
    progressGeneratedAt.value = new Date().toISOString()
  } else if (progress.reason?.code !== 'ERR_CANCELED') {
    progressError.value = progress.reason?.message || 'Unable to load judge voting progress.'
  }
  isRankingsLoading.value = false
  isProgressLoading.value = false
}

async function loadReportData() {
  groupsController?.abort()
  const controller = new AbortController()
  groupsController = controller
  dataRequest += 1
  dataController?.abort()
  isRankingsLoading.value = false
  isProgressLoading.value = false
  isLoading.value = true
  groupsError.value = ''
  clearPrintReport()
  printError.value = ''
  categoryResultsReport.value = null
  try {
    const groups = unwrapData(await api.get('/contestant-groups', { signal: controller.signal, timeout: 15000 }))
    if (!mounted || controller !== groupsController) return
    if (!Array.isArray(groups)) throw new Error('Invalid contestant group data returned by the server.')
    contestantGroups.value = groups
    if (selectedGroup.value !== 'None' && !groups.some(group => group._id === selectedGroup.value)) selectedGroup.value = 'None'
    await fetchRankings()
  } catch (error) {
    if (!mounted || controller !== groupsController || error?.code === 'ERR_CANCELED') return
    contestantGroups.value = []
    finalRankings.value = []
    rankingReports.value = []
    votingProgress.value = []
    groupsError.value = error?.message || 'Unable to load contestant groups.'
  } finally {
    if (mounted && controller === groupsController) isLoading.value = false
  }
}

function requireGroup() {
  if (selectedGroup.value !== 'None') return true
  printError.value = 'Select one contestant group above before printing rankings or judge summaries. Male and Female reports are kept separate.'
  return false
}

async function fetchPaper(path, params = {}, judgeId = '') {
  if (!requireGroup() || controlsBusy.value) return null
  paperController?.abort()
  const controller = new AbortController()
  paperController = controller
  const request = ++paperRequest
  const groupId = selectedGroup.value
  isPreparingCategorySheet.value = true
  printError.value = ''
  try {
    const report = unwrapData(await api.get(path, { params: { ...params, groupId }, signal: controller.signal, timeout: 15000 }))
    if (!mounted || request !== paperRequest || groupId !== selectedGroup.value) return null
    if (report?.scope?.groupId !== groupId || judgeId && report.scope.judgeId !== judgeId || params.categoryId && report.scope.categoryId !== params.categoryId) {
      throw new Error('The returned paper does not match the selected report scope. Printing was blocked.')
    }
    const validShape = typeof report.canPrint === 'boolean' && (judgeId ? Array.isArray(report.contestants) : Array.isArray(report.rows) && Array.isArray(report.judges))
    if (!validShape || params.categoryId && (typeof report.category?.name !== 'string' || typeof report.group?.name !== 'string')) {
      throw new Error('The server returned an incomplete paper report. Printing was blocked.')
    }
    return report
  } catch (error) {
    if (mounted && request === paperRequest && error?.code !== 'ERR_CANCELED') printError.value = error?.message || 'Unable to prepare the paper report.'
    return null
  } finally {
    if (mounted && request === paperRequest) isPreparingCategorySheet.value = false
  }
}

async function openPrint(mode) {
  isPrinting.value = true
  printMode.value = mode
  try {
    await nextTick()
    await document.fonts?.ready
    if (!mounted) return
    await Promise.all([...printArea.value.querySelectorAll('img')].map(image => image.decode().catch(() => {})))
    if (mounted) window.print()
  } catch {
    printError.value = 'Unable to open the print dialog. Please try again.'
    clearPrintReport()
  }
}
async function printJudgeVotes() {
  if (isLoading.value || isProgressLoading.value || progressError.value || controlsBusy.value || !votingProgress.value.length) return
  paperProgressRows.value = clone(votingProgress.value)
  paperProgressGroup.value = selectedGroupName.value
  paperProgressTime.value = progressGeneratedAt.value
  await openPrint('progress')
}
async function printFinalRanking() {
  if (isLoading.value || isRankingsLoading.value || controlsBusy.value) return
  const report = await fetchPaper('/reports/paper/final-ranking-sheet')
  if (!report) return
  if (!report.canPrint) { printError.value = 'No saved scores exist for the selected group.'; return }
  paperAggregateReport.value = report
  await openPrint('ranking')
}
async function fetchJudgePaperReport(judgeId) {
  const report = await fetchPaper(`/reports/paper/judge-summary/${judgeId}`, {}, judgeId)
  if (!report) return null
  if (!report.canPrint || !Array.isArray(report.contestants)) { printError.value = 'No saved scores are available for this judge in the selected group.'; return null }
  paperJudgeReport.value = report
  return report
}
async function printJudgeScoresheet(judge) {
  if (!await fetchJudgePaperReport(judge.judgeId)) return
  await openPrint('scoresheet')
}
async function prepareCategoryScoresheet(judge) {
  const report = await fetchJudgePaperReport(judge.judgeId)
  if (!report) return
  const categories = report.contestants?.[0]?.categoryBreakdown || []
  if (!categories.length) { printError.value = 'No category totals are available for this judge.'; return }
  selectedCategoryName.value = categories[0].categoryName
  isResultsPickerOpen.value = false
  isCategoryPickerOpen.value = true
}
async function printSelectedCategoryScoresheet() {
  if (!selectedCategoryName.value || !categorySheetRows.value.some(row => row.categoryScore !== null)) {
    printError.value = 'The selected judge has no printable category total. Use the individual record to review incomplete or ambiguous entries.'
    closeCategoryPicker()
    return
  }
  isCategoryPickerOpen.value = false
  await openPrint('category-scoresheet')
}
function closeCategoryPicker() { isCategoryPickerOpen.value = false; paperJudgeReport.value = null }
function openResultsPicker() {
  if (!requireGroup() || !resultCategories.value.length || controlsBusy.value) return
  printError.value = ''
  if (!resultCategories.value.some(category => category.categoryId === selectedResultCategoryId.value)) selectedResultCategoryId.value = resultCategories.value[0].categoryId
  closeCategoryPicker()
  isResultsPickerOpen.value = true
}
function closeResultsPicker() {
  isResultsPickerOpen.value = false
  paperRequest += 1
  paperController?.abort()
  isPreparingCategorySheet.value = false
}
async function prepareCategoryResults() {
  if (!selectedResultCategoryId.value) return
  const details = clone(resultDetails.value)
  const report = await fetchPaper('/reports/paper/category-results', { categoryId: selectedResultCategoryId.value })
  if (!report) return
  categoryResultsReport.value = report
  resultsDetailsSnapshot.value = details
  isResultsPickerOpen.value = false
  await nextTick()
  resultsPreview.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  resultsPreview.value?.focus({ preventScroll: true })
}
async function printCategoryResults() {
  if (!categoryResultsReport.value?.canPrint || controlsBusy.value) return
  paperAggregateReport.value = clone(categoryResultsReport.value)
  printDetailsSnapshot.value = clone(resultsDetailsSnapshot.value)
  await openPrint('category-results')
}
function clearPrintReport() {
  printMode.value = ''
  isPrinting.value = false
  paperJudgeReport.value = null
  paperAggregateReport.value = null
  paperProgressRows.value = []
}
watch(selectedGroup, () => {
  paperRequest += 1
  paperController?.abort()
  isPreparingCategorySheet.value = false
  clearPrintReport()
  closeCategoryPicker()
  isResultsPickerOpen.value = false
  categoryResultsReport.value = null
  selectedResultCategoryId.value = ''
  printError.value = ''
  if (!isLoading.value) fetchRankings()
})
watch(selectedResultCategoryId, () => { categoryResultsReport.value = null })
watch([isResultsPickerOpen, isCategoryPickerOpen], async ([resultsOpen, categoryOpen]) => {
  if (!resultsOpen && !categoryOpen) {
    if (dialogOpener?.isConnected) dialogOpener.focus()
    return
  }
  dialogOpener = document.activeElement
  await nextTick()
  const dialog = resultsOpen ? resultsDialog.value : categoryDialog.value
  dialog?.querySelector('select:enabled, input:enabled, button:enabled')?.focus()
})
function trapDialogFocus(event) {
  if (event.key !== 'Tab') return
  const items = [...event.currentTarget.querySelectorAll('button:enabled, select:enabled, input:enabled, a[href], [tabindex="0"]')]
  if (!items.length) { event.preventDefault(); return }
  const first = items[0]
  const last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
onMounted(() => {
  mounted = true
  updateViewportState()
  handleScrollState()
  window.addEventListener('resize', updateViewportState)
  window.addEventListener('scroll', handleScrollState, { passive: true })
  window.addEventListener('afterprint', clearPrintReport)
  loadReportData()
})
onBeforeUnmount(() => {
  mounted = false
  groupsController?.abort()
  dataController?.abort()
  paperController?.abort()
  window.removeEventListener('resize', updateViewportState)
  window.removeEventListener('scroll', handleScrollState)
  window.removeEventListener('afterprint', clearPrintReport)
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

      <ReportNavigation active="overview" />

      <section aria-labelledby="ranking-title" class="space-y-8">
        <div class="flex min-h-[30px] flex-wrap items-center gap-3">
          <h2 id="ranking-title" class="shrink-0 text-base font-bold text-blue-900">Filter:</h2>
          <div class="flex flex-wrap gap-2" role="group" aria-label="Filter rankings by contestant group">
            <button
              type="button"
              class="rounded-full px-3 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:px-4"
              :class="selectedGroup === 'None' ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white' : 'bg-gray-200 text-slate-800 hover:bg-gray-300'"
              :disabled="controlsBusy"
              :aria-pressed="selectedGroup === 'None'"
              @click="selectedGroup = 'None'"
            >
              All groups
            </button>
            <button
              v-for="group in contestantGroups"
              :key="group._id"
              type="button"
              class="rounded-full px-3 py-2 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 sm:px-4"
              :class="selectedGroup === group._id ? 'bg-gradient-to-r from-blue-600 to-blue-900 text-white' : 'bg-gray-200 text-slate-800 hover:bg-gray-300'"
              :disabled="controlsBusy"
              :aria-pressed="selectedGroup === group._id"
              @click="selectedGroup = group._id"
            >
              {{ group.name }}
            </button>
          </div>
          <button
            type="button"
            class="print:hidden inline-flex items-center gap-2 rounded-sm bg-blue-950 px-4 py-2 text-base font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isLoading || isRankingsLoading || controlsBusy || !hasRankedScores"
            @click="printFinalRanking"
          >
            <Printer class="h-4 w-4" aria-hidden="true" />
            PRINT OVERALL RANKING
          </button>
        </div>

        <div class="report-actions">
          <button type="button" class="report-action-button" :disabled="isLoading || isRankingsLoading || controlsBusy || !resultCategories.length" @click="openResultsPicker"><Printer :size="18" aria-hidden="true" /> CATEGORY RESULTS</button>
          <button type="button" class="report-action-button" :disabled="isLoading || isRankingsLoading || controlsBusy" @click="loadReportData"><RefreshCw :size="18" aria-hidden="true" /> Refresh reports</button>
        </div>
        <p class="report-scope-note">{{ selectedGroup === 'None' ? 'Each group keeps its own rank. Select one group to print overall standings, category results or a judge summary.' : `Reports for ${selectedGroupName}. Overall points weight each category average; category-result sheets show the weighted raw sum separately.` }}</p>
        <p class="report-scope-note">Standings are provisional until manually certified. Equal totals share a rank; no automatic tie-break or finalization is configured.</p>
        <p v-if="printError" class="text-base font-medium text-red-700" role="alert">{{ printError }}</p>
        <p v-if="groupsError" class="text-base font-medium text-red-700" role="alert">{{ groupsError }}</p>

        <div class="overflow-hidden rounded-md">
          <div class="overflow-x-auto">
            <table class="w-full min-w-max border-separate border-spacing-y-1.5 text-left text-base">
              <thead>
                <tr class="bg-gradient-to-r from-blue-700 to-blue-950">
                  <th scope="col" class="w-14 whitespace-nowrap rounded-l-md px-4 py-4 bg-yellow-400 text-left font-semibold text-slate-900">Rank</th>
                  <th scope="col" class="min-w-24 whitespace-nowrap px-4 py-4 text-left font-semibold text-white">Name</th>
                  <th scope="col" class="min-w-[90px] whitespace-nowrap px-4 py-4 text-center font-normal text-white">Final Weighted pts</th>
                  <th v-for="category in categoryColumns" :key="category.categoryId" scope="col" class="min-w-24 whitespace-nowrap px-4 py-4 text-center font-normal text-white">
                    <span class="block">{{ category.name }}</span>
                    <span v-if="category.weight !== undefined" class="block">({{ category.weight }}%)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading || isRankingsLoading">
                  <td :colspan="3 + categoryColumns.length" class="px-5 py-8 text-center text-base font-medium text-slate-600">
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
                  <td :colspan="3 + categoryColumns.length" class="px-5 py-8 text-center text-base text-slate-600">No rankings available for this group.</td>
                </tr>
                <tr v-for="ranking in finalRankings" v-else :key="ranking.contestantId" class="bg-gradient-to-r from-blue-700 via-blue-800 to-[#08056d] text-white">
                  <td class="rounded-l-md border-r-[8px] border-[#f7f9f8] bg-gradient-to-r from-blue-700 to-blue-900 px-2 py-1 text-center text-base font-bold tabular-nums">{{ ranking.rank ?? '—' }}</td>
                  <td class="min-w-24 rounded-l-md px-2 py-1">
                    <span class="flex items-center gap-1 text-base font-medium text-yellow-300"><span class="h-1 w-1 rounded-full bg-yellow-400"></span>{{ ranking.label }}</span>
                    <span class="mt-0.5 block text-base font-bold">{{ ranking.name }}</span><span v-if="selectedGroup === 'None'" class="block text-base text-blue-100">{{ ranking.group }}</span>
                  </td>
                  <td class="px-2 py-1 text-center font-medium tabular-nums">{{ points(ranking.final_candidate_score) }}</td>
                  <td v-for="category in categoryColumns" :key="category.categoryId" class="px-2 py-1 text-center font-medium tabular-nums text-blue-50">
                    {{ points(getScore(ranking, category.categoryId)) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section v-if="categoryResultsReport" ref="resultsPreview" tabindex="-1" class="category-results-preview" aria-label="Category results preview">
        <div class="report-actions"><h2>Category results · {{ categoryResultsReport.category.name }} · {{ categoryResultsReport.group.name }}</h2><button type="button" class="report-action-button primary" :disabled="!categoryResultsReport.canPrint || controlsBusy" @click="printCategoryResults"><Printer :size="18" aria-hidden="true" /> Print category results</button></div>
        <p v-if="!categoryResultsReport.canPrint" class="report-scope-note">No saved valid scores in this scope. Missing totals are not zero; printing is disabled.</p>
        <p class="report-scope-note">This is a stable preview. Later score edits do not change this sheet; generate the category results again to refresh it.</p>
        <div class="results-paper-preview" tabindex="0" aria-label="Category results paper preview"><CategoryResultsPaper :report="categoryResultsReport" :details="resultsDetailsSnapshot" /></div>
      </section>

      <section aria-labelledby="progress-title" class="!mt-20 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/70 pb-2">
          <h2 id="progress-title" class="text-base font-bold text-blue-950">Judge Voting Progress · {{ selectedGroupName }}</h2>
          <button
            type="button"
            class="inline-flex w-fit items-center justify-center gap-2 rounded-sm bg-blue-950 px-6 py-2 text-base font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 print:hidden"
            :disabled="isLoading || isProgressLoading || controlsBusy || !!progressError || !votingProgress.length"
            @click="printJudgeVotes"
          >
            <Printer class="h-4 w-4" aria-hidden="true" />
            PRINT JUDGE VOTES
          </button>
        </div>

        <p v-if="progressError" class="text-base font-medium text-red-700" role="alert">{{ progressError }}</p>
        <p class="report-scope-note">Full summary: this judge’s raw totals across categories for one group. By category: this judge’s category total summary. For every exact criterion value, use the separate Individual judge/category record above.</p>

        <div class="overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[540px] border-separate border-spacing-y-0 text-left text-base">
              <thead class="bg-gradient-to-r from-[#08056d] to-blue-700 text-white">
                <tr>
                  <th scope="col" class="w-14 px-2 py-1.5 text-center font-semibold">Rank</th>
                  <th scope="col" class="w-20 px-2 py-1.5 font-semibold">Judge</th>
                  <th scope="col" class="px-2 py-1.5 font-semibold">Progress</th>
                  <th scope="col" class="px-2 py-1.5 print:hidden"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading || isProgressLoading">
                  <td colspan="4" class="px-5 py-8 text-center text-base font-medium text-slate-600">
                    <span class="inline-flex items-center gap-3" role="status">
                      <span class="h-5 w-5 animate-spin rounded-full border-2 border-blue-800 border-t-transparent"></span>
                      Loading judge progress...
                    </span>
                  </td>
                </tr>
                <tr v-else-if="votingProgress.length === 0">
                  <td colspan="4" class="px-5 py-8 text-center text-base text-slate-600">No judge voting progress available.</td>
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
                      <span class="min-w-32 shrink-0 text-right text-base font-medium tabular-nums text-slate-900">
                        {{ Number(judge.progressPercentage || 0) }}% progress
                      </span>
                    </div>
                  </td>
                  <td class="px-2 py-2 text-right print:hidden">
                    <div class="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-sm border border-blue-900 px-2.5 py-1.5 text-base font-bold text-blue-950 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        :disabled="controlsBusy"
                        @click="printJudgeScoresheet(judge)"
                      >
                        <Printer class="h-3.5 w-3.5" aria-hidden="true" />
                        FULL SUMMARY
                      </button>
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 rounded-sm border border-blue-900 px-2.5 py-1.5 text-base font-bold text-blue-950 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60"
                        :disabled="controlsBusy"
                        @click="prepareCategoryScoresheet(judge)"
                      >
                        <Printer class="h-3.5 w-3.5" aria-hidden="true" />
                        BY CATEGORY
                      </button>
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

    <div v-if="isResultsPickerOpen" class="category-picker-backdrop print:hidden" @click.self="closeResultsPicker">
      <section ref="resultsDialog" class="category-picker results-picker" role="dialog" aria-modal="true" aria-labelledby="results-picker-title" @keydown.esc.prevent="closeResultsPicker" @keydown="trapDialogFocus">
        <h2 id="results-picker-title">Category final-results sheet</h2>
        <p class="report-scope-note">{{ selectedGroupName }} · separate judge totals and all judges’ signatures, following the supplied paper sample.</p>
        <form @submit.prevent="prepareCategoryResults">
          <fieldset :disabled="isPreparingCategorySheet"><legend class="sr-only">Category and optional paper details</legend>
          <label for="result-category">Category</label><select id="result-category" v-model="selectedResultCategoryId" :disabled="isPreparingCategorySheet" required><option v-for="category in resultCategories" :key="category.categoryId" :value="category.categoryId">{{ category.name }} ({{ category.weight }}%)</option></select>
          <div class="paper-detail-fields"><label>Event date (optional)<input v-model="resultDetails.eventDate" type="date" /></label><label>Venue (optional)<input v-model.trim="resultDetails.venue" maxlength="160" placeholder="Leave blank for a writing line" /></label><label>Tabulator name (optional)<input v-model.trim="resultDetails.tabulatorName" maxlength="120" /></label><label>Chairperson name (optional)<input v-model.trim="resultDetails.chairpersonName" maxlength="120" :disabled="!resultDetails.includeChairperson" /></label></div>
          <label class="chairperson-option"><input v-model="resultDetails.includeChairperson" type="checkbox" /> Include optional chairperson signature line</label>
          <p class="report-scope-note">These details are for this printout only; they do not change event settings or scoring rules.</p>
          </fieldset>
          <p v-if="printError" class="text-base text-red-700" role="alert">{{ printError }}</p>
          <div class="report-actions"><button type="button" class="report-action-button" @click="closeResultsPicker">Cancel</button><button type="submit" class="report-action-button primary" :disabled="isPreparingCategorySheet || !selectedResultCategoryId">{{ isPreparingCategorySheet ? 'Preparing…' : 'Generate preview' }}</button></div>
        </form>
      </section>
    </div>

    <div v-if="isCategoryPickerOpen" class="category-picker-backdrop print:hidden" @click.self="closeCategoryPicker">
      <section ref="categoryDialog" class="category-picker" role="dialog" aria-modal="true" aria-labelledby="category-picker-title" @keydown.esc.prevent="closeCategoryPicker" @keydown="trapDialogFocus">
        <h2 id="category-picker-title" class="text-lg font-bold text-blue-950">Print judge category-total summary</h2>
        <p class="mt-1 text-base text-slate-700">{{ paperJudgeReport?.judgeName }} · {{ paperJudgeReport?.group }}</p>
        <label for="judge-print-category" class="mt-5 block text-base font-semibold text-slate-800">Category</label>
        <select id="judge-print-category" v-model="selectedCategoryName" class="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-700/30">
          <option v-for="category in judgeScoreCategories" :key="category.categoryName" :value="category.categoryName">
            {{ category.categoryName }}
          </option>
        </select>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded border border-slate-300 px-4 py-2 text-base font-semibold text-slate-700 hover:bg-slate-50" @click="closeCategoryPicker">Cancel</button>
          <button type="button" class="inline-flex items-center gap-2 rounded bg-blue-950 px-4 py-2 text-base font-bold text-white hover:bg-blue-800" @click="printSelectedCategoryScoresheet">
            <Printer class="h-4 w-4" aria-hidden="true" />
            Print category
          </button>
        </div>
      </section>
    </div>

    <section v-if="printMode" ref="printArea" class="paper-report" :class="{ 'paper-scoresheet': printMode === 'scoresheet', 'paper-category-sheet': printMode === 'category-scoresheet', 'paper-category-results': printMode === 'category-results', 'wide-category-results': printMode === 'category-results' && (paperAggregateReport?.judges.length || 0) > 5 }">
      <CategoryResultsPaper v-if="printMode === 'category-results' && paperAggregateReport" :report="paperAggregateReport" :details="printDetailsSnapshot" />
      <template v-else-if="printMode === 'ranking'">
        <header class="paper-header">
          <img :src="mrMsLogo" alt="Mr. and Ms. CCS" />
          <div class="paper-header-copy">
            <p>Republic of the Philippines</p>
            <p>Jose Rizal Memorial State University</p>
            <p>College of Computing Studies</p>
          </div>
          <img :src="ccsLogo" alt="College of Computing Studies" />
        </header>
        <h1 class="paper-title">{{ paperAggregateReport.eventTitle }} Final Ranking</h1>
        <h2 class="paper-subtitle">{{ paperAggregateReport.group }}</h2>
        <p class="paper-report-note">Prepared: {{ formatReportDate(paperAggregateReport.generatedAt) }} · Provisional standings — manual certification, not electronic finalization.</p>
        <table class="paper-table ranking-paper-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name &amp; Label</th>
              <th>Group</th>
              <th>Weighted points</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ranking in printRankingRows" :key="ranking.contestantId">
              <td class="paper-center">{{ ranking.rank ?? '—' }}</td>
              <td>
                <strong>{{ ranking.label }}</strong>
                <strong class="paper-name">{{ ranking.name }}</strong><small v-if="ranking.status !== 'complete'" class="paper-cell-note">{{ rowStatusLabel(ranking.status) }}</small>
              </td>
              <td>{{ ranking.group }}</td>
              <td class="paper-center"><strong>{{ points(ranking.final_candidate_score) }}</strong></td>
            </tr>
          </tbody>
        </table>
        <p class="paper-report-note">{{ paperAggregateReport.formula }} Equal totals share a provisional rank; no official tie-break is configured.</p>
        <p class="paper-declaration">We certify that the above tabulation reflects the recorded scores for this group. Incomplete scoring remains provisional; certification is manual.</p>
        <div class="paper-signatures">
          <div v-for="(judge, index) in paperAggregateReport.judges" :key="judge.judgeId">
            <span></span>
            <strong>{{ judge.judgeName }}</strong>
            <em>Judge {{ index + 1 }}</em>
          </div>
        </div>
      </template>

      <template v-else-if="printMode === 'scoresheet' && paperJudgeReport">
        <header class="paper-header paper-header-compact">
          <img :src="mrMsLogo" alt="Mr. and Ms. CCS" />
          <div class="paper-header-copy">
            <p>Republic of the Philippines</p>
            <p>Jose Rizal Memorial State University</p>
            <p>College of Computing Studies</p>
          </div>
          <img :src="ccsLogo" alt="College of Computing Studies" />
        </header>
        <h1 class="paper-title paper-title-compact">{{ paperJudgeReport.header?.title || 'MR & MS CCS 2026 Judge Scoresheet' }}</h1>
        <h2 class="paper-subtitle">{{ paperJudgeReport.group }} · Full multi-category raw-total summary</h2>
        <p class="paper-report-note">Prepared: {{ formatReportDate(paperJudgeReport.generatedAt) }} · This summary does not replace the individual judge/category criterion record.</p>
        <table class="paper-table scoresheet-paper-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name &amp; Label</th>
              <th v-for="category in paperJudgeReport.contestants?.[0]?.categoryBreakdown || []" :key="category.categoryName">
                {{ category.categoryName }}
              </th>
              <th>Combined raw total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contestant in paperJudgeReport.contestants" :key="contestant.nameAndLabel">
              <td class="paper-center">{{ contestant.rank ?? '—' }}</td>
              <td><strong>{{ contestant.nameAndLabel }}</strong></td>
              <td v-for="category in contestant.categoryBreakdown" :key="category.categoryName" class="paper-center">
                {{ raw(category.score) }}<small v-if="category.status !== 'complete'" class="paper-cell-note">{{ rowStatusLabel(category.status) }}</small>
              </td>
              <td class="paper-center"><strong>{{ raw(contestant.final_candidate_score) }}</strong><small v-if="contestant.status !== 'complete'" class="paper-cell-note">{{ contestant.status === 'no_scores' ? 'Not scored' : rowStatusLabel(contestant.status) }}</small></td>
            </tr>
          </tbody>
        </table>
        <p class="paper-declaration">I certify that the totals above reflect my recorded scores for this group. Missing, partial or review entries remain explicitly indicated.</p>
        <div class="paper-single-signature">
          <span></span>
          <strong>{{ paperJudgeReport.judgeName }}</strong>
          <em>{{ paperJudgeLabel }}</em>
        </div>
      </template>

      <template v-else-if="printMode === 'category-scoresheet' && paperJudgeReport">
        <header class="paper-header paper-category-header">
          <img :src="mrMsLogo" alt="Mr. and Ms. CCS" />
          <div class="paper-header-copy">
            <p>Republic of the Philippines</p>
            <p>Jose Rizal Memorial State University</p>
            <p>College of Computing Studies</p>
          </div>
          <img :src="ccsLogo" alt="College of Computing Studies" />
        </header>
        <h1 class="paper-title">MR &amp; MS CCS 2026 Judge Category-Total Summary</h1>
        <h2 class="paper-subtitle">{{ selectedCategoryName }}</h2>
        <p class="category-sheet-judge">Judge: {{ paperJudgeReport.judgeName }} · {{ paperJudgeReport.group }}</p>
        <p class="paper-report-note">Prepared: {{ formatReportDate(paperJudgeReport.generatedAt) }} · Raw totals only; consult the individual record for criterion scores.</p>
        <table class="paper-table category-paper-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name &amp; Label</th>
              <th>{{ selectedCategoryName }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="contestant in categorySheetRows" :key="contestant.nameAndLabel">
              <td class="paper-center">{{ contestant.rank ?? '—' }}</td>
              <td><strong>{{ contestant.nameAndLabel }}</strong></td>
              <td class="paper-center"><strong>{{ raw(contestant.categoryScore) }}<small v-if="contestant.categoryStatus !== 'complete'" class="paper-cell-note">{{ rowStatusLabel(contestant.categoryStatus) }}</small></strong></td>
            </tr>
          </tbody>
        </table>
        <p class="paper-declaration">I certify that the totals above reflect my recorded scores for this group. Missing, partial or review entries remain explicitly indicated.</p>
        <div class="paper-single-signature">
          <span></span>
          <strong>{{ paperJudgeReport.judgeName }}</strong>
          <em>{{ paperJudgeLabel }}</em>
        </div>
      </template>

      <template v-else-if="printMode === 'progress'">
        <header class="paper-header">
          <img :src="mrMsLogo" alt="Mr. and Ms. CCS" />
          <div class="paper-header-copy">
            <p>Republic of the Philippines</p>
            <p>Jose Rizal Memorial State University</p>
            <p>College of Computing Studies</p>
          </div>
          <img :src="ccsLogo" alt="College of Computing Studies" />
        </header>
        <h1 class="paper-title">Judge Voting Progress</h1>
        <h2 class="paper-subtitle">{{ paperProgressGroup }}</h2>
        <p class="paper-report-note">Prepared: {{ formatReportDate(paperProgressTime) }} · Progress counts valid required criterion fields, not partially submitted sheets as complete.</p>
        <table class="paper-table">
          <thead><tr><th>No.</th><th>Judge</th><th>Progress</th></tr></thead>
          <tbody>
            <tr v-for="(judge, index) in paperProgressRows" :key="judge.judgeId">
              <td class="paper-center">{{ index + 1 }}</td>
              <td>{{ judge.judgeName }}</td>
              <td class="paper-center">{{ Number(judge.progressPercentage || 0).toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>
    <p v-else class="no-report-print-notice">Choose a report format and use its Print button to prepare a scoped paper report.</p>
  </div>
</template>

<style scoped>

.no-report-print-notice { display: none; }
.report-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 14px 0; }
.report-action-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 14px; border: 1px solid #cad3e7; border-radius: 6px; background: #fff; color: #27346b; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; }
.report-action-button.primary { border-color: #151d7e; background: #151d7e; color: #fff; }
.report-action-button:disabled { opacity: .55; cursor: not-allowed; }
.report-action-button:focus-visible, .results-paper-preview:focus-visible { outline: 3px solid #738ff4; outline-offset: 3px; }
.report-scope-note { margin: 10px 0; color: #4c5d7a; font-size: 16px; line-height: 1.7; }
.category-results-preview { margin: 25px 0; }
.category-results-preview h2, .results-picker h2 { margin: 0; color: #10146d; font-size: 20px; font-weight: 600; }
.results-paper-preview { max-width: 100%; padding: 14px; overflow-x: auto; border: 1px solid #dfe4ee; border-radius: 8px; background: #e9edf3; }
.results-picker { width: min(100%, 640px); max-height: calc(100dvh - 40px); overflow-y: auto; font: 16px/1.6 'Poppins', sans-serif; }
.results-picker label { display: block; color: #34476c; font-weight: 500; }
.results-picker input:not([type='checkbox']), .results-picker select { width: 100%; min-height: 44px; margin-top: 5px; padding: 9px 11px; border: 1px solid #cbd4e6; border-radius: 6px; background: #fff; color: #1e2d50; font: inherit; }
.paper-detail-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px; margin-top: 17px; }
.results-picker .chairperson-option { display: flex; align-items: center; gap: 9px; margin-top: 17px; }
.chairperson-option input { width: 18px; height: 18px; accent-color: #151d7e; }
@media (max-width: 600px) { .paper-detail-fields { grid-template-columns: minmax(0, 1fr); } }
@page legacy-results-portrait { size: A4 portrait; margin: 8mm; }
@page legacy-results-landscape { size: A4 landscape; margin: 8mm; }

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
  padding: clamp(22px, 2.5vw, 56px) clamp(18px, 2.8vw, 58px) 56px;
  transition: margin-left 0.25s ease;
}

.dashboard-content {
  width: min(100%, 1240px);
  min-width: 0;
  margin: 0 auto;
  box-sizing: border-box;
}

.report-content {
  min-height: 100%;
  color: #0f172a;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  line-height: 1.6;
}

.paper-report {
  display: none;
}

.category-picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(15 23 42 / 55%);
}

.category-picker {
  width: min(100%, 420px);
  padding: 24px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 50px rgb(15 23 42 / 24%);
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

@page legacy-ranking {
  size: A4 portrait;
  margin: 8mm;
}

@page legacy-scoresheet {
  size: A4 landscape;
  margin: 8mm;
}

@page legacy-categorysheet {
  size: A4 portrait;
  margin: 8mm;
}

@media print {
  :global(html),
  :global(body) {
    width: 100%;
    min-height: 0;
    margin: 0 !important;
    background: #fff !important;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .no-report-print-notice { display: block; color: #111; font: 11pt Arial, sans-serif; }
  .admin-dashboard, .category-picker-backdrop { display: none !important; }
  .admin-frame { min-height: 0; background: #fff; }

  .paper-report {
    position: static;
    display: block !important;
    width: auto;
    min-height: 0;
    padding: 8mm 7mm;
    border: 1px solid #1688e8;
    background: #fff;
    color: #111;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 10pt;
    page: legacy-ranking;
  }

  .paper-report.paper-scoresheet {
    page: legacy-scoresheet;
  }

  .paper-report.paper-category-sheet {
    page: legacy-categorysheet;
  }

  .paper-table thead { display: table-header-group; }
  .paper-table tr, .paper-signatures > div, .paper-single-signature { break-inside: avoid; page-break-inside: avoid; }
  .paper-table th, .paper-table td { overflow-wrap: anywhere; }
  .paper-cell-note { display: block; font-size: 8pt; font-weight: 400; }
  .paper-report-note { margin: 0 0 4mm; font-size: 9pt; }
  .paper-report.paper-category-results { padding: 0; border: 0; page: legacy-results-portrait; }
  .paper-report.paper-category-results.wide-category-results { page: legacy-results-landscape; }

  .paper-header {
    display: grid;
    grid-template-columns: 24mm minmax(0, 1fr) 24mm;
    align-items: center;
    gap: 3mm;
    margin: 0 0 7mm;
    padding-bottom: 3mm;
    border-bottom: 1px solid #777;
    text-align: center;
    font-size: 9pt;
    line-height: 1.25;
  }

  .paper-header p {
    margin: 0;
  }

  .paper-header img {
    display: block;
    width: 24mm;
    height: 24mm;
    object-fit: contain;
  }

  .paper-category-header img {
    width: 24mm;
    height: 24mm;
  }

  .paper-header-copy {
    min-width: 0;
    text-align: center;
  }

  .paper-header-compact {
    grid-template-columns: 20mm minmax(0, 1fr) 20mm;
    margin-bottom: 5mm;
    padding-bottom: 2mm;
    font-size: 8pt;
  }

  .paper-header-compact img {
    width: 20mm;
    height: 20mm;
  }

  .paper-title {
    margin: 0 0 4mm;
    text-align: center;
    font-size: 17pt;
    font-weight: 700;
    line-height: 1.2;
  }

  .paper-title-compact {
    margin-bottom: 5mm;
    font-size: 14pt;
  }

  .paper-subtitle {
    margin: 0 0 4mm;
    text-align: center;
    font-size: 10pt;
    font-weight: 700;
  }

  .paper-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 9pt;
  }

  .paper-table th,
  .paper-table td {
    border: 1px solid #222;
    padding: 2.1mm 2.4mm;
    vertical-align: top;
  }

  .paper-table th {
    text-align: left;
    font-weight: 700;
  }

  .ranking-paper-table th:nth-child(1) { width: 14%; }
  .ranking-paper-table th:nth-child(2) { width: 36%; }
  .ranking-paper-table th:nth-child(3) { width: 35%; }
  .ranking-paper-table th:nth-child(4) { width: 15%; }

  .paper-center {
    text-align: center !important;
    vertical-align: middle !important;
  }

  .paper-name {
    display: block;
  }

  .paper-declaration {
    margin: 7mm 0 12mm;
    font-size: 8pt;
    font-style: italic;
  }

  .paper-signatures {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4mm;
    margin: 0 2mm;
  }

  .paper-signatures div,
  .paper-single-signature {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2mm;
    font-size: 8pt;
  }

  .paper-signatures span,
  .paper-single-signature span {
    width: 100%;
    border-top: 1px solid #555;
  }

  .paper-signatures em,
  .paper-single-signature em {
    font-style: italic;
  }

  .paper-signatures strong,
  .paper-single-signature strong {
    max-width: 100%;
    overflow-wrap: anywhere;
    text-align: center;
    font-size: 7.5pt;
  }

  .paper-single-signature {
    width: 35mm;
    margin: 10mm auto 0;
  }

  .category-sheet-judge {
    margin: 0 0 4mm;
    text-align: center;
    font-size: 9pt;
  }

  .category-paper-table th:first-child { width: 14%; }
  .category-paper-table th:nth-child(2) { width: 58%; }
  .category-paper-table th:nth-child(3) { width: 28%; }

  .scoresheet-paper-table {
    font-size: 7pt;
  }

  .scoresheet-paper-table th,
  .scoresheet-paper-table td {
    padding: 1.6mm 1.8mm;
  }

  .scoresheet-paper-table th:first-child { width: 7%; }
  .scoresheet-paper-table th:nth-child(2) { width: 19%; }
  .scoresheet-paper-table th:last-child { width: 12%; }
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