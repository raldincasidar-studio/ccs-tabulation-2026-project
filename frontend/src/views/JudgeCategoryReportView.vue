<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { FileCheck2, FileText, ListChecks, Printer, RefreshCw, ShieldCheck, UserRound } from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import Sidebar from '@/components/Sidebar.vue';
import ReportNavigation from '@/components/ReportNavigation.vue';
import JudgeScoreReportPaper from '@/components/JudgeScoreReportPaper.vue';
import { getJudgeCategoryReport, getReportOptions } from '@/services/reportService.js';
import { formatReportDate, reportStatusLabel } from '@/utils/reportFormat.js';
import starImage from '@/assets/img/star.png';

const router = useRouter();
const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);
const options = ref({ judges: [], categories: [], groups: [] });
const selectedJudgeId = ref('');
const selectedCategoryId = ref('');
const selectedGroupId = ref('');
const isLoadingOptions = ref(false);
const optionsError = ref('');
const isPreparing = ref(false);
const reportError = ref('');
const report = ref(null);
const isPrinting = ref(false);
const printSnapshot = ref(null);
const printArea = ref(null);
let optionsController;
let reportController;
let optionsRequest = 0;
let reportRequest = 0;
let mounted = false;

const selectedCategory = computed(() => options.value.categories.find((category) => category._id === selectedCategoryId.value));
const linkedGroups = computed(() => options.value.groups.filter((group) => group.categoriesIncluded?.includes(selectedCategoryId.value)));
const historicalGroups = computed(() => options.value.groups.filter((group) => !group.categoriesIncluded?.includes(selectedCategoryId.value)));
const hasScope = computed(() => Boolean(selectedJudgeId.value && selectedCategoryId.value && selectedGroupId.value));
const scopeMatches = computed(() => report.value?.scope.judgeId === selectedJudgeId.value &&
  report.value?.scope.categoryId === selectedCategoryId.value && report.value?.scope.groupId === selectedGroupId.value);
const currentReport = computed(() => scopeMatches.value && !isPreparing.value && !reportError.value ? report.value : null);
const printableReport = computed(() => printSnapshot.value ?? (currentReport.value?.canPrint ? currentReport.value : null));
const orientation = computed(() => (printableReport.value?.criteria.length ?? 0) > 4 ? 'landscape' : 'portrait');
const selectorsDisabled = computed(() => isLoadingOptions.value || isPreparing.value || isPrinting.value);

function updateViewportState() {
  isMobile.value = window.innerWidth < 768;
  isMobileSidebarOpen.value = false;
  if (isMobile.value) isSidebarCollapsed.value = false;
}

function clearSelectionReport() {
  reportRequest += 1;
  reportController?.abort();
  isPreparing.value = false;
  report.value = null;
  printSnapshot.value = null;
  reportError.value = '';
}

watch(selectedCategoryId, () => { selectedGroupId.value = ''; });
watch([selectedJudgeId, selectedCategoryId, selectedGroupId], clearSelectionReport);

async function loadOptions() {
  optionsController?.abort();
  optionsController = new AbortController();
  const request = ++optionsRequest;
  isLoadingOptions.value = true;
  optionsError.value = '';
  clearSelectionReport();
  try {
    const data = await getReportOptions(optionsController.signal);
    if (!mounted || request !== optionsRequest) return;
    options.value = data;
    // Retain explicit choices on retry only when their records still exist.
    if (!data.judges.some((judge) => judge._id === selectedJudgeId.value)) selectedJudgeId.value = '';
    if (!data.categories.some((category) => category._id === selectedCategoryId.value)) selectedCategoryId.value = '';
    if (!data.groups.some((group) => group._id === selectedGroupId.value)) selectedGroupId.value = '';
  } catch (error) {
    if (!mounted || request !== optionsRequest || error?.code === 'ERR_CANCELED') return;
    optionsController.abort();
    optionsError.value = error?.message || 'Unable to load judges, categories and contestant groups.';
  } finally {
    if (mounted && request === optionsRequest) isLoadingOptions.value = false;
  }
}

