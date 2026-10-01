<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/services/authService';
import { Eye, EyeOff } from 'lucide-vue-next';

// Asset imports
import titleLogo from '@/assets/logo/login-page-name.png';
import bgLogo from '@/assets/img/login-bg.png';

const router = useRouter();

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');
const isLoading = ref(false);
const stars = [
  { id: 1, x: '9%', y: '14%', size: '4px', color: '#ffffff', duration: '2.8s', delay: '-0.7s', shape: 'dot' },
  { id: 2, x: '22%', y: '29%', size: '8px', color: '#f9a8d4', duration: '4.1s', delay: '-2s', shape: 'diamond' },
  { id: 3, x: '34%', y: '11%', size: '5px', color: '#ffffff', duration: '3.5s', delay: '-1.2s', shape: 'dot' },
  { id: 4, x: '68%', y: '16%', size: '7px', color: '#67e8f9', duration: '2.4s', delay: '-1.8s', shape: 'diamond' },
  { id: 5, x: '84%', y: '25%', size: '4px', color: '#ffffff', duration: '4.7s', delay: '-0.4s', shape: 'dot' },
  { id: 6, x: '92%', y: '48%', size: '8px', color: '#fcd34d', duration: '3.2s', delay: '-2.6s', shape: 'diamond' },
  { id: 7, x: '12%', y: '62%', size: '6px', color: '#67e8f9', duration: '4.4s', delay: '-1.5s', shape: 'diamond' },
  { id: 8, x: '28%', y: '78%', size: '4px', color: '#ffffff', duration: '2.6s', delay: '-1s', shape: 'dot' },
  { id: 9, x: '76%', y: '73%', size: '5px', color: '#f9a8d4', duration: '3.8s', delay: '-2.2s', shape: 'dot' },
  { id: 10, x: '90%', y: '88%', size: '7px', color: '#ffffff', duration: '4.9s', delay: '-0.9s', shape: 'diamond' },
];
const shootingStars = [
  { id: 1, x: '0vw', duration: '8s', delay: '-1s' },
  { id: 2, x: '20vw', duration: '6s', delay: '-4s' },
  { id: 3, x: '40vw', duration: '7s', delay: '-2s' },
  { id: 4, x: '60vw', duration: '5s', delay: '-3s' },
  { id: 5, x: '80vw', duration: '8s', delay: '-6s' },
];
const warpLines = [
  { id: 1, angle: '0deg', length: '150px', duration: '5s', delay: '-1s' },
  { id: 2, angle: '45deg', length: '190px', duration: '6s', delay: '-3s' },
  { id: 3, angle: '90deg', length: '170px', duration: '4.5s', delay: '-2s' },
  { id: 4, angle: '135deg', length: '210px', duration: '5.5s', delay: '-4s' },
  { id: 5, angle: '180deg', length: '160px', duration: '6.5s', delay: '-2.5s' },
  { id: 6, angle: '225deg', length: '180px', duration: '4.8s', delay: '-3.5s' },
  { id: 7, angle: '270deg', length: '200px', duration: '5.8s', delay: '-1.8s' },
  { id: 8, angle: '315deg', length: '145px', duration: '6.2s', delay: '-4.5s' },
];

