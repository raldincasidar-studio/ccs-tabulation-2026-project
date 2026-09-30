import api from './api';

function unwrapData(response) {
  return response?.data !== undefined ? response.data : response;
}

export const contestantService = {
  async getContestants() {
    return unwrapData(await api.get('/contestants'));
  },

  async getContestantGroups() {
    return unwrapData(await api.get('/contestant-groups'));
  },

  async createContestant(payload) {
    return unwrapData(await api.post('/contestants', payload));
  },

  async updateContestant(id, payload) {
    return unwrapData(await api.put(`/contestants/${id}`, payload));
  },
};

export default contestantService;