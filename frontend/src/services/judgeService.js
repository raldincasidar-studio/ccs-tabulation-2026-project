import api from './api'

export const judgeService = {
  // Fetches current live category, active contestant, rubrics, and existing scores
  async getLiveSheet() {
    const response = await api.get('/scores/live-sheet')
    return response.data !== undefined ? response.data : response
  },


  async getCategories() {
    try {
      const response = await api.get('/categories')
      const result = response.data !== undefined ? response.data : response
      return Array.isArray(result) ? result : (result?.data || result)
    } catch (error) {
      console.warn('Failed to fetch categories, using defaults:', error.message || error)
      return [
        { id: 'playsuit', name: 'PLAYSUIT' },
        { id: 'uniform-1', name: 'UNIFORM' },
        { id: 'uniform-2', name: 'UNIFORM' },
        { id: 'prod-no', name: 'PRODUCTION NO' },
        { id: 'advocacy', name: 'ADVOCACY' },
        { id: 'q-and-a', name: 'Q AND A' },
        { id: 'qa-final', name: 'Q & A FINAL' },
      ]
    }
  },

  // Fetches all registered contestants (supports optional params e.g. { groupId })
  async getContestants(params = {}) {
    try {
      const response = await api.get('/contestants', { params })
      const result = response.data !== undefined ? response.data : response
      return Array.isArray(result) ? result : (result?.data || result)
    } catch (error) {
      console.warn('Failed to fetch contestants:', error.message || error)
      return []
    }
  },

  // Fetches groups (e.g. "Pageant Male", "Pageant Female") with linked categories
  async getContestantGroups() {
    try {
      const response = await api.get('/contestant-groups')
      const result = response.data !== undefined ? response.data : response
      return Array.isArray(result) ? result : (result?.data || result)
    } catch (error) {
      console.warn('Failed to fetch contestant groups:', error.message || error)
      return []
    }
  },

  // Submits or updates a judge's scores for a category and contestant
  // Expected payload: { categoryId: string, contestantId: string, rubricsScore: [{ rubricsId, score }] }
  async submitScore(payload) {
    const response = await api.post('/scores/submit', payload)
    return response.data !== undefined ? response.data : response
  }
}

export default judgeService