async function handleLogin() {
  errorMessage.value = '';
  isLoading.value = true;

  try {
    const user = await login(username.value, password.value);
    if (user.userType === 'Admin') {
      router.push('/admin');
    } else if (user.userType === 'Judge') {
      router.push('/judge');
    } else {
      router.push('/login');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <main
    class="min-h-screen min-h-[100dvh] w-full relative flex flex-col items-center justify-center px-4 py-8 overflow-y-auto sm:overflow-hidden bg-[#06071b] bg-cover bg-center bg-no-repeat select-none"
    :style="{ backgroundImage: `url(${bgLogo})` }"
  >
    <div class="login-atmosphere" aria-hidden="true">
      <span
        v-for="star in stars"
        :key="star.id"
        class="space-star"
        :class="`space-star--${star.shape}`"
        :style="{
          '--star-x': star.x,
          '--star-y': star.y,
          '--star-size': star.size,
          '--star-color': star.color,
          '--star-duration': star.duration,
          '--star-delay': star.delay,
        }"
      />
      <span
        v-for="shootingStar in shootingStars"
        :key="shootingStar.id"
        class="shooting-star"
        :style="{
          '--warp-x': shootingStar.x,
          '--warp-duration': shootingStar.duration,
          '--warp-delay': shootingStar.delay,
        }"
      />
      <span
        v-for="warpLine in warpLines"
        :key="warpLine.id"
        class="warp-line"
        :style="{
          '--warp-angle': warpLine.angle,
          '--warp-length': warpLine.length,
          '--warp-duration': warpLine.duration,
          '--warp-delay': warpLine.delay,
        }"
      />
    </div>

    <!-- Logo Container -->
    <div class="login-title-wrap mb-6 sm:mb-8 w-full flex justify-center z-10 px-2">
      <img
        :src="titleLogo"
        alt="2026 Tabulation"
        class="login-title w-[88%] max-w-[380px] sm:max-w-none sm:w-[500px] md:w-[600px] h-auto object-contain filter drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]"
      />
    </div>

    <!-- Center Form Card -->
    <div class="w-full max-w-[360px] sm:max-w-sm flex flex-col items-center z-10">
      <!-- Error Message -->
      <div
        v-if="errorMessage"
        class="w-full mb-4 p-2.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-center backdrop-blur-sm shadow-[0_0_10px_rgba(239,68,68,0.2)]"
      >
        {{ errorMessage }}
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleLogin" class="w-full space-y-4 sm:space-y-5">
        <!-- Username Field -->
        <div>
          <label class="block font-croparo text-[13px] sm:text-[15px] text-hollow-inline uppercase mb-1.5 ml-1 tracking-[0.22em]">
            USERNAME
          </label>
          <div class="relative">
            <input
              v-model="username"
              type="text"
              required
              autocomplete="username"
              placeholder="ex: admin"
              class="login-input w-full px-4 py-2.5 sm:py-3 bg-[#0a0f4a]/90 hover:bg-[#0d145e] focus:bg-[#0b1254] border border-[#1b2585] rounded-xl text-white placeholder-[#435299] text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] transition duration-200 font-sans"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div>
          <label class="block font-croparo text-[13px] sm:text-[15px] text-hollow-inline uppercase mb-1.5 ml-1 tracking-[0.22em]">
            PASSWORD
          </label>
          <div class="relative flex items-center">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="••••••••••••"
              class="login-input w-full pl-4 pr-11 py-2.5 sm:py-3 bg-[#0a0f4a]/90 hover:bg-[#0d145e] focus:bg-[#0b1254] border border-[#1b2585] rounded-xl text-white placeholder-[#435299] text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] transition duration-200 tracking-wider font-sans"
            />
            
            <!-- Eye Toggle Button using Lucide Icons -->
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-2.5 sm:right-3 p-1 text-[#7d99d9] hover:text-cyan-400 active:scale-95 focus:outline-none transition-colors cursor-pointer"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <EyeOff v-if="showPassword" class="w-5 h-5" />
              <Eye v-else class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="login-submit w-full mt-6 sm:mt-8 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-500 active:scale-[0.98] rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 transition duration-200 cursor-pointer flex items-center justify-center"
        >
          <span
            v-if="isLoading"
            class="font-croparo text-[12px] sm:text-[13px] text-hollow-inline tracking-[0.2em] animate-pulse"
          >
            AUTHENTICATING...
          </span>
          <span
            v-else
            class="font-croparo text-[14px] sm:text-[16px] text-hollow-inline uppercase tracking-[0.25em]"
          >
            LOG IN
          </span>
        </button>
      </form>
    </div>
  </main>
</template>

<style scoped>
.login-atmosphere {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.space-star {
  position: absolute;
  top: var(--star-y);
  left: var(--star-x);
  width: var(--star-size);
  height: var(--star-size);
  background: var(--star-color);
  box-shadow: 0 0 10px var(--star-color);
}

.space-star--dot {
  border-radius: 50%;
}

.space-star--diamond {
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
}

.shooting-star {
  position: absolute;
  top: var(--warp-y);
  top: calc(0px - var(--warp-x));
  left: var(--warp-x);
  width: clamp(100px, 20vw, 190px);
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.18) 55%, rgba(255, 255, 255, 0.95) 100%);
  box-shadow: 0 0 8px rgba(103, 232, 249, 0.8), 0 0 18px rgba(56, 189, 248, 0.45);
  opacity: 0;
  transform-origin: left center;
}

