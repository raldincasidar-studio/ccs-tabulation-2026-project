<script setup>
import { computed, ref, watch } from 'vue';
import { ArrowUpRight, CheckCircle2, Clock3, ListChecks, Radio, RefreshCw, Settings2, UserRound, Users } from 'lucide-vue-next';
import { useScoringMonitor } from '@/composables/useScoringMonitor.js';
import { updateCategoryJudges } from '@/services/dashboardService.js';

const { dashboard, isLoading, isRefreshing, isPaused, error, lastReceivedAt, refresh, reload } = useScoringMonitor();
const selectedCategoryId = ref('');
const selectedJudgeId = ref('');
const groupFilter = ref('');
const sheetFilter = ref('all');
const failedImages = ref({});
const showAssignments = ref(false);
const assignAllActive = ref(true);
const assignedJudgeIds = ref([]);
const isSavingAssignments = ref(false);
const assignmentError = ref('');
const assignmentMessage = ref('');

const categories = computed(() => dashboard.value?.categories ?? []);
const selectedCategory = computed(() => categories.value.find((category) => category.categoryId === selectedCategoryId.value));
const selectedJudge = computed(() => selectedCategory.value?.judges.find((judge) => judge.judgeId === selectedJudgeId.value));
const visibleGroups = computed(() => (selectedCategory.value?.groups ?? []).filter((group) => !groupFilter.value || group.groupId === groupFilter.value));
const visibleSheets = computed(() => (selectedJudge.value?.contestants ?? []).filter((sheet) => sheetFilter.value === 'all' || sheet.status === sheetFilter.value));
const refreshSeconds = computed(() => (dashboard.value?.refreshIntervalMs ?? 3000) / 1000);

const labels = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Completed',
  not_required: 'Not required',
  not_configured: 'Needs setup',
};
const statusLabel = (status) => labels[status] ?? status;
const number = (value) => value == null ? '—' : new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(value);
const time = (value) => value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'No saved scores';
const missingNames = (sheet) => sheet.fields.filter((field) => field.status !== 'scored').map((field) => field.name).join(', ');

watch(categories, (items) => {
  if (!items.some((category) => category.categoryId === selectedCategoryId.value)) {
    selectedCategoryId.value = items.find((category) => category.categoryId === dashboard.value?.event.activeCategoryId)?.categoryId ??
      items.find((category) => category.isActive)?.categoryId ?? items[0]?.categoryId ?? '';
  }
}, { immediate: true });

watch(selectedCategoryId, () => {
  groupFilter.value = '';
  sheetFilter.value = 'all';
  showAssignments.value = false;
  assignmentError.value = '';
  assignmentMessage.value = '';
});

watch(() => selectedCategory.value?.judges.map((judge) => judge.judgeId).join(','), () => {
  if (!selectedCategory.value?.judges.some((judge) => judge.judgeId === selectedJudgeId.value)) selectedJudgeId.value = '';
});

watch(() => selectedCategory.value?.groups.map((group) => group.groupId).join(','), () => {
  if (!selectedCategory.value?.groups.some((group) => group.groupId === groupFilter.value)) groupFilter.value = '';
});

function openAssignments() {
  assignAllActive.value = selectedCategory.value.assignedJudges === null;
  const activeIds = new Set(dashboard.value.judges.map((judge) => judge.judgeId));
  assignedJudgeIds.value = (selectedCategory.value.assignedJudges ?? []).filter((id) => activeIds.has(id));
  assignmentError.value = '';
  assignmentMessage.value = '';
  showAssignments.value = true;
}

async function saveAssignments() {
  const categoryId = selectedCategoryId.value;
  isSavingAssignments.value = true;
  assignmentError.value = '';
  try {
    await updateCategoryJudges(categoryId, assignAllActive.value ? null : assignedJudgeIds.value);
    await reload();
    if (selectedCategoryId.value === categoryId) {
      showAssignments.value = false;
      assignmentMessage.value = 'Judge assignments saved. Results reflect the assigned active judges only.';
    }
  } catch (saveError) {
    assignmentError.value = saveError?.message || 'Unable to save judge assignments.';
  } finally {
    isSavingAssignments.value = false;
  }
}

function monitorJudge(judgeId) {
  selectedJudgeId.value = judgeId;
  sheetFilter.value = 'all';
}
</script>

<template>
  <section class="scoring-monitor" aria-label="Live scoring monitoring" :aria-busy="isLoading">
    <div class="monitor-toolbar">
      <div>
        <h2><Radio :size="20" aria-hidden="true" /> LIVE SCORING MONITORING</h2>
        <p class="sync-status" :class="{ 'is-stale': error }" role="status">
          <span class="sync-dot" :class="{ 'is-stale': error }"></span>
          <template v-if="error">{{ dashboard ? 'Updates interrupted · showing last received scores' : 'Unable to connect to scoring data' }}</template>
          <template v-else-if="isLoading">Loading scoring data…</template>
          <template v-else-if="isPaused">Auto-refresh paused while this tab is hidden</template>
          <template v-else>Auto-updating every {{ refreshSeconds }}s<span v-if="lastReceivedAt"> · Updated {{ time(lastReceivedAt) }}</span></template>
        </p>
      </div>
      <button type="button" class="button button-secondary refresh-button" :disabled="isRefreshing" @click="refresh">
        <RefreshCw :size="15" :class="{ spinning: isRefreshing }" aria-hidden="true" />
        {{ isRefreshing ? 'Refreshing…' : 'Refresh now' }}
      </button>
    </div>

    <div v-if="error" class="notice notice-error" role="alert">
      <strong>{{ dashboard ? 'Live updates are temporarily unavailable.' : 'Dashboard data could not be loaded.' }}</strong>
      <span>{{ error }} Automatic retries are enabled.</span>
      <button type="button" class="text-button" :disabled="isRefreshing" @click="refresh">Try again</button>
    </div>

    <template v-if="dashboard">
      <div class="event-strip">
        <span>{{ dashboard.event.eventTitle }}</span>
        <span class="mode-label">{{ dashboard.event.isConfigurationMode ? 'Configuration mode' : 'Live mode' }} · Saved scores only</span>
      </div>

      <section class="overview-stats" aria-label="Dashboard statistics">
        <article><Users :size="19" aria-hidden="true" /><strong>{{ dashboard.stats.totalJudges }}</strong><span>ACTIVE JUDGES</span></article>
        <article><UserRound :size="19" aria-hidden="true" /><strong>{{ dashboard.stats.totalContestants }}</strong><span>CONTESTANTS</span></article>
        <article><ListChecks :size="19" aria-hidden="true" /><strong>{{ dashboard.stats.totalCategories }}</strong><span>CATEGORIES</span></article>
        <article><CheckCircle2 :size="19" aria-hidden="true" /><strong>{{ dashboard.stats.completedSheets }}<small> / {{ dashboard.stats.requiredSheets }}</small></strong><span>COMPLETED SHEETS</span></article>
      </section>

      <div class="overall-progress">
        <span><strong>{{ dashboard.stats.progressPercentage }}%</strong> of required fields scored</span>
        <progress :value="dashboard.stats.progressPercentage" max="100" aria-label="Overall scoring progress"></progress>
        <span>{{ dashboard.stats.pendingEvaluations }} pending evaluations</span>
      </div>

      <nav class="quick-actions" aria-label="Quick actions">
        <RouterLink to="/reports">Generate reports <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink>
        <RouterLink to="/admin/live-controls">Live controls <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink>
        <RouterLink to="/admin/add-contestant">Add contestants <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink>
        <RouterLink to="/admin/judges">Judge management <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink>
        <RouterLink to="/admin/configurations">Event configuration <ArrowUpRight :size="13" aria-hidden="true" /></RouterLink>
      </nav>

      <div class="section-heading">
        <div><h2>CATEGORY OVERVIEW</h2><p>Select a category to inspect its rankings and judge score sheets.</p></div>
        <span class="subtle">{{ dashboard.stats.completedCategories }} / {{ categories.length }} categories fully scored</span>
      </div>

      <div v-if="categories.length === 0" class="empty-state">
        <ListChecks :size="30" aria-hidden="true" />
        <h3>No competition categories yet</h3>
        <p>Create categories, add sub-criteria, and link contestant groups to begin monitoring.</p>
        <RouterLink class="button button-primary" to="/admin/categories/add">Add a category</RouterLink>
      </div>

      <div v-else class="category-grid" aria-label="Competition categories">
        <button
          v-for="category in categories"
          :key="category.categoryId"
          type="button"
          class="category-card"
          :class="{ selected: category.categoryId === selectedCategoryId }"
          :aria-pressed="category.categoryId === selectedCategoryId"
          :aria-label="`Monitor ${category.name}`"
          :disabled="isSavingAssignments"
          @click="selectedCategoryId = category.categoryId"
        >
          <div class="category-card-title"><h3>{{ category.name }}</h3><span v-if="!category.isActive" class="inactive-label">Inactive</span></div>
          <span class="status-badge" :data-status="category.summary.status">{{ statusLabel(category.summary.status) }}</span>
          <div class="category-counts"><span>{{ category.summary.totalContestants }} contestants</span><span>{{ category.summary.totalAssignedJudges }} assigned judges</span></div>
          <div class="progress-label"><span>{{ category.summary.completedSheets }} / {{ category.summary.requiredSheets }} sheets complete</span><strong>{{ category.summary.progressPercentage }}%</strong></div>
          <progress :value="category.summary.progressPercentage" max="100" :aria-label="`${category.name} scoring progress`"></progress>
          <div class="category-card-footer"><span>{{ category.summary.pendingEvaluations }} pending evaluations</span><ArrowUpRight :size="16" aria-hidden="true" /></div>
        </button>
      </div>

      <section v-if="selectedCategory" id="category-monitor" class="category-detail" :aria-label="`${selectedCategory.name} monitoring`">
        <div class="detail-heading">
          <div>
            <div class="eyebrow">CATEGORY MONITOR</div>
            <h2>{{ selectedCategory.name }} <span class="provisional-label">Provisional results</span></h2>
            <p>{{ selectedCategory.rubrics.length }} sub-criteria · {{ number(selectedCategory.maxPoints) }} possible points per sheet · {{ selectedCategory.weight }}% category weight</p>
          </div>
          <button class="button button-secondary" type="button" :disabled="isSavingAssignments" :aria-expanded="showAssignments" aria-controls="judge-assignments" @click="showAssignments ? showAssignments = false : openAssignments()">
            <Settings2 :size="15" aria-hidden="true" /> Judge assignments
          </button>
        </div>

        <form v-if="showAssignments" id="judge-assignments" class="assignment-editor" @submit.prevent="saveAssignments">
          <h3>Assigned judges for {{ selectedCategory.name }}</h3>
          <p>Assignments control which saved scores count. Existing scores are retained when an assignment changes.</p>
          <label class="checkbox-label"><input v-model="assignAllActive" type="checkbox" :disabled="isSavingAssignments" /> All active judges (including judges added later)</label>
          <fieldset v-if="!assignAllActive" :disabled="isSavingAssignments">
            <legend>Select judges for this category</legend>
            <div class="assignment-options">
              <label v-for="judge in dashboard.judges" :key="judge.judgeId" class="checkbox-label"><input v-model="assignedJudgeIds" type="checkbox" :value="judge.judgeId" /> {{ judge.judgeName }}</label>
            </div>
            <p v-if="dashboard.judges.length === 0" class="subtle">No active judges are available. Add or activate a judge first.</p>
            <p v-else-if="assignedJudgeIds.length === 0" class="assignment-warning">No judges selected. This category will have no required evaluations.</p>
          </fieldset>
          <p v-if="assignmentError" class="inline-error" role="alert">{{ assignmentError }}</p>
          <div class="button-row"><button class="button button-primary" type="submit" :disabled="isSavingAssignments">{{ isSavingAssignments ? 'Saving…' : 'Save assignments' }}</button><button class="button button-secondary" type="button" :disabled="isSavingAssignments" @click="showAssignments = false">Cancel</button></div>
        </form>
        <p v-if="assignmentMessage" class="assignment-success" role="status">{{ assignmentMessage }}</p>

        <div v-if="!selectedCategory.isActive" class="notice notice-info"><strong>This category is inactive.</strong><span>Previously saved scores remain visible; new submissions are not accepted.</span></div>
        <div v-if="selectedCategory.summary.status === 'not_configured'" class="notice notice-info">
          <strong>This category needs setup before scoring can be completed.</strong>
          <span v-if="selectedCategory.rubrics.length === 0">Add required sub-criteria to the category.</span>
          <span v-if="selectedCategory.summary.totalContestants === 0">Link a contestant group to this category and add active contestants to that group.</span>
          <span v-if="selectedCategory.summary.totalAssignedJudges === 0">Assign at least one active judge.</span>
          <RouterLink class="text-button" to="/admin/configurations">Open event configuration</RouterLink>
        </div>

        <div class="category-summary" aria-label="Selected category summary">
          <div><strong>{{ selectedCategory.summary.totalContestants }}</strong><span>Contestants</span></div>
          <div><strong>{{ selectedCategory.summary.totalAssignedJudges }}</strong><span>Assigned judges</span></div>
          <div><strong>{{ selectedCategory.summary.completedSheets }}<small> / {{ selectedCategory.summary.requiredSheets }}</small></strong><span>Completed score sheets</span></div>
          <div><strong>{{ selectedCategory.summary.pendingEvaluations }}</strong><span>Pending evaluations</span></div>
        </div>

        <div class="monitor-panels">
          <section class="panel results-panel" aria-labelledby="live-results-heading">
            <div class="panel-heading"><h3 id="live-results-heading"><Radio :size="17" aria-hidden="true" /> LIVE RESULTS</h3><span class="subtle">Ranked within each group</span></div>
            <label v-if="selectedCategory.groups.length > 1" class="select-label">Contestant group<select v-model="groupFilter"><option value="">All groups</option><option v-for="group in selectedCategory.groups" :key="group.groupId" :value="group.groupId">{{ group.name }}</option></select></label>
            <p class="scoring-note">Accumulated = saved rubric totals. Average = accumulated ÷ judges with scored fields. Weighted = average × {{ selectedCategory.weight }}%.</p>
            <p class="scoring-note"><strong>Partial sheets count toward live scores, not completion.</strong> Rankings may change as judges finish or edit their scores; they are not official final results.</p>
            <div v-if="visibleGroups.length === 0" class="panel-empty">No contestant groups include this category yet.</div>
            <section v-for="group in visibleGroups" :key="group.groupId" class="ranking-group" :aria-label="`${group.name} rankings`">
              <h4>{{ group.name }} <span>{{ group.rankings.length }} contestants</span></h4>
              <p v-if="group.rankings.length === 0" class="panel-empty">No active contestants in this group.</p>
              <div v-else class="table-scroll" tabindex="0" :aria-label="`${group.name} ranking table, scroll for more columns`">
                <table class="ranking-table">
                  <caption class="sr-only">Provisional {{ selectedCategory.name }} rankings for {{ group.name }}</caption>
                  <thead><tr><th scope="col">Rank</th><th scope="col">Contestant</th><th scope="col" class="numeric">Accumulated<small>points</small></th><th scope="col" class="numeric">Average<small>points</small></th><th scope="col" class="numeric">Weighted<small>points</small></th><th scope="col">Sheets complete</th></tr></thead>
                  <tbody>
                    <tr v-for="contestant in group.rankings" :key="contestant.contestantId">
                      <td><span class="rank-number" :class="{ leading: contestant.rank === 1 }">{{ contestant.rank == null ? '—' : `#${contestant.rank}` }}</span></td>
                      <th scope="row"><div class="contestant-name"><span class="contestant-avatar"><img v-if="contestant.image && !failedImages[contestant.contestantId]" :src="contestant.image" alt="" loading="lazy" @error="failedImages[contestant.contestantId] = true" /><UserRound v-else :size="18" aria-hidden="true" /></span><span>{{ contestant.name }}<small>{{ contestant.label }}</small></span></div></th>
                      <td class="numeric">{{ contestant.submittedSheets ? number(contestant.accumulatedScore) : '—' }}</td>
                      <td class="numeric average-score">{{ number(contestant.averageScore) }}</td>
                      <td class="numeric">{{ number(contestant.weightedScore) }}</td>
                      <td><span class="sheet-count">{{ contestant.completedSheets }} / {{ contestant.assignedJudges }}</span><span class="status-badge" :data-status="contestant.status">{{ statusLabel(contestant.status) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </section>

          <section class="panel judges-panel" aria-labelledby="judging-progress-heading">
            <div class="panel-heading"><h3 id="judging-progress-heading"><ListChecks :size="17" aria-hidden="true" /> JUDGING PROGRESS</h3></div>
            <p class="scoring-note">A sheet is complete only when every required sub-criterion has a valid saved score. Zero is a valid score.</p>
            <div class="judge-status-summary"><span><i class="legend-dot completed"></i>{{ selectedCategory.summary.completedJudges }} completed</span><span><i class="legend-dot in-progress"></i>{{ selectedCategory.summary.inProgressJudges }} in progress</span><span><i class="legend-dot not-started"></i>{{ selectedCategory.summary.notStartedJudges }} not started</span></div>
            <p class="assignment-mode">{{ selectedCategory.assignmentMode === 'all_active' ? 'Assigned to all active judges' : 'Explicit category assignments' }}</p>
            <div v-if="selectedCategory.judges.length === 0" class="panel-empty">No active judges assigned to this category.</div>
            <button v-for="judge in selectedCategory.judges" :key="judge.judgeId" type="button" class="judge-progress-row" :class="{ selected: selectedJudgeId === judge.judgeId }" :aria-pressed="selectedJudgeId === judge.judgeId" :aria-label="`View ${judge.judgeName}'s scoring progress`" @click="monitorJudge(judge.judgeId)">
              <div class="judge-row-heading"><strong>{{ judge.judgeName }}</strong><span class="status-badge" :data-status="judge.status">{{ statusLabel(judge.status) }}</span></div>
              <div class="progress-label"><span>{{ judge.completedSheets }} / {{ judge.requiredSheets }} sheets · {{ judge.scoredFields }} / {{ judge.requiredFields }} fields</span><strong>{{ judge.progressPercentage }}%</strong></div>
              <progress :value="judge.progressPercentage" max="100" :aria-label="`${judge.judgeName} scoring progress`"></progress>
              <div class="judge-row-footer"><span><Clock3 :size="11" aria-hidden="true" /> {{ time(judge.lastUpdatedAt) }}</span><span>View details <ArrowUpRight :size="12" aria-hidden="true" /></span></div>
            </button>
          </section>
        </div>

        <section class="panel judge-detail-panel" aria-labelledby="judge-detail-heading">
          <div class="panel-heading judge-detail-heading"><div><h3 id="judge-detail-heading">JUDGE-SPECIFIC MONITORING</h3><p class="scoring-note">Inspect saved values and missing sub-criteria for an individual judge.</p></div><label class="select-label">Monitor judge<select v-model="selectedJudgeId" @change="sheetFilter = 'all'"><option value="">Select a judge</option><option v-for="judge in selectedCategory.judges" :key="judge.judgeId" :value="judge.judgeId">{{ judge.judgeName }}</option></select></label></div>
          <p v-if="!selectedJudge" class="panel-empty">Select a judge above or choose “View details” in the progress tracker to inspect their score sheets.</p>
          <template v-else>
            <div class="selected-judge-heading"><div><h4>{{ selectedJudge.judgeName }} <span class="status-badge" :data-status="selectedJudge.status">{{ statusLabel(selectedJudge.status) }}</span></h4><p>{{ selectedJudge.completedSheets }} / {{ selectedJudge.requiredSheets }} sheets complete · {{ selectedJudge.scoredFields }} / {{ selectedJudge.requiredFields }} fields scored · {{ selectedJudge.progressPercentage }}% progress</p></div><label class="select-label">Score sheet status<select v-model="sheetFilter"><option value="all">All sheets</option><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="complete">Completed</option><option value="not_required">Not required</option></select></label></div>
            <p v-if="visibleSheets.length === 0" class="panel-empty">No score sheets match this status.</p>
            <div v-else class="table-scroll" tabindex="0" aria-label="Individual judge score sheets, scroll for more columns">
              <table class="score-sheet-table">
                <caption class="sr-only">{{ selectedJudge.judgeName }} — {{ selectedCategory.name }} saved score sheets</caption>
                <thead><tr><th scope="col">Contestant</th><th scope="col">Status</th><th v-for="rubric in selectedCategory.rubrics" :key="rubric.rubricsId" scope="col">{{ rubric.name }}<small>max {{ number(rubric.maxPoints) }}</small></th><th scope="col" class="numeric">Saved total<small>points</small></th><th scope="col">Last saved</th></tr></thead>
                <tbody>
                  <tr v-for="sheet in visibleSheets" :key="sheet.contestantId">
                    <th scope="row" class="sheet-contestant">{{ sheet.name }}<small>{{ sheet.label }} · {{ sheet.groupName }}</small><small v-if="sheet.scoredFields !== sheet.requiredFields" class="missing-summary">Needs scoring: {{ missingNames(sheet) }}</small></th>
                    <td><span class="status-badge" :data-status="sheet.status">{{ statusLabel(sheet.status) }}</span><small class="field-count">{{ sheet.scoredFields }} / {{ sheet.requiredFields }} fields</small></td>
                    <td v-for="field in sheet.fields" :key="field.rubricsId"><span v-if="field.status === 'scored'" class="scored-field">{{ number(field.score) }} <small>/ {{ number(field.maxPoints) }}</small></span><span v-else class="missing-field" :class="{ invalid: field.status === 'invalid' }">{{ field.status === 'invalid' ? 'Invalid · review' : 'Not scored' }}</span></td>
                    <td class="numeric">{{ sheet.scoredFields ? number(sheet.totalScore) : '—' }}</td>
                    <td class="saved-time">{{ time(sheet.lastUpdatedAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>
      </section>
    </template>

    <div v-else-if="isLoading" class="loading-state" role="status"><RefreshCw :size="24" class="spinning" aria-hidden="true" /><p>Loading categories, rankings and judge progress…</p></div>
  </section>
</template>

<style scoped>
.scoring-monitor { margin-top: 22px; color: #18234e; font-family: 'Poppins', sans-serif; font-size: 16px; line-height: 1.6; }
.scoring-monitor * { box-sizing: border-box; }
.monitor-toolbar, .section-heading, .detail-heading, .panel-heading, .selected-judge-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.monitor-toolbar h2, .section-heading h2, .detail-heading h2, .panel-heading h3 { margin: 0; font-family: 'Croparo', sans-serif; font-weight: 500; }
.monitor-toolbar { flex-wrap: wrap; }
.monitor-toolbar h2 { display: flex; align-items: center; gap: 8px; font-size: 21px; color: #10146d; }
.sync-status { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; margin: 7px 0 0; color: #5d6b82; font-size: 16px; }
.sync-dot, .legend-dot { display: inline-block; width: 6px; height: 6px; flex-shrink: 0; border-radius: 50%; background: #169879; }
.sync-dot.is-stale { background: #d18316; }
.sync-status.is-stale { color: #916112; }
.button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 36px; padding: 8px 13px; border: 1px solid transparent; border-radius: 7px; cursor: pointer; font: inherit; font-size: 16px; font-weight: 600; text-decoration: none; }
.button-primary { background: #141c77; color: white; }
.button-secondary { border-color: #d4daea; background: #fff; color: #27346b; }
.button:hover:not(:disabled) { border-color: #717dcc; box-shadow: 0 2px 7px #142b6710; }
.button:disabled, .text-button:disabled { opacity: .55; cursor: wait; }
.refresh-button { flex-shrink: 0; }
button:focus-visible, a:focus-visible, select:focus-visible, input:focus-visible, .table-scroll:focus-visible { outline: 3px solid #738ff4; outline-offset: 3px; }
.notice { display: flex; flex-direction: column; align-items: flex-start; gap: 5px; margin: 16px 0; padding: 13px 16px; border: 1px solid; border-radius: 8px; line-height: 1.65; font-size: 16px; }
.notice-error { color: #843a35; background: #fff4f1; border-color: #f0cfc7; }
.notice-info { color: #355b80; background: #edf5fc; border-color: #ccdff1; }
.text-button { padding: 0; border: 0; background: none; color: inherit; cursor: pointer; font: inherit; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
.event-strip { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-top: 18px; padding: 11px 14px; border: 1px solid #232876; border-radius: 7px; background: #10146d; color: #fff; font-size: 16px; }
.mode-label { color: #d4d9ff; font-size: 16px; }
.overview-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-top: 13px; }
.overview-stats article { position: relative; display: flex; flex-direction: column; gap: 7px; padding: 20px 16px 17px; overflow: hidden; border: 1px solid #292e91; border-radius: 8px; background: linear-gradient(125deg, #151d7e, #090b4f); color: #e9edff; }
.overview-stats article > svg { position: absolute; right: 15px; top: 17px; color: #8fa4ef; }
.overview-stats strong { font-family: 'Croparo', sans-serif; font-size: 34px; line-height: 1.1; font-weight: 500; }
.overview-stats strong small { font-size: 18px; color: #b4c1ef; }
.overview-stats article > span { font-size: 16px; font-weight: 500; letter-spacing: .07em; color: #bdc9f5; }
.overall-progress { display: flex; align-items: center; gap: 14px; margin-top: 13px; font-size: 16px; color: #4c5d7a; }
.overall-progress > progress { flex: 1; width: auto; min-width: 40px; }
.overall-progress strong { color: #273971; }
progress { display: block; width: 100%; height: 6px; overflow: hidden; border: 0; border-radius: 20px; background: #e7eaf3; accent-color: #334ca2; }
progress::-webkit-progress-bar { background: #e7eaf3; border-radius: 20px; }
progress::-webkit-progress-value { background: linear-gradient(90deg, #1b338c, #5577d7); border-radius: 20px; transition: width .3s ease; }
progress::-moz-progress-bar { background: #334ca2; border-radius: 20px; }
.quick-actions { display: flex; flex-wrap: wrap; gap: 7px 9px; margin: 20px 0 29px; }
.quick-actions a { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid #dce1ed; border-radius: 6px; background: #fff; color: #526385; font-size: 16px; text-decoration: none; }
.quick-actions a:hover { color: #142174; border-color: #96a9d5; }
.section-heading { align-items: flex-end; margin-bottom: 14px; }
.section-heading h2 { font-size: 22px; }
.section-heading p, .detail-heading p { margin: 6px 0 0; color: #4c5d7a; font-size: 16px; line-height: 1.65; }
.subtle { color: #4c5d7a; font-size: 16px; }
.category-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; }
.category-card { min-width: 0; padding: 17px; border: 1px solid #dce1ed; border-radius: 9px; background: #fff; color: #24315c; text-align: left; cursor: pointer; font: inherit; transition: border-color .15s ease, box-shadow .15s ease; }
.category-card:hover { border-color: #a6b2d9; }
.category-card.selected { border-color: #4c60af; background: #fbfcff; box-shadow: 0 0 0 1px #4c60af, 0 3px 12px #1727600d; }
.category-card:disabled { cursor: wait; }
.category-card-title { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.category-card h3 { margin: 0; font-size: 16px; font-weight: 600; overflow-wrap: anywhere; }
.inactive-label { font-size: 16px; color: #4c5d7a; }
.status-badge { display: inline-flex; align-items: center; white-space: nowrap; padding: 3px 7px; border-radius: 5px; background: #eef0f5; color: #4c5d7a; font-size: 16px; font-weight: 500; line-height: 1.4; }
.status-badge[data-status='complete'] { background: #e3f4ed; color: #187554; }
.status-badge[data-status='in_progress'] { background: #fff0d6; color: #90590c; }
.status-badge[data-status='not_configured'] { background: #eaf0fc; color: #496bb5; }
.category-counts { display: flex; flex-wrap: wrap; gap: 4px 11px; margin: 14px 0; font-size: 16px; color: #4c5d7a; }
.progress-label { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0 0 6px; font-size: 16px; color: #4c5d7a; }
.progress-label strong { color: #324986; font-size: 16px; }
.category-card-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; font-size: 16px; color: #4c5d7a; }
.category-detail { margin-top: 29px; scroll-margin-top: 20px; }
.detail-heading { align-items: flex-start; margin-bottom: 16px; }
.eyebrow { margin-bottom: 6px; color: #4c5d7a; font-size: 16px; letter-spacing: .08em; font-weight: 600; }
.detail-heading h2 { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; font-size: 26px; overflow-wrap: anywhere; }
.provisional-label { padding: 4px 8px; border-radius: 5px; background: #eef0fb; color: #4c5d7a; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 500; }
.category-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 17px; padding: 15px 0; border: 1px solid #dfe4ee; border-radius: 8px; background: #fff; }
.category-summary > div { display: flex; flex-direction: column; gap: 3px; padding: 0 17px; border-right: 1px solid #edf0f6; }
.category-summary > div:last-child { border: 0; }
.category-summary strong { font-size: 22px; font-weight: 600; color: #29366a; }
.category-summary strong small { font-size: 16px; color: #4c5d7a; font-weight: 400; }
.category-summary span { font-size: 16px; color: #4c5d7a; }
.monitor-panels { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr); align-items: start; gap: 17px; }
.panel { min-width: 0; padding: 18px; border: 1px solid #dfe4ee; border-radius: 9px; background: #fff; }
.panel-heading { align-items: flex-start; margin-bottom: 12px; }
.panel-heading h3 { display: flex; align-items: center; gap: 7px; font-size: 18px; color: #2e3c75; }
.scoring-note { margin: 7px 0 10px; color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.scoring-note strong { color: #5a6887; font-weight: 500; }
.select-label { display: flex; flex-direction: column; gap: 5px; font-size: 16px; font-weight: 500; color: #4c5d7a; }
.select-label select { min-width: 160px; max-width: 100%; min-height: 34px; padding: 7px 30px 7px 10px; border: 1px solid #d7deec; border-radius: 6px; background: #fff; color: #344673; font: inherit; font-size: 16px; }
.results-panel > .select-label { margin-bottom: 12px; }
.ranking-group + .ranking-group { margin-top: 22px; }
.ranking-group h4 { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin: 17px 0 7px; font-size: 16px; font-weight: 600; color: #49597f; }
.ranking-group h4 > span { font-size: 16px; font-weight: 400; color: #4c5d7a; }
.table-scroll { max-width: 100%; overflow-x: auto; border-radius: 4px; }
table { width: 100%; border-collapse: collapse; text-align: left; font-size: 16px; }
.ranking-table { min-width: 840px; }
th, td { padding: 11px 8px; vertical-align: middle; border-bottom: 1px solid #eff1f7; }
thead th { background: #f7f9fd; color: #4c5d7a; font-size: 16px; font-weight: 500; }
th small { display: block; margin-top: 3px; font-size: 16px; font-weight: 400; color: #4c5d7a; }
tbody th { font-weight: 500; color: #3b4a6e; }
tbody tr:last-child th, tbody tr:last-child td { border-bottom: 0; }
.numeric { text-align: right; font-variant-numeric: tabular-nums; }
.rank-number { color: #4c5d7a; font-weight: 600; font-size: 16px; }
.rank-number.leading { color: #263f96; }
.contestant-name { display: flex; align-items: center; gap: 9px; min-width: 150px; }
.contestant-avatar { display: flex; align-items: center; justify-content: center; flex: 0 0 31px; width: 31px; height: 31px; border-radius: 7px; overflow: hidden; background: #eef1fc; color: #466396; }
.contestant-avatar img { width: 100%; height: 100%; object-fit: cover; }
.contestant-name small { display: block; margin-top: 3px; color: #4c5d7a; font-size: 16px; font-weight: 400; }
.average-score { color: #263d95; font-weight: 600; font-size: 16px; }
.sheet-count { display: block; margin-bottom: 4px; color: #4c5d7a; font-size: 16px; }
.judge-status-summary { display: flex; flex-wrap: wrap; gap: 8px 12px; padding: 10px 0 5px; font-size: 16px; color: #4c5d7a; }
.judge-status-summary > span { display: inline-flex; align-items: center; gap: 5px; }
.legend-dot.in-progress { background: #d69227; }
.legend-dot.not-started { background: #a2adbf; }
.assignment-mode { margin: 7px 0 12px; font-size: 16px; color: #4c5d7a; }
.judge-progress-row { display: block; width: 100%; padding: 12px 11px; margin-top: 8px; border: 1px solid #e3e7f1; border-radius: 7px; background: #fff; color: #3b4b74; font: inherit; text-align: left; cursor: pointer; }
.judge-progress-row:hover, .judge-progress-row.selected { border-color: #8fa1d2; background: #f8faff; }
.judge-row-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 9px; margin-bottom: 11px; }
.judge-row-heading > strong { font-size: 16px; font-weight: 600; overflow-wrap: anywhere; }
.judge-row-footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px; margin-top: 9px; color: #4c5d7a; font-size: 16px; }
.judge-row-footer > span { display: flex; align-items: center; gap: 4px; }
.judge-detail-panel { margin-top: 17px; }
.judge-detail-heading .scoring-note { margin-bottom: 0; }
.selected-judge-heading { margin: 17px 0 13px; padding-top: 13px; border-top: 1px solid #edf0f7; }
.selected-judge-heading h4 { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 0 0 5px; font-size: 16px; font-weight: 600; }
.selected-judge-heading { flex-wrap: wrap; }
.selected-judge-heading p { margin: 0; color: #4c5d7a; font-size: 16px; }
.score-sheet-table { min-width: 940px; }
.score-sheet-table th { min-width: 100px; }
.sheet-contestant { min-width: 190px !important; }
.sheet-contestant .missing-summary { max-width: 270px; margin-top: 5px; color: #80561e; line-height: 1.7; }
.field-count { display: block; margin-top: 5px; color: #4c5d7a; font-size: 16px; }
.scored-field { font-weight: 600; color: #3e5c8b; font-variant-numeric: tabular-nums; }
.scored-field small { font-weight: 400; color: #4c5d7a; font-size: 16px; }
.missing-field { display: inline-block; padding: 4px 7px; border: 1px dashed #e0cba6; border-radius: 4px; color: #80561e; background: #fffbf3; font-size: 16px; white-space: nowrap; }
.missing-field.invalid { color: #af584e; border-color: #e1b9b4; background: #fff5f4; }
.saved-time { color: #4c5d7a; font-size: 16px; white-space: nowrap; }
.panel-empty { padding: 18px 0; color: #4c5d7a; font-size: 16px; line-height: 1.8; }
.empty-state, .loading-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 38px 18px; border: 1px dashed #d3dced; border-radius: 9px; background: #fff; text-align: center; color: #4c5d7a; }
.empty-state h3 { margin: 6px 0 0; color: #3e507d; font-size: 16px; }
.empty-state p { max-width: 420px; margin: 0 0 9px; font-size: 16px; line-height: 1.8; }
.loading-state { margin-top: 20px; }
.assignment-editor { padding: 17px; margin-bottom: 16px; border: 1px solid #ccd8f4; border-radius: 8px; background: #f6f8ff; }
.assignment-editor h3 { margin: 0; font-size: 16px; font-weight: 600; }
.assignment-editor p { margin: 7px 0 12px; font-size: 16px; line-height: 1.8; color: #4c5d7a; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 16px; color: #4d5f84; cursor: pointer; }
.checkbox-label input { width: 15px; height: 15px; accent-color: #273c93; }
.assignment-editor fieldset { margin-top: 15px; padding: 10px 0; border: 0; }
.assignment-editor legend { font-size: 16px; font-weight: 600; color: #4c5d7a; }
.assignment-options { display: flex; flex-wrap: wrap; gap: 13px 22px; margin-top: 8px; }
.assignment-editor .assignment-warning { color: #80561e; }
.button-row { display: flex; align-items: center; gap: 9px; margin-top: 15px; }
.assignment-editor .inline-error { color: #a5483e; }
.assignment-success { padding: 10px 13px; margin: 0 0 15px; border-radius: 6px; background: #e8f4ee; color: #297555; font-size: 16px; }
.sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1450px) { .monitor-panels { grid-template-columns: minmax(0, 1fr); } .judges-panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 13px; } .judges-panel > :not(.judge-progress-row) { grid-column: 1 / -1; } }
@media (max-width: 1100px) { .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .section-heading { flex-wrap: wrap; gap: 7px; } .overview-stats { gap: 10px; } .overview-stats article { padding: 17px 12px 13px; } .overview-stats article > svg { display: none; } .overview-stats strong { font-size: 28px; } .overview-stats article > span { font-size: 16px; } }
@media (max-width: 600px) { .monitor-toolbar { align-items: flex-start; gap: 10px; } .monitor-toolbar h2 { font-size: 17px; } .monitor-toolbar h2 > svg { display: none; } .refresh-button { min-height: 33px; padding: 8px; font-size: 16px; } .sync-status { font-size: 16px; line-height: 1.7; } .overview-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } .overall-progress { flex-wrap: wrap; gap: 8px; } .overall-progress > progress { flex-basis: 100%; order: 3; } .overall-progress > span:last-child { margin-left: auto; } .category-grid { grid-template-columns: minmax(0, 1fr); } .category-card { padding: 15px; } .quick-actions { margin-bottom: 24px; } .detail-heading, .judge-detail-heading, .selected-judge-heading { flex-direction: column; align-items: stretch; gap: 10px; } .detail-heading > .button { align-self: flex-start; } .category-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 15px 0; } .category-summary > div:nth-child(2) { border: 0; } .panel { padding: 14px; } .panel-heading { flex-wrap: wrap; gap: 5px; } .judges-panel { grid-template-columns: minmax(0, 1fr); } .assignment-options { flex-direction: column; } .section-heading h2 { font-size: 20px; } .detail-heading h2 { font-size: 23px; } }
@media (prefers-reduced-motion: reduce) { .spinning { animation: none; } progress::-webkit-progress-value, .category-card { transition: none; } }
</style>
