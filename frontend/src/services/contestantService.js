import api from './api.js';

export async function getContestants(groupId = null) {
  const params = {};

  if (groupId) {
    params.groupId = groupId;
  }

  const response = await api.get('/contestants', { params });
  return response?.data ?? response;
}

export async function createContestant(contestantData) {
  const response = await api.post('/contestants', contestantData);
  return response?.data ?? response;
}

export async function updateContestant(id, contestantData) {
  const response = await api.put(`/contestants/${id}`, contestantData);
  return response?.data ?? response;
}

export async function deleteContestant(id) {
  const response = await api.delete(`/contestants/${id}`);
  return response?.data ?? response;
}