.warp-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1px;
  height: var(--warp-length);
  background: linear-gradient(180deg, transparent, rgba(186, 230, 253, 0.48), transparent);
  opacity: 0;
}

.login-title {
  filter: drop-shadow(0 0 18px rgba(56, 189, 248, 0.35));
}

.login-title-wrap {
  position: relative;
  isolation: isolate;
}

.login-title-wrap::before {
  position: absolute;
  z-index: -1;
  inset: -20% -12%;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(91, 33, 182, 0.36), rgba(30, 64, 175, 0.18) 42%, transparent 72%);
  content: '';
  filter: blur(24px);
  pointer-events: none;
}

.login-input:focus {
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 12px rgba(139, 92, 246, 0.5);
}

.login-submit {
  transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
}

.login-submit:hover:not(:disabled) {
  transform: scale(1.02);
  filter: brightness(1.14) saturate(1.08);
  background-image: linear-gradient(110deg, #3b82f6, #6d28d9, #c026d3);
  box-shadow: 0 0 26px rgba(139, 92, 246, 0.55);
}

.login-submit:active:not(:disabled) {
  transform: scale(0.98);
}

@keyframes star-drift {
  0%, 100% { opacity: 0.3; transform: translateY(0) scale(0.8); }
  50% { opacity: 1; transform: translateY(-10px) scale(1.2); }
}

@keyframes shooting-star-warp {
  0%, 8%, 100% {
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(45deg);
  }
  12% {
    opacity: 0.9;
    transform: translate3d(0, 0, 0) rotate(45deg);
  }
  72% {
    opacity: 0.65;
    transform: translate3d(100vw, 100vw, 0) rotate(45deg);
  }
  82% {
    opacity: 0;
    transform: translate3d(120vw, 120vw, 0) rotate(45deg);
  }
}

@keyframes warp-pulse {
  0%, 100% {
    opacity: 0.22;
    transform: translate(-50%, -50%) rotate(var(--warp-angle)) scaleY(0.35);
  }
  50% {
    opacity: 0.48;
    transform: translate(-50%, -50%) rotate(var(--warp-angle)) scaleY(1);
  }
}

@keyframes title-glow {
  from {
    filter:
      drop-shadow(0 0 3px rgba(255, 255, 255, 0.55))
      drop-shadow(0 0 12px rgba(56, 189, 248, 0.55))
      drop-shadow(0 0 24px rgba(56, 189, 248, 0.3));
  }
  to {
    filter:
      drop-shadow(0 0 5px rgba(255, 255, 255, 0.75))
      drop-shadow(0 0 18px rgba(217, 70, 239, 0.7))
      drop-shadow(0 0 36px rgba(56, 189, 248, 0.42));
  }
}

.text-hollow-inline {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  -webkit-text-stroke: 0px transparent !important;
  /* Soft white neon bloom matching the reference image */
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.45), 0 0 2px rgba(255, 255, 255, 0.85);
}

@media (prefers-reduced-motion: no-preference) {
  .space-star {
    animation: star-drift var(--star-duration) ease-in-out var(--star-delay) infinite;
    will-change: transform, opacity;
  }

  .shooting-star {
    animation: shooting-star-warp var(--warp-duration) linear var(--warp-delay) infinite;
    will-change: transform, opacity;
  }

  .warp-line {
    animation: warp-pulse var(--warp-duration) ease-in-out var(--warp-delay) infinite;
    will-change: transform, opacity;
  }

  .login-title {
    animation: title-glow 3s ease-in-out infinite alternate;
    will-change: filter;
  }
}

@media (prefers-reduced-motion: reduce) {
  .space-star,
  .shooting-star,
  .warp-line,
  .login-title {
    animation: none;
    will-change: auto;
  }
}
</style>