async function prepareReport() {
  if (!hasScope.value || selectorsDisabled.value || optionsError.value) return;
  reportController?.abort();
  reportController = new AbortController();
  const request = ++reportRequest;
  const scope = { judgeId: selectedJudgeId.value, categoryId: selectedCategoryId.value, groupId: selectedGroupId.value };
  isPreparing.value = true;
  report.value = null;
  reportError.value = '';
  try {
    const data = await getJudgeCategoryReport(scope, reportController.signal);
    if (mounted && request === reportRequest) report.value = data;
  } catch (error) {
    if (!mounted || request !== reportRequest || error?.code === 'ERR_CANCELED') return;
    reportError.value = error?.message || 'Unable to prepare this judge category report.';
  } finally {
    if (mounted && request === reportRequest) isPreparing.value = false;
  }
}

function capturePrintSnapshot() {
  // Printing uses the exact preview, not a fresh request that could silently
  // include edits the administrator has never reviewed.
  if (!printSnapshot.value && currentReport.value?.canPrint) {
    printSnapshot.value = JSON.parse(JSON.stringify(currentReport.value));
  }
}

function afterPrint() {
  printSnapshot.value = null;
  isPrinting.value = false;
}

async function printReport() {
  if (!currentReport.value?.canPrint || isPrinting.value) return;
  isPrinting.value = true;
  capturePrintSnapshot();
  try {
    await nextTick();
    await document.fonts?.ready;
    if (!mounted) return;
    // Local paper logos should be decoded before opening the print dialog.
    await Promise.all([...printArea.value.querySelectorAll('img')].map((image) => image.decode().catch(() => {})));
    if (mounted) window.print();
  } catch {
    reportError.value = 'Unable to open the print dialog. Please refresh the report and try again.';
    afterPrint();
  }
}

function handleLogout() { router.push('/login'); }

onMounted(() => {
  mounted = true;
  updateViewportState();
  window.addEventListener('resize', updateViewportState);
  window.addEventListener('beforeprint', capturePrintSnapshot);
  window.addEventListener('afterprint', afterPrint);
  loadOptions();
});

onBeforeUnmount(() => {
  mounted = false;
  optionsController?.abort();
  reportController?.abort();
  window.removeEventListener('resize', updateViewportState);
  window.removeEventListener('beforeprint', capturePrintSnapshot);
  window.removeEventListener('afterprint', afterPrint);
});
</script>

