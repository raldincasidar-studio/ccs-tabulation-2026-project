import api from './api.js';

export async function getScoringDashboard(signal) {
  const response = await api.get('/dashboard/scoring', { signal, timeout: 15000 });
  // The shared API interceptor already unwraps Axios's response, leaving the
  // standard contract envelope { success, message, data }.
  return response.data;
}

export async function updateCategoryJudges(categoryId, assignedJudges) {
  const response = await api.patch(`/dashboard/categories/${categoryId}/judges`, { assignedJudges });
  return response.data;
}
