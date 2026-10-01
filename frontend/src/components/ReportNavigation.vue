<script setup>
import { BarChart3, FileText } from 'lucide-vue-next';

defineProps({ active: { type: String, required: true } });
</script>

<template>
  <nav class="report-navigation" aria-label="Report formats">
    <RouterLink to="/reports" :class="{ active: active === 'overview' }" :aria-current="active === 'overview' ? 'page' : undefined">
      <BarChart3 :size="22" aria-hidden="true" />
      <span><strong>Rankings &amp; summary reports</strong><small>Final standings, category results, voting progress and judge summaries</small></span>
    </RouterLink>
    <RouterLink to="/reports/judge-category" :class="{ active: active === 'individual' }" :aria-current="active === 'individual' ? 'page' : undefined">
      <FileText :size="22" aria-hidden="true" />
      <span><strong>Individual judge/category record</strong><small>One judge · one category · one group · exact criterion scores</small></span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.report-navigation { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin: 22px 0; font-family: 'Poppins', sans-serif; font-size: 16px; line-height: 1.6; }
.report-navigation a { display: flex; align-items: flex-start; gap: 12px; padding: 17px; border: 1px solid #cbd4e6; border-radius: 8px; background: #fff; color: #33466f; text-decoration: none; }
.report-navigation svg { flex-shrink: 0; margin-top: 3px; }
.report-navigation strong { display: block; font-weight: 600; }
.report-navigation small { display: block; margin-top: 5px; font-size: 16px; color: #4c5d7a; }
.report-navigation a.active { border-color: #292e91; background: linear-gradient(125deg, #151d7e, #090b4f); color: #fff; }
.report-navigation a.active small { color: #d8e1ff; }
.report-navigation a:hover { border-color: #617bcc; }
.report-navigation a:focus-visible { outline: 3px solid #738ff4; outline-offset: 3px; }
@media (max-width: 900px) { .report-navigation { grid-template-columns: minmax(0, 1fr); } }
@media print { .report-navigation { display: none; } }
</style>