<template>
  <div class="admin-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div class="admin-dashboard" :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }">
      <button v-if="isMobile" class="mobile-hamburger" type="button" aria-label="Open navigation menu" aria-controls="reports-navigation" :aria-expanded="isMobileSidebarOpen" @click="isMobileSidebarOpen = !isMobileSidebarOpen"><span></span><span></span><span></span></button>
      <div v-if="isMobile && isMobileSidebarOpen" class="mobile-sidebar-overlay" @click="isMobileSidebarOpen = false"></div>
      <Sidebar id="reports-navigation" active-item="REPORTS" :is-mobile="isMobile" :is-sidebar-collapsed="isSidebarCollapsed" :is-mobile-sidebar-open="isMobileSidebarOpen" @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed" @close-mobile-sidebar="isMobileSidebarOpen = false" @toggle-mobile-sidebar="isMobileSidebarOpen = !isMobileSidebarOpen" @logout="handleLogout" />

      <main class="main-content">
        <div class="report-content">
          <header class="page-header"><h1>REPORTS</h1></header>
          <ReportNavigation active="individual" />
          <div class="reports-intro"><div><h2>JUDGE CATEGORY SCORE RECORDS</h2><p>An individual record of one judge's entered scores, per criterion and per candidate.</p></div><RouterLink to="/dashboard" class="dashboard-link">Live scoring monitor <span aria-hidden="true">↗</span></RouterLink></div>

          <section class="scope-rule" aria-label="Report scope rule"><ShieldCheck :size="19" aria-hidden="true" /><div><strong>1 report = 1 judge = 1 category</strong><p>Male, Female and different pageants are kept in separate group reports. Only the selected judge signs.</p></div></section>

          <div v-if="optionsError" class="notice notice-error" role="alert"><strong>Report selections could not be loaded.</strong><span>{{ optionsError }}</span><button class="text-button" type="button" :disabled="isLoadingOptions" @click="loadOptions">Retry connection</button></div>

          <section class="report-builder" aria-labelledby="report-builder-title" :aria-busy="isLoadingOptions || isPreparing">
            <div class="section-heading"><h3 id="report-builder-title"><FileText :size="18" aria-hidden="true" /> SELECT REPORT SCOPE</h3><span v-if="isLoadingOptions" class="loading-label" role="status"><RefreshCw :size="13" class="spinning" aria-hidden="true" /> Loading selections…</span><span v-else class="subtle">All three selections are required</span></div>
            <form @submit.prevent="prepareReport">
              <div class="scope-selectors">
                <label for="report-judge"><span>Judge</span><select id="report-judge" v-model="selectedJudgeId" required :disabled="selectorsDisabled || Boolean(optionsError)"><option disabled value="">Select one judge</option><option v-for="judge in options.judges" :key="judge._id" :value="judge._id">{{ judge.firstName }} {{ judge.lastName }}{{ judge.isActive === false ? ' (inactive · records retained)' : '' }}</option></select><small>Only this judge's own scores are included.</small></label>
                <label for="report-category"><span>Category</span><select id="report-category" v-model="selectedCategoryId" required :disabled="selectorsDisabled || Boolean(optionsError)"><option disabled value="">Select one category</option><option v-for="category in options.categories" :key="category._id" :value="category._id">{{ category.name }}{{ category.isActive === false ? ' (inactive)' : '' }}</option></select><small>Criteria are shown separately, never across categories.</small></label>
                <label for="report-group"><span>Pageant / Contestant group</span><select id="report-group" v-model="selectedGroupId" required :disabled="selectorsDisabled || !selectedCategoryId || Boolean(optionsError)"><option disabled value="">{{ selectedCategoryId ? 'Select one group' : 'Choose a category first' }}</option><optgroup v-if="linkedGroups.length" label="Groups linked to this category"><option v-for="group in linkedGroups" :key="group._id" :value="group._id">{{ group.name }}</option></optgroup><optgroup v-if="historicalGroups.length" label="Other groups — historical records only"><option v-for="group in historicalGroups" :key="group._id" :value="group._id">{{ group.name }} (historical scope)</option></optgroup></select><small>No “All groups” option. Male/Female remain separate.</small></label>
              </div>
              <p v-if="selectedCategory && linkedGroups.length === 0" class="setup-note">This category has no linked groups. A historical report is available only if the selected judge has saved scores for that group.</p>
              <p v-if="!isLoadingOptions && !optionsError && (!options.judges.length || !options.categories.length || !options.groups.length)" class="setup-note">Add judges, categories and contestant groups in event configuration before preparing reports.</p>
              <div class="builder-actions"><button class="button button-primary" type="submit" :disabled="!hasScope || selectorsDisabled || Boolean(optionsError)"><RefreshCw v-if="isPreparing" :size="15" class="spinning" aria-hidden="true" /><FileText v-else :size="15" aria-hidden="true" />{{ isPreparing ? 'Preparing report…' : currentReport ? 'Refresh report' : 'Generate report' }}</button><button class="button button-secondary" type="button" :disabled="!currentReport?.canPrint || isPrinting" @click="printReport"><Printer :size="15" aria-hidden="true" />{{ isPrinting ? 'Print dialog open…' : 'Print / Save as PDF' }}</button><span class="subtle">One scope per PDF or printed record.</span></div>
            </form>
          </section>

          <div v-if="reportError" class="notice notice-error" role="alert"><strong>The report is unavailable.</strong><span>{{ reportError }}</span><span>No combined or stale report can be printed.</span></div>

          <section v-if="isPreparing" class="empty-state" role="status"><RefreshCw :size="26" class="spinning" aria-hidden="true" /><h3>Preparing the selected judge's score record…</h3><p>Reading saved scores for exactly one category and one contestant group.</p></section>
          <template v-else-if="currentReport">
            <div class="report-preview-heading"><div><h3><FileCheck2 :size="18" aria-hidden="true" /> REPORT PREVIEW</h3><p>{{ currentReport.judge.name }} <span aria-hidden="true">·</span> {{ currentReport.category.name }} <span aria-hidden="true">·</span> {{ currentReport.group.name }}</p></div><span class="record-status" :data-status="currentReport.status">{{ reportStatusLabel(currentReport.status) }}</span></div>
            <div class="report-statistics" aria-label="Selected report summary"><article><UserRound :size="16" aria-hidden="true" /><strong>{{ currentReport.summary.totalContestants }}</strong><span>CANDIDATES</span></article><article><ListChecks :size="16" aria-hidden="true" /><strong>{{ currentReport.summary.totalCriteria }}</strong><span>REQUIRED CRITERIA</span></article><article><FileCheck2 :size="16" aria-hidden="true" /><strong>{{ currentReport.summary.completedContestants }}<small> / {{ currentReport.summary.totalContestants }}</small></strong><span>FULLY SCORED CANDIDATES</span></article><article><FileText :size="16" aria-hidden="true" /><strong>{{ currentReport.summary.missingFields }}</strong><span>MISSING FIELDS</span></article></div>
            <div v-if="currentReport.status === 'no_scores'" class="notice notice-info"><strong>No saved scores exist in this report scope.</strong><span>Unscored fields are shown as —, not zero. Printing is disabled until the judge has at least one saved entry.</span></div>
            <div v-else-if="currentReport.status === 'needs_review'" class="notice notice-warning"><strong>Saved entries require review.</strong><span>Invalid or duplicate values and removed criteria are preserved in the paper record and clearly marked. Review these entries before certification.</span></div>
            <div v-else-if="currentReport.status === 'incomplete'" class="notice notice-info"><strong>This score record is incomplete.</strong><span>You can print the entered scores, but missing fields and partial totals remain explicitly marked on the paper.</span></div>
            <div class="snapshot-info"><p><strong>Saved-data snapshot:</strong> {{ formatReportDate(currentReport.generatedAt) }}</p><p>Later score edits do not change this preview. Use “Refresh report” to prepare a newer record. {{ currentReport.criteria.length > 4 ? 'A4 landscape' : 'A4 portrait' }} layout.</p></div>
            <section class="paper-preview" aria-label="Paper template preview" tabindex="0"><JudgeScoreReportPaper :report="currentReport" /></section>
          </template>
          <section v-else-if="!reportError" class="empty-state"><FileText :size="32" aria-hidden="true" /><h3>Prepare an individual judge report</h3><p>Select a judge, a category and a pageant/group, then generate the report. No judges, categories or groups will be combined.</p></section>
        </div>
      </main>
    </div>

    <div ref="printArea" class="print-only" :data-orientation="orientation">
      <JudgeScoreReportPaper v-if="printableReport" :report="printableReport" />
      <p v-else class="print-selection-notice">No printable judge score record is prepared. Select exactly one judge, one category and one contestant group and generate a report with saved scores before printing.</p>
    </div>
  </div>
