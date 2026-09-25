<script setup>
import { ref } from 'vue'

const projectName = ref('CCS Tabulation 2026')
const version = ref('3.x')
const count = ref(0)

function reset() {
  count.value = 0
}
</script>

<template>
  <main class="welcome-container">
    <div class="welcome-card">
      <div class="logo-badge">⚡</div>
      <span class="badge">v{{ version }} Ready</span>
      
      <h1>Welcome to {{ projectName }}</h1>
      <p>
        Your Vue starter template is configured and ready to go. 
        Start editing <code>src/App.vue</code> to build your application.
      </p>

      <div class="actions">
        <button class="btn primary" @click="count++">
          Clicked {{ count }} {{ count === 1 ? 'time' : 'times' }}
        </button>
        <button class="btn secondary" @click="reset">
          Reset
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #0f172a;
  color: #f8fafc;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

.welcome-card {
  background-color: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.logo-badge {
  font-size: 48px;
  margin-bottom: 12px;
}

.badge {
  display: inline-block;
  background-color: rgba(66, 184, 131, 0.15);
  color: #42b883;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 16px;
}

h1 {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 12px 0;
  color: #f8fafc;
}

p {
  color: #94a3b8;
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 28px 0;
}

code {
  background-color: #0f172a;
  color: #42b883;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn.primary {
  background-color: #42b883;
  color: #0f172a;
}

.btn.primary:hover {
  background-color: #33a06f;
}

.btn.secondary {
  background-color: transparent;
  color: #f8fafc;
  border: 1px solid #334155;
}

.btn.secondary:hover {
  background-color: #334155;
}
</style>