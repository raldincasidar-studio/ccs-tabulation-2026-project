import api from './api'

export const judgeService = {
  // Fetches the current live scoring sheet (Category, active contestant, rubrics, existing scores)
  async getLiveSheet() {
    return await api.get('/scores/live-sheet')
  },

  // Fetches all categories if endpoint exists, or provides defaults matching the event
  async getCategories() {
    try {
      const response = await api.get('/categories')
      return response.data || response
    } catch {

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

  // Save/Update score endpoint
  async submitScore(payload) {
    return await api.post('/scores', payload)
  }
}

export default judgeService