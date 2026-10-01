<script setup>
import mrMsLogo from '@/assets/img/mr-ms-css-logo.png';
import ccsLogo from '@/assets/img/ccs-logo.png';
import { formatReportDate } from '@/utils/reportFormat.js';

defineProps({ report: { type: Object, required: true }, details: { type: Object, default: () => ({}) } });
const points = (value, decimals = 2) => value == null ? '—' : new Intl.NumberFormat('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
const status = (value) => ({ complete: 'Complete', in_progress: 'Partial', not_started: 'Not scored', not_required: 'Not required', needs_review: 'Review required' }[value] ?? value);
const eventDate = (value) => {
  if (!value) return '____________________';
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? '____________________' : new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'long' }).format(date);
};
</script>

<template>
  <article class="category-results-paper" aria-label="Category results with separate judge totals">
    <header class="results-header">
      <img :src="mrMsLogo" alt="Mr. and Ms. CCS" />
      <div><p>Republic of the Philippines</p><p class="institution">{{ report.header.institution }}</p><p>{{ report.header.college }}</p></div>
      <img :src="ccsLogo" alt="College of Computing Studies" />
    </header>
    <h1>{{ report.eventTitle }}</h1>
    <h2>FINAL RESULTS — {{ report.category.name.toUpperCase() }} ({{ report.category.weight }}%)</h2>
    <p class="scope-title">{{ report.group.name }} · {{ eventDate(details.eventDate) }} · {{ details.venue || 'Venue: ____________________' }}</p>
    <dl class="results-metadata">
      <div><dt>Category:</dt><dd>{{ report.category.name }} ({{ report.category.weight }}%)</dd></div>
      <div><dt>Pageant / Group:</dt><dd>{{ report.group.name }}</dd></div>
      <div class="judge-list"><dt>Judges:</dt><dd><span v-for="judge in report.judges" :key="judge.judgeId">{{ judge.label }}: {{ judge.judgeName }}</span><span v-if="!report.judges.length">No assigned judges</span></dd></div>
      <div><dt>Generated:</dt><dd>{{ formatReportDate(report.generatedAt) }}</dd></div>
    </dl>
    <p class="results-status"><strong>{{ report.scoringComplete ? 'All required score fields are complete.' : 'PROVISIONAL — scoring is incomplete or requires review.' }}</strong> This sheet is not an electronic finalization; certification is manual.</p>
    <table class="results-table">
      <caption>Separate judge totals for {{ report.category.name }} — {{ report.group.name }}</caption>
      <colgroup><col class="label-column" /><col class="name-column" /><col v-for="judge in report.judges" :key="judge.judgeId" /><col /><col /><col /><col class="rank-column" /></colgroup>
      <thead>
        <tr class="repeated-scope"><th :colspan="6 + report.judges.length">{{ report.eventTitle }} · {{ report.category.name }} ({{ report.category.weight }}%) · {{ report.group.name }}</th></tr>
        <tr><th scope="col">Cand. No. / Label</th><th scope="col">Candidate Name</th><th v-for="judge in report.judges" :key="judge.judgeId" scope="col">{{ judge.label }}<small>Total raw</small></th><th scope="col">Total Raw</th><th scope="col">Average Raw</th><th scope="col">Weighted Total</th><th scope="col">Final Rank</th></tr>
      </thead>
      <tbody>
        <tr v-if="!report.rows.length"><td :colspan="6 + report.judges.length">No eligible candidates in this group.</td></tr>
        <tr v-for="row in report.rows" :key="row.contestantId">
          <td>{{ row.label }}</td><th scope="row" class="candidate-name">{{ row.name }}<small v-if="row.status !== 'complete'">{{ status(row.status) }}</small></th>
          <td v-for="judge in row.judgeTotals" :key="judge.judgeId">{{ points(judge.totalRaw, 0 === judge.totalRaw % 1 ? 0 : 2) }}<small v-if="judge.status !== 'complete'">{{ status(judge.status) }}</small></td>
          <td>{{ points(row.totalRaw, 0 === row.totalRaw % 1 ? 0 : 2) }}</td><td>{{ points(row.averageRaw) }}<small v-if="row.submittedJudges !== report.judges.length">{{ row.submittedJudges }} / {{ report.judges.length }} judges scored</small></td><td><strong>{{ points(row.weightedTotal) }}</strong></td><td><strong>{{ row.rank ?? '—' }}</strong></td>
        </tr>
      </tbody>
    </table>
    <div class="results-legend">
      <p><strong>Legend:</strong> Total raw = sum of valid recorded criterion points across assigned judges. Average raw = total raw ÷ judges with at least one valid saved field. Weighted total = total raw × {{ report.category.weight }} / 100 ({{ report.category.weight / 100 }}).</p>
      <p>— = not scored; 0 is a saved score. Partial/review totals are identified above. Display totals use up to two decimal places; unrounded totals determine the provisional category rank.</p>
      <p><strong>Ties:</strong> {{ report.tiePolicy }} This category's weighted raw sum is separate from overall standings, which weight the category average.</p>
    </div>
    <p class="certification">We certify that the above tabulation reflects the recorded scores for <strong>{{ report.category.name }}</strong> in <strong>{{ report.group.name }}</strong>, subject to any incomplete/review entries indicated.</p>
    <section class="judge-signatures" aria-label="Judges' manual signatures">
      <div v-for="judge in report.judges" :key="judge.judgeId" class="signature"><span class="signature-line"></span><strong>{{ judge.judgeName }}</strong><em>{{ judge.label }} — signature above printed name</em></div>
    </section>
    <section class="official-signatures" aria-label="Tabulator and optional chairperson signatures">
      <div class="signature"><span class="signature-line"></span><strong>{{ details.tabulatorName || '____________________' }}</strong><em>Tabulator — signature above printed name</em><span>Date: ____________________</span></div>
      <div v-if="details.includeChairperson" class="signature"><span class="signature-line"></span><strong>{{ details.chairpersonName || '____________________' }}</strong><em>Chairperson (optional) — signature above printed name</em><span>Date: ____________________</span></div>
    </section>
    <footer>{{ report.group.name }} · {{ report.category.name }} · Generated {{ formatReportDate(report.generatedAt) }}</footer>
  </article>
