<script setup>
import { LogOut } from 'lucide-vue-next'

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['cancel', 'confirm'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      @click.self="$emit('cancel')"
      @keydown.esc.prevent="$emit('cancel')"
      tabindex="-1"
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="exit-confirmation-title"
        aria-describedby="exit-confirmation-description"
        class="w-full max-w-sm rounded-xl border border-cyan-400/40 bg-[#050b35] p-6 text-white shadow-[0_0_35px_rgba(14,165,233,0.28)]"
      >
        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/40 bg-blue-950 text-cyan-200">
          <LogOut :size="20" aria-hidden="true" />
        </div>
        <h2 id="exit-confirmation-title" class="text-lg font-bold">Exit this session?</h2>
        <p id="exit-confirmation-description" class="mt-2 text-sm leading-relaxed text-blue-100/75">
          You will be signed out and returned to the login screen.
        </p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            autofocus
            class="rounded-md border border-blue-200/30 px-4 py-2 text-sm font-semibold text-blue-100 transition-colors hover:bg-blue-900/70 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            @click="$emit('cancel')"
          >
            Stay
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-md border border-red-300/50 bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-200"
            @click="$emit('confirm')"
          >
            <LogOut :size="15" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>