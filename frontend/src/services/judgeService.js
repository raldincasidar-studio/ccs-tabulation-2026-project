import api from './api'

export const judgeService = {
  // 7.1 GET /api/v1/scores/live-sheet
  // Fetches current category, active contestant, rubrics, and existingScores
  async getLiveSheet() {
    const response = await api.get('/scores/live-sheet')
    return response.data !== undefined ? response.data : response
  },

  // 4.1 GET /api/v1/categories
  async getCategories() {
    try {
      const response = await api.get('/categories')
      const result = response.data !== undefined ? response.data : response
      return Array.isArray(result) ? result : (result?.data || result)
    } catch (error) {
      console.warn('Failed to fetch categories:', error.message || error)
      return []
    }
  },

  // 6.1 GET /api/v1/contestants (Accepts { groupId: string })
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
  // Payload: { categoryId: string, contestantId: string, rubricsScore: [{ rubricsId, score }] }
  async submitScore(payload) {
    const response = await api.post('/scores/submit', payload)
    return response.data !== undefined ? response.data : response
  }
}

export default judgeService