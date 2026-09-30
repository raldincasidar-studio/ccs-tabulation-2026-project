import api from './api';

export const configService = {
  // --- Global Event Configuration ---
  getConfiguration: async () => {
    return await api.get('/configuration');
  },

  updateConfiguration: async (payload) => {
    // payload: { eventTitle: string, eventDescription: string }
    return await api.put('/configuration', payload);
  },

  updateLiveStatus: async (payload) => {
    // payload: { categoryActive: string, contestantActive: string }
    return await api.patch('/configuration/live-status', payload);
  },

  // --- Contestant Groups ---
  getContestantGroups: async () => {
    return await api.get('/contestant-groups');
  },

  createContestantGroup: async (groupData) => {
    // groupData: { name: string, categoriesIncluded: string[] }
    return await api.post('/contestant-groups', groupData);
  },

  updateContestantGroup: async (id, groupData) => {
    return await api.put(`/contestant-groups/${id}`, groupData);
  },

  deleteContestantGroup: async (id) => {
    return await api.delete(`/contestant-groups/${id}`);
  },

  // --- Categories & Rubrics ---
  getCategories: async () => {
    return await api.get('/categories');
  },

  createCategory: async (categoryData) => {
    // categoryData: { name, description, weight, isActive, rubrics: [{ name, maxPoints }] }
    return await api.post('/categories', categoryData);
  },

  updateCategory: async (id, categoryData) => {
    return await api.put(`/categories/${id}`, categoryData);
  },

  deleteCategory: async (id) => {
    return await api.delete(`/categories/${id}`);
  }
};

export default configService;