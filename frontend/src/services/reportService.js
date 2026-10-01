import api from './api.js';

export async function getReportOptions(signal) {
  const [judges, categories, groups] = await Promise.all([
    api.get('/judges', { signal, timeout: 15000 }),
    api.get('/categories', { signal, timeout: 15000 }),
    api.get('/contestant-groups', { signal, timeout: 15000 }),
  ]);
  if (![judges.data, categories.data, groups.data].every(Array.isArray)) {
    throw new Error('The server returned invalid report selection data.');
  }
  return { judges: judges.data, categories: categories.data, groups: groups.data };
}

export async function getJudgeCategoryReport({ judgeId, categoryId, groupId }, signal) {
  const response = await api.get(`/reports/paper/judge-scoresheet/${judgeId}`, {
    params: { categoryId, groupId }, signal, timeout: 15000,
  });
  const report = response.data;
  if (report?.scope?.judgeId !== judgeId || report?.scope?.categoryId !== categoryId ||
    report?.scope?.groupId !== groupId || !Array.isArray(report.criteria) || !Array.isArray(report.rows) || !report.summary) {
    throw new Error('The returned report does not match the selected judge, category and group. Printing was blocked.');
  }
  return report;
}
