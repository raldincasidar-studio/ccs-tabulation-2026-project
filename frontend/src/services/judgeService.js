import api from './api'

export const judgeService = {
  // 7.1 GET /api/v1/scores/live-sheet
  // Fetches current live category, active contestant, rubrics, and existing scores
  async getLiveSheet() {
    const response = await api.get('/scores/live-sheet')
    return response.data !== undefined ? response.data : response
  },

  // 4.1 GET /api/v1/categories
  // Fetches all categories and their embedded rubrics
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

  // 6.1 GET /api/v1/contestants
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

  // 5.1 GET /api/v1/contestant-groups
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

  // 7.2 POST /api/v1/scores/submit
  // Submits or updates a judge's scores for a category and contestant
  // Expected payload: { categoryId: string, contestantId: string, rubricsScore: [{ rubricsId, score }] }
  async submitScore(payload) {
    const response = await api.post('/scores/submit', payload)
    return response.data !== undefined ? response.data : response
  }
}

export default judgeService