</template>

<style scoped>
.admin-frame { min-height: 100vh; padding: 0; background: #f3f5f4; }
.admin-dashboard { --sidebar-width: 218px; position: relative; min-height: 100vh; overflow: hidden; background: #f3f5f4; color: #101747; }
.main-content { display: flex; justify-content: center; min-height: 100vh; margin-left: var(--sidebar-width); padding: clamp(22px, 2.5vw, 56px) clamp(18px, 2.8vw, 58px) 56px; transition: margin-left .25s ease; }
.report-content { width: min(100%, 1240px); min-width: 0; margin: 0 auto; color: #18234e; font-family: 'Poppins', sans-serif; font-size: 16px; }
.report-content * { box-sizing: border-box; }
.page-header { position: relative; display: flex; min-height: 130px; align-items: center; overflow: hidden; padding: 0 20px; border: 1px solid rgb(116 148 255 / 22%); border-radius: 10px; background-color: #080a51; background-image: var(--star-image), var(--star-image), var(--star-image), var(--star-image), linear-gradient(110deg, #080a47, #1317a5 54%, #080a47); background-repeat: no-repeat; background-position: 39% 24%, 58% 76%, 76% 30%, 93% 67%, center; background-size: 17px 17px, 12px 12px, 15px 15px, 10px 10px, auto; box-shadow: 0 3px 10px rgb(8 12 65 / 12%); color: #fff; }
.page-header::before { position: absolute; inset: 0; background-image: linear-gradient(115deg, transparent 47%, rgb(117 155 255 / 30%) 47.15%, transparent 47.4%), linear-gradient(22deg, transparent 37%, rgb(117 155 255 / 24%) 37.15%, transparent 37.4%), linear-gradient(155deg, transparent 74%, rgb(117 155 255 / 20%) 74.15%, transparent 74.4%); content: ''; pointer-events: none; }
.page-header h1 { position: relative; z-index: 1; margin: 0; color: #e4eaff; font-family: 'Croparo', sans-serif; font-size: 55px; font-weight: 500; line-height: 1; text-shadow: 0 0 7px rgb(142 171 255 / 40%); }
.reports-intro, .section-heading, .report-preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 15px; }
.reports-intro { margin: 24px 0 16px; }
.reports-intro h2 { margin: 0; font-family: 'Croparo', sans-serif; color: #10146d; font-size: 21px; font-weight: 500; }
.reports-intro p { margin: 7px 0 0; color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.dashboard-link { display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0; padding: 8px 11px; border: 1px solid #dce1ed; border-radius: 6px; background: #fff; color: #56698e; font-size: 16px; text-decoration: none; }
.scope-rule { display: flex; align-items: flex-start; gap: 11px; padding: 15px 17px; margin-bottom: 19px; border: 1px solid #d9e2f4; border-radius: 8px; background: #eef3fc; color: #394f82; }
.scope-rule > svg { flex-shrink: 0; margin-top: 1px; }
.scope-rule strong { font-size: 16px; font-weight: 600; }
.scope-rule p { margin: 4px 0 0; color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.report-builder { padding: 19px; border: 1px solid #dfe4ee; border-radius: 9px; background: #fff; }
.section-heading { margin-bottom: 18px; }
.section-heading h3, .report-preview-heading h3 { display: flex; align-items: center; gap: 8px; margin: 0; font-family: 'Croparo', sans-serif; font-size: 18px; font-weight: 500; color: #2e3c75; }
.subtle { color: #4c5d7a; font-size: 16px; }
.loading-label { display: inline-flex; align-items: center; gap: 6px; color: #4c5d7a; font-size: 16px; }
.scope-selectors { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 17px; }
.scope-selectors label { display: flex; min-width: 0; flex-direction: column; gap: 7px; }
.scope-selectors label > span { color: #4c5d7e; font-size: 16px; font-weight: 500; }
.scope-selectors select { width: 100%; min-width: 0; min-height: 39px; padding: 8px 26px 8px 10px; border: 1px solid #d7deec; border-radius: 6px; background: #fff; color: #344673; font: inherit; font-size: 16px; }
.scope-selectors select:disabled { background: #f8f9fc; color: #4c5d7a; cursor: not-allowed; }
.scope-selectors label > small { color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.setup-note { margin: 13px 0 0; color: #80561e; font-size: 16px; line-height: 1.8; }
.builder-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; padding-top: 17px; margin-top: 17px; border-top: 1px solid #edf0f7; }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 8px 13px; border: 1px solid transparent; border-radius: 7px; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; }
.button-primary { background: #141c77; color: #fff; }
.button-secondary { background: #fff; border-color: #d4daea; color: #27346b; }
.button:hover:not(:disabled) { border-color: #717dcc; box-shadow: 0 2px 7px #142b6710; }
.button:disabled { opacity: .5; cursor: not-allowed; }
button:focus-visible, a:focus-visible, select:focus-visible, .paper-preview:focus-visible { outline: 3px solid #738ff4; outline-offset: 3px; }
.notice { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; margin: 16px 0; padding: 13px 16px; border: 1px solid; border-radius: 8px; font-size: 16px; line-height: 1.8; }
.notice-error { background: #fff4f1; border-color: #f0cfc7; color: #843a35; }
.notice-info { background: #edf5fc; border-color: #ccdff1; color: #355b80; }
.notice-warning { background: #fff8ec; border-color: #eed7ad; color: #80561e; }
.text-button { padding: 0; border: 0; background: none; color: inherit; cursor: pointer; font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
.report-preview-heading { margin: 25px 0 14px; }
.report-preview-heading p { margin: 7px 0 0; color: #4c5d7a; font-size: 16px; }
.record-status { flex-shrink: 0; padding: 6px 9px; border-radius: 6px; background: #eef0f5; color: #4c5d7a; font-size: 16px; }
.record-status[data-status='complete'] { background: #e3f4ed; color: #187554; }
.record-status[data-status='incomplete'], .record-status[data-status='needs_review'] { background: #fff0d6; color: #90590c; }
.report-statistics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
.report-statistics article { position: relative; display: flex; flex-direction: column; gap: 7px; min-width: 0; padding: 17px 15px; border: 1px solid #292e91; border-radius: 8px; background: linear-gradient(125deg, #151d7e, #090b4f); color: #e9edff; }
.report-statistics article > svg { position: absolute; top: 16px; right: 14px; color: #8fa4ef; }
.report-statistics article > strong { font-family: 'Croparo', sans-serif; font-size: 30px; line-height: 1.1; font-weight: 500; }
.report-statistics strong small { font-size: 16px; color: #b4c1ef; }
.report-statistics article > span { color: #bdc9f5; font-size: 16px; letter-spacing: .06em; }
.snapshot-info { margin: 17px 0 12px; color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.snapshot-info p { margin: 3px 0; }
.snapshot-info strong { color: #4c5d7a; font-weight: 500; }
.paper-preview { width: 100%; max-width: 100%; padding: 16px; overflow-x: auto; border: 1px solid #dfe4ee; border-radius: 9px; background: #e9edf3; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 20px; padding: 39px 20px; border: 1px dashed #d3dced; border-radius: 9px; background: #fff; text-align: center; color: #4c5d7a; }
.empty-state h3 { margin: 6px 0 0; color: #3e507d; font-size: 16px; font-weight: 600; }
.empty-state p { max-width: 470px; margin: 0; color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.mobile-hamburger { position: fixed; top: 16px; left: 14px; z-index: 30; display: flex; width: 38px; height: 34px; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 0; border: 1px solid #2d25c8; border-radius: 5px; background: #08065a; cursor: pointer; }
.mobile-hamburger span { display: block; width: 18px; height: 2px; border-radius: 999px; background: #fff; }
.mobile-sidebar-overlay { position: fixed; inset: 0; z-index: 12; background: rgb(0 0 0 / 42%); }
.print-only { display: none; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1050px) { .reports-intro { flex-wrap: wrap; gap: 10px; } .scope-selectors { gap: 12px; } .report-statistics article > svg { display: none; } .report-statistics article { padding: 16px 12px; } .report-statistics article > strong { font-size: 26px; } }
@media (max-width: 767px) { .main-content { width: 100%; margin-left: 0; padding: 72px 16px 30px; } .scope-selectors { grid-template-columns: minmax(0, 1fr); gap: 16px; } .section-heading { flex-wrap: wrap; gap: 7px; } .report-statistics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .report-preview-heading { align-items: flex-start; flex-wrap: wrap; gap: 10px; } .report-builder { padding: 16px; } .paper-preview { padding: 10px; } }
@media (max-width: 520px) { .page-header { min-height: 100px; padding: 0 16px; } .page-header h1 { font-size: 38px; } .reports-intro h2 { font-size: 18px; } .scope-rule strong { font-size: 16px; } .builder-actions > .subtle { flex-basis: 100%; } }
@media (prefers-reduced-motion: reduce) { .spinning { animation: none; } .main-content { transition: none; } }
@page judge-score-portrait { size: A4 portrait; margin: 10mm; }
@page judge-score-landscape { size: A4 landscape; margin: 10mm; }
@media print {
  :global(html), :global(body) { min-height: 0; margin: 0 !important; padding: 0 !important; background: #fff !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  :global(body > :not(#app)) { display: none !important; }
  .admin-frame { min-height: 0; background: #fff; }
  .admin-dashboard { display: none !important; }
  .print-only { display: block !important; width: 100%; page: judge-score-portrait; }
  .print-only[data-orientation='landscape'] { page: judge-score-landscape; }
  .print-selection-notice { color: #111; font: 11pt Arial, sans-serif; }
}
</style>
