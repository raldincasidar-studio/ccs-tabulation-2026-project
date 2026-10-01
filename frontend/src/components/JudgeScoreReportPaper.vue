<script setup>
import mrMsLogo from '@/assets/img/mr-ms-css-logo.png';
import ccsLogo from '@/assets/img/ccs-logo.png';
import { formatRecordedScore, formatReportDate, reportStatusLabel, rowStatusLabel } from '@/utils/reportFormat.js';

defineProps({ report: { type: Object, required: true } });
</script>

<template>
  <article class="judge-score-paper" :class="{ landscape: report.criteria.length > 4 }" aria-label="Individual judge category score report">
    <header class="paper-header">
      <img :src="mrMsLogo" alt="Mr. and Ms. CCS" />
      <div class="paper-header-copy"><p>{{ report.header.country }}</p><p class="institution">{{ report.header.institution }}</p><p>{{ report.header.college }}</p></div>
      <img :src="ccsLogo" alt="College of Computing Studies" />
    </header>

    <h1 class="paper-event">{{ report.header.eventTitle }}</h1>
    <h2 class="paper-title">{{ report.header.title }}</h2>
    <h3 class="paper-category">{{ report.category.name }}</h3>

    <dl class="paper-scope">
      <div><dt>Judge</dt><dd>{{ report.judge.name }}</dd></div>
      <div><dt>Pageant / Group</dt><dd>{{ report.group.name }}</dd></div>
    </dl>
    <div class="paper-metadata"><span>Prepared: {{ formatReportDate(report.generatedAt) }}</span><span>Reference: {{ report.reference }}</span></div>
    <p class="paper-status" :class="{ incomplete: report.status !== 'complete' }"><strong>{{ reportStatusLabel(report.status) }}</strong> · {{ report.summary.completedContestants }} / {{ report.summary.totalContestants }} candidates fully scored · {{ report.summary.scoredFields }} / {{ report.summary.requiredFields }} required fields scored</p>
    <p v-if="report.status === 'needs_review'" class="paper-review-note">Saved data requires review. Invalid, duplicate and unrecognized criterion entries are shown as recorded; they have not been changed or silently removed.</p>
    <p v-if="!report.group.isCurrentlyLinked" class="paper-review-note">Historical scope: this category is no longer linked to this group. This record retains the judge's saved entries for the selected group.</p>

    <table class="paper-table">
      <caption class="sr-only">{{ report.judge.name }} — {{ report.category.name }} — {{ report.group.name }}: individual saved scores per criterion and candidate</caption>
      <colgroup><col class="number-column" /><col class="candidate-column" /><col v-for="criterion in report.criteria" :key="criterion.rubricsId" /><col class="total-column" /><col class="status-column" /></colgroup>
      <thead>
        <tr class="repeated-scope"><th :colspan="4 + report.criteria.length">{{ report.judge.name }} · {{ report.category.name }} · {{ report.group.name }}<small>{{ report.reference }}</small></th></tr>
        <tr>
          <th scope="col" class="paper-center">No.</th><th scope="col">Candidate / Label</th>
          <th v-for="criterion in report.criteria" :key="criterion.rubricsId" scope="col" class="paper-center">{{ criterion.name }}<small>{{ criterion.isCurrent ? `Max ${formatRecordedScore(criterion.maxPoints)} pts` : 'Legacy entry · review' }}</small></th>
          <th scope="col" class="paper-center">Saved total<small>Raw points</small></th><th scope="col" class="paper-center">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="report.rows.length === 0"><td :colspan="4 + report.criteria.length" class="paper-center">No registered candidates in this group.</td></tr>
        <tr v-for="row in report.rows" :key="row.contestantId">
          <td class="paper-center">{{ row.rowNumber }}</td>
          <th scope="row" class="candidate-cell"><strong>{{ row.name }}</strong><span>{{ row.label }}</span><small v-if="!row.isActive">Inactive registration · saved record retained</small></th>
          <td v-for="field in row.fields" :key="field.rubricsId" class="paper-center" :class="{ 'review-cell': field.status === 'review', 'missing-cell': field.status === 'missing' }">
            <span v-if="field.status === 'missing'" aria-label="Not scored">—</span>
            <template v-else><span class="recorded-score">{{ field.recordedValues.map(formatRecordedScore).join(' / ') }}</span><small v-if="field.status === 'review'">{{ field.issue === 'duplicate_values' ? 'Duplicate values · review' : field.issue === 'unknown_criterion' ? 'Legacy criterion · review' : 'Invalid value · review' }}</small></template>
          </td>
          <td class="paper-center total-cell"><strong>{{ row.totalScore ?? '—' }}</strong><small v-if="row.status === 'in_progress' && row.totalScore !== null">Partial total</small><small v-if="row.status === 'needs_review'">Review required</small></td>
          <td class="paper-center"><span>{{ rowStatusLabel(row.status) }}</span><small>{{ row.scoredFields }} / {{ row.requiredFields }} fields</small><small v-if="row.duplicateScoreSheets">Duplicate sheets · latest saved entry shown</small></td>
        </tr>
      </tbody>
    </table>

    <div class="paper-notes">
      <p><strong>Legend:</strong> — = not scored. Numeric 0 is an entered score. Totals are this judge's raw criterion points only; no averaging, category weighting or other judges' scores are included.</p>
      <p><strong>Record scope:</strong> One judge, one category and one pageant/group. Values reflect the latest stored score sheet per candidate at preparation time; this is not a combined ranking or an electronic finalization.</p>
      <p>Last saved score in this scope: {{ formatReportDate(report.lastSavedAt) }}</p>
    </div>

    <section class="paper-certification" aria-label="Selected judge certification">
      <p>I certify that the scores recorded above are my own entered scores for <strong>{{ report.category.name }}</strong> in <strong>{{ report.group.name }}</strong>.</p>
      <div class="paper-single-signature"><span class="signature-line" aria-hidden="true"></span><strong>{{ report.judge.name }}</strong><em>Judge's signature above printed name</em><span class="signature-date">Date: ____________________</span></div>
    </section>
    <footer class="paper-footer">{{ report.reference }} · {{ report.judge.name }} · {{ report.category.name }} · {{ report.group.name }}</footer>
  </article>
