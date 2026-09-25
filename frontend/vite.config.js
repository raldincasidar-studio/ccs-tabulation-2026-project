import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Listen on all interfaces so the app is reachable from other devices /
    // hosted preview environments (not just localhost).
    host: true,
    // Vite blocks requests whose Host header it does not recognise. `.e2b.app`
    // covers the hosted sandbox preview domain; add your own tunnel/LAN domain
    // here if you need to reach the dev server from elsewhere.
    allowedHosts: ['.e2b.app'],
  },
})
