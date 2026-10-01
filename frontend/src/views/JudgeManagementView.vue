<script setup>
import { onMounted, ref } from 'vue'
import api from '@/services/api'
import JudgeForm from '@/views/JudgeForm.vue'
import JudgeManagementTable from '@/views/JudgeManagementTable.vue'

const viewMode = ref('list')
const selectedJudge = ref(null)
const judges = ref([])
const isLoading = ref(true)
const errorMessage = ref('')
const formErrorMessage = ref('')
const successMessage = ref('')

async function loadJudges() {
  isLoading.value = true
  errorMessage.value = ''
  formErrorMessage.value = ''

  try {
    const response = await api.get('/judges')
    const result = Array.isArray(response) ? response : response?.data
    if (!Array.isArray(result)) {
      throw new Error('Unexpected response while loading judges.')
    }
    judges.value = result
  } catch (error) {
    errorMessage.value = error?.message || 'Unable to load judges.'
  } finally {
    isLoading.value = false
  }
}

function handleAdd() {
  selectedJudge.value = null
  formErrorMessage.value = ''
  successMessage.value = ''
  viewMode.value = 'form'
}

function handleEdit(judge) {
  selectedJudge.value = judge
  formErrorMessage.value = ''
  successMessage.value = ''
  viewMode.value = 'form'
}

async function handleDelete(judge) {
  if (isLoading.value || !judge?._id) return

  const fullName = [judge.firstName, judge.lastName].filter(Boolean).join(' ') || judge.username || 'this judge'
  const confirmed = window.confirm(`Delete ${fullName}?`)

  if (!confirmed) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await api.delete(`/judges/${judge._id}`)
    successMessage.value = response?.message || 'Judge deleted successfully.'
    await loadJudges()
  } catch (error) {
    successMessage.value = ''
    errorMessage.value = error?.message || 'Unable to delete judge.'
  } finally {
    isLoading.value = false
  }
}

async function handleSave(formData) {
  if (isLoading.value) return

  isLoading.value = true
  formErrorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      username: formData.username.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      isActive: formData.isActive,
    }

    if (!selectedJudge.value?._id || formData.password) {
      payload.password = formData.password
    }

    if (selectedJudge.value?._id) {
      await api.put(`/judges/${selectedJudge.value._id}`, payload)
    } else {
      await api.post('/judges', payload)
    }

    selectedJudge.value = null
    viewMode.value = 'list'
    successMessage.value = 'Judge saved successfully.'
    await loadJudges()
  } catch (error) {
    formErrorMessage.value = error?.message || 'Unable to save judge.'
  } finally {
    isLoading.value = false
  }
}

function handleCancel() {
  selectedJudge.value = null
  formErrorMessage.value = ''
  viewMode.value = 'list'
}

onMounted(loadJudges)
</script>

<template>
  <div class="judge-management-view">
    <p
      v-if="successMessage && viewMode === 'list'"
      class="mx-4 mb-4 rounded-md border border-emerald-300/30 bg-emerald-950/50 px-4 py-3 text-base text-emerald-200 sm:mx-6 md:mx-8"
      role="status"
    >
      {{ successMessage }}
    </p>

    <JudgeManagementTable
      v-if="viewMode === 'list'"
      :judges="judges"
      :is-loading="isLoading"
      :error-message="errorMessage"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <JudgeForm
      v-else
      :initial-data="selectedJudge"
      :error-message="formErrorMessage"
      :is-loading="isLoading"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </div>
</template>

<style scoped>
.judge-management-view {
  width: 100%;
}
</style>