</template>

<style scoped>
.judge-score-paper { box-sizing: border-box; width: 100%; min-width: 650px; padding: 30px 28px; border: 1px solid #1688e8; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.4; }
.judge-score-paper.landscape { min-width: 930px; }
.paper-header { display: grid; grid-template-columns: 78px minmax(0, 1fr) 78px; align-items: center; gap: 12px; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #777; text-align: center; }
.paper-header img { display: block; width: 76px; height: 76px; object-fit: contain; }
.paper-header-copy p { margin: 2px 0; font-size: 11px; }
.paper-header-copy .institution { font-weight: 700; }
.paper-event, .paper-title, .paper-category { margin: 5px 0; text-align: center; overflow-wrap: anywhere; }
.paper-event { font-size: 18px; font-weight: 700; }
.paper-title { font-size: 16px; font-weight: 700; }
.paper-category { margin: 10px 0 17px; font-size: 15px; font-weight: 700; text-transform: uppercase; }
.paper-scope { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 10px; padding: 10px 12px; border: 1px solid #ccc; }
.paper-scope > div { min-width: 0; }
.paper-scope dt { font-size: 10px; }
.paper-scope dd { margin: 2px 0 0; font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
.paper-metadata { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 5px; margin: 9px 0; font-size: 9px; color: #444; }
.paper-status { margin: 10px 0 13px; font-size: 10px; }
.paper-status.incomplete { padding: 7px; border: 1px solid #a8a8a8; }
.paper-review-note { margin: 7px 0 12px; font-size: 10px; color: #734119; }
.paper-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 11px; }
.number-column { width: 5%; }
.candidate-column { width: 25%; }
.total-column { width: 11%; }
.status-column { width: 13%; }
.paper-table th, .paper-table td { padding: 8px 6px; border: 1px solid #222; vertical-align: middle; overflow-wrap: anywhere; }
.paper-table thead th { background: #f5f5f5; font-size: 10px; font-weight: 700; }
.paper-table .repeated-scope th { padding: 6px; font-size: 9px; font-weight: 400; }
.repeated-scope small { margin-left: 8px; font-size: 8px; }
.paper-table small { display: block; margin-top: 3px; font-size: 9px; font-weight: 400; line-height: 1.4; }
.paper-center { text-align: center; }
.candidate-cell { text-align: left; font-weight: 400; }
.candidate-cell > span, .candidate-cell > small { display: block; margin-top: 3px; }
.candidate-cell > span { font-size: 10px; }
.missing-cell { color: #777; }
.review-cell { background: #fff7ed; }
.recorded-score, .total-cell { font-variant-numeric: tabular-nums; }
.paper-notes { margin-top: 13px; font-size: 9px; color: #333; line-height: 1.6; }
.paper-notes p { margin: 4px 0; }
.paper-certification { margin-top: 25px; break-inside: avoid; page-break-inside: avoid; }
.paper-certification > p { font-size: 11px; font-style: italic; line-height: 1.6; }
.paper-single-signature { display: flex; flex-direction: column; align-items: center; gap: 6px; width: 235px; margin: 38px auto 0; text-align: center; }
.signature-line { width: 100%; border-top: 1px solid #555; }
.paper-single-signature > strong { max-width: 100%; overflow-wrap: anywhere; font-size: 12px; }
.paper-single-signature > em { font-size: 10px; }
.signature-date { margin-top: 9px; font-size: 10px; }
.paper-footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #ddd; font-size: 8px; color: #666; text-align: center; overflow-wrap: anywhere; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media print {
  .judge-score-paper, .judge-score-paper.landscape { width: 100%; min-width: 0; padding: 5mm 5mm 6mm; font-size: 9pt; box-shadow: none; }
  .paper-header { grid-template-columns: 20mm minmax(0, 1fr) 20mm; gap: 3mm; margin-bottom: 5mm; padding-bottom: 3mm; }
  .paper-header img { width: 20mm; height: 20mm; }
  .paper-header-copy p { font-size: 8pt; }
  .paper-event { font-size: 14pt; }
  .paper-title { font-size: 12pt; }
  .paper-category { font-size: 11pt; margin-bottom: 4mm; }
  .paper-scope { break-inside: avoid; padding: 2mm 3mm; }
  .paper-scope dd { font-size: 10pt; }
  .paper-table { font-size: 8pt; }
  .landscape .paper-table { font-size: 7.5pt; }
  .paper-table th, .paper-table td { padding: 2mm 1.4mm; }
  .paper-table thead th { font-size: 8pt; }
  .paper-table small { font-size: 6.5pt; }
  .paper-table thead { display: table-header-group; }
  .paper-table tbody { display: table-row-group; }
  .paper-table tr { break-inside: avoid; page-break-inside: avoid; }
  .paper-table { break-inside: auto; page-break-inside: auto; }
  .paper-notes { font-size: 7pt; }
  .paper-certification { margin-top: 7mm; }
  .paper-certification > p { font-size: 8pt; }
  .paper-single-signature { width: 55mm; margin-top: 10mm; }
  .paper-single-signature > strong { font-size: 9pt; }
  .paper-single-signature > em, .signature-date { font-size: 7.5pt; }
  .paper-footer { font-size: 6.5pt; }
}
</style>
