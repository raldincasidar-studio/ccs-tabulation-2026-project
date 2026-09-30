<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  initialData: {
    type: Object,
    default: null,
  },
  errorMessage: {
    type: String,
    default: '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['save', 'cancel'])

const form = ref({
  number: '5',
  firstName: '',
  lastName: '',
  password: '',
  username: '',
  confirmPassword: '',
  isActive: true,
})

const localError = ref('')
const formError = computed(() => props.errorMessage || localError.value)

watch(
  () => props.initialData,
  (value) => {
    const judge = value || {}
    form.value = {
      number: judge.number ?? '5',
      firstName: judge.firstName ?? '',
      lastName: judge.lastName ?? '',
      password: '',
      username: judge.username ?? '',
      confirmPassword: '',
      isActive: judge.isActive ?? true,
    }
    localError.value = ''
  },
  { immediate: true },
)

function submitForm() {
  localError.value = ''

  const firstName = form.value.firstName.trim()
  const lastName = form.value.lastName.trim()
  const username = form.value.username.trim()

  if (!firstName || !lastName || !username) {
    localError.value = 'Please complete the required name and username fields.'
    return
  }

  const isEditing = Boolean(props.initialData?._id)

  if (!isEditing && (!form.value.password || !form.value.confirmPassword)) {
    localError.value = 'Password and confirm password are required.'
    return
  }

  if (
    (form.value.password || form.value.confirmPassword) &&
    form.value.password !== form.value.confirmPassword
  ) {
    localError.value = 'Passwords do not match.'
    return
  }

  emit('save', { ...form.value, firstName, lastName, username })
}

function cancelForm() {
  emit('cancel')
}
</script>

<template>
  <section class="judge-form-shell w-full max-w-[980px] px-4 py-6 sm:px-6 md:px-8 text-left" aria-label="Judge form">
    <div class="stepper mb-6 flex gap-2" aria-label="Judge steps">
      <button v-for="step in [1, 2, 3, 4, 5]" :key="step" class="step-button flex h-8 w-8 items-center justify-center border border-white/20 bg-[#0d2d87] text-[11px] font-bold text-white" type="button" :class="{ active: step === 5 }">
        {{ step }}
      </button>
    </div>

    <form class="judge-form grid w-full grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2" @submit.prevent="submitForm">
      <div class="field w-full md:col-span-2 md:w-32">
        <label class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-number">NUMBER</label>
        <input id="judge-number" v-model="form.number" type="text" inputmode="numeric" class="w-full rounded-md border border-blue-200/10 bg-[#0a178a] px-4 py-3 text-base text-white outline-none placeholder:text-blue-200/70 focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div class="field w-full">
        <label class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-first-name">FIRST NAME</label>
        <input id="judge-first-name" v-model="form.firstName" type="text" class="w-full rounded-md border border-blue-200/10 bg-[#0a178a] px-4 py-3 text-base text-white outline-none placeholder:text-blue-200/70 focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div class="field w-full">
        <label class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-last-name">LAST NAME</label>
        <input id="judge-last-name" v-model="form.lastName" type="text" class="w-full rounded-md border border-blue-200/10 bg-[#0a178a] px-4 py-3 text-base text-white outline-none placeholder:text-blue-200/70 focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div class="field w-full">
        <label class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-password">PASSWORD</label>
        <input id="judge-password" v-model="form.password" type="password" class="w-full rounded-md border border-blue-200/10 bg-[#0a178a] px-4 py-3 text-base text-white outline-none placeholder:text-blue-200/70 focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div class="field w-full">
        <label class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-username">USERNAME</label>
        <input id="judge-username" v-model="form.username" type="text" class="w-full rounded-md border border-blue-200/10 bg-[#0a178a] px-4 py-3 text-base text-white outline-none placeholder:text-blue-200/70 focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div class="field w-full">
        <label class="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-confirm-password">CONFIRM PASSWORD</label>
        <input id="judge-confirm-password" v-model="form.confirmPassword" type="password" class="w-full rounded-md border border-blue-200/10 bg-[#0a178a] px-4 py-3 text-base text-white outline-none placeholder:text-blue-200/70 focus:ring-2 focus:ring-blue-400/50" />
      </div>

      <div class="flex w-full flex-col items-start justify-start gap-4 sm:flex-row sm:items-center sm:justify-end md:items-center md:justify-end">
        <div class="flex items-center gap-3">
          <label class="mb-0 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300" for="judge-status">IS ACTIVE</label>
          <button
            id="judge-status"
            class="toggle-switch relative inline-flex h-[30px] w-[62px] items-center rounded-full border-0 bg-[#0a178a] p-0 transition-colors duration-200"
            :class="{ 'bg-[#0a178a]': form.isActive, 'bg-[#0a178a]': !form.isActive }"
            type="button"
            role="switch"
            :aria-checked="form.isActive"
            @click="form.isActive = !form.isActive"
          >
            <span class="toggle-thumb absolute left-[4px] top-[4px] h-[20px] w-[20px] rounded-full bg-[#ff3b30] shadow-[0_0_0_2px_rgba(255,255,255,0.15)] transition-all duration-200" :class="{ 'translate-x-[30px] bg-[#2d7dff]': form.isActive }"></span>
          </button>
        </div>

        <div class="flex w-full items-center justify-start gap-4 sm:w-auto sm:justify-end">
          <button class="cancel-button border-0 bg-transparent p-0 text-sm font-semibold uppercase tracking-[0.12em] text-blue-300 transition-colors hover:text-white" type="button" @click="cancelForm">CANCEL</button>
          <button class="save-button w-full rounded-full bg-[#0a178a] px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#0d1e9b] disabled:opacity-70 sm:w-auto" type="submit" :disabled="isLoading">
            {{ isLoading ? 'SAVING...' : 'SAVE' }}
          </button>
        </div>
      </div>

      <div v-if="formError" class="md:col-span-2" role="alert">
        <p class="form-error mt-1 text-sm font-medium text-red-300">{{ formError }}</p>
      </div>
    </form>
  </section>
</template>

<style scoped>
.judge-form-shell {
  color: #fff;
  font-family: 'Croparo', sans-serif;
}

.judge-form {
  font-family: 'Croparo', sans-serif;
}

.field,
.field label,
.field input,
.toggle-label,
.cancel-button,
.save-button {
  font-family: 'Croparo', sans-serif;
}

.toggle-switch:focus-visible,
.save-button:focus-visible,
.cancel-button:focus-visible,
.field input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.35);
}

.step-button.active {
  background: #0d1c72;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
}
</style>
