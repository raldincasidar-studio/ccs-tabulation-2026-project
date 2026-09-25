<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}
</script>

<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
      <h1 class="text-2xl font-bold text-white">Judge Scoring Sheet</h1>
      <button 
        @click="handleLogout"
        class="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-800 rounded-lg text-sm transition"
      >
        Sign Out
      </button>
    </div>
    <p class="text-slate-400">Live scoring sheet for active category will be built here.</p>
  </div>
</template>