</template>

<style scoped>
.category-results-paper { box-sizing: border-box; min-width: 1000px; padding: 30px 28px; border: 1px solid #1688e8; background: #fff; color: #111; font: 16px/1.5 Arial, Helvetica, sans-serif; }
.results-header { display: grid; grid-template-columns: 78px minmax(0, 1fr) 78px; align-items: center; gap: 12px; padding-bottom: 12px; border-bottom: 1px solid #777; text-align: center; }
.results-header img { width: 76px; height: 76px; object-fit: contain; }
.results-header p { margin: 2px 0; }
.institution { font-weight: 700; }
h1, h2 { margin: 12px 0 6px; text-align: center; font-weight: 700; }
h1 { font-size: 23px; } h2 { font-size: 20px; }
.scope-title { margin: 6px 0 18px; text-align: center; }
.results-metadata { display: grid; gap: 6px; margin: 16px 0; }
.results-metadata > div { display: flex; align-items: flex-start; gap: 7px; }
dt { flex-shrink: 0; font-weight: 700; } dd { margin: 0; overflow-wrap: anywhere; }
.judge-list dd { display: flex; flex-wrap: wrap; gap: 4px 20px; }
.results-status { margin: 12px 0; padding: 9px; border: 1px solid #777; }
.results-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.results-table caption { margin-bottom: 8px; text-align: left; }
.results-table th, .results-table td { padding: 9px 6px; border: 1px solid #222; text-align: center; overflow-wrap: anywhere; vertical-align: middle; font-variant-numeric: tabular-nums; }
.results-table thead th { background: #f4f4f4; font-weight: 700; }
.results-table small { display: block; margin-top: 4px; font-size: inherit; font-weight: 400; }
.results-table .candidate-name { text-align: left; }
.label-column { width: 9%; } .name-column { width: 18%; } .rank-column { width: 7%; }
.repeated-scope th { font-weight: 400 !important; }
.results-legend { margin-top: 14px; } .results-legend p { margin: 6px 0; }
.certification { margin: 22px 0 10px; font-style: italic; }
.judge-signatures { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 30px 20px; margin-top: 35px; }
.signature { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; break-inside: avoid; }
.signature-line { width: 100%; max-width: 260px; border-top: 1px solid #333; }
.signature strong { overflow-wrap: anywhere; }
.official-signatures { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 30px; margin-top: 45px; }
footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #ddd; text-align: center; }
@media print {
  .category-results-paper { width: 100%; min-width: 0; padding: 6mm; font-size: 10pt; line-height: 1.4; }
  .results-header { grid-template-columns: 20mm minmax(0, 1fr) 20mm; gap: 3mm; padding-bottom: 3mm; font-size: 9pt; }
  .results-header img { width: 20mm; height: 20mm; }
  h1 { font-size: 16pt; } h2 { font-size: 13pt; }
  .results-metadata { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5mm 4mm; margin: 4mm 0; font-size: 9pt; }
  .results-metadata .judge-list, .results-metadata > div:last-child { grid-column: 1 / -1; }
  .results-table caption { display: none; }
  .results-table { font-size: 9pt; } .results-table th, .results-table td { padding: 2mm 1.2mm; }
  .results-table small { font-size: 8pt; }
  thead { display: table-header-group; } tr { break-inside: avoid; page-break-inside: avoid; }
  .results-legend, .certification { font-size: 9pt; }
  .judge-signatures { gap: 10mm 6mm; margin-top: 10mm; font-size: 9pt; }
  .official-signatures { margin-top: 12mm; font-size: 9pt; }
  footer { font-size: 8pt; }
}
</style>
