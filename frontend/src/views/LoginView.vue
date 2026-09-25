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
      router.push('/');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Login failed. Please check your credentials.';
  } finally {
    isLoading.value = false;
  }
}

function fillCredentials(user, pass) {
  username.value = user;
  password.value = pass;
}
</script>

<template>
  <main
    class="min-h-screen min-h-[100dvh] w-full relative flex flex-col items-center justify-center px-4 py-8 overflow-y-auto sm:overflow-hidden bg-[#06071b] bg-cover bg-center bg-no-repeat select-none"
    :style="{ backgroundImage: `url(${bgLogo})` }"
  >
    <!-- Logo Container -->
    <div class="mb-6 sm:mb-8 w-full flex justify-center z-10 px-2">
      <img
        :src="titleLogo"
        alt="2026 Tabulation"
        class="w-[88%] max-w-[380px] sm:max-w-none sm:w-[500px] md:w-[600px] h-auto object-contain filter drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]"
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
          <label class="block font-croparo text-[12px] sm:text-[14px] text-hollow-inline uppercase mb-1 ml-1 tracking-wider">
            USERNAME
          </label>
          <div class="relative">
            <input
              v-model="username"
              type="text"
              required
              autocomplete="username"
              placeholder="Jhon Doe"
              class="w-full px-4 py-2.5 sm:py-3 bg-[#0a0f4a]/90 hover:bg-[#0d145e] focus:bg-[#0b1254] border border-[#1b2585] rounded-xl text-white placeholder-[#435299] text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] transition duration-200 font-sans"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div>
          <label class="block font-croparo text-[12px] sm:text-[14px] text-hollow-inline uppercase mb-1 ml-1 tracking-wider">
            PASSWORD
          </label>
          <div class="relative flex items-center">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="*********"
              class="w-full pl-4 pr-11 py-2.5 sm:py-3 bg-[#0a0f4a]/90 hover:bg-[#0d145e] focus:bg-[#0b1254] border border-[#1b2585] rounded-xl text-white placeholder-[#435299] text-sm focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] transition duration-200 tracking-wider font-sans"
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
          class="w-full mt-6 sm:mt-8 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 hover:from-blue-600 hover:to-purple-500 active:scale-[0.98] rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] disabled:opacity-50 transition duration-200 cursor-pointer flex items-center justify-center"
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

      <!-- Testing Shortcuts -->
       <!-- for testing uncomment anytiem -->
      <!-- <div class="mt-8 sm:mt-10 pt-4 border-t border-indigo-950/60 w-full flex flex-col items-center">
        <span class="text-[10px] tracking-wider text-slate-500 uppercase mb-2 font-medium">
          Quick Fill (Seed Accounts)
        </span>
        <div class="flex flex-wrap justify-center gap-2 text-[11px] w-full">
          <button
            type="button"
            @click="fillCredentials('admin', 'adminpassword123')"
            class="flex-1 sm:flex-none px-3 py-1.5 bg-[#090d3d] hover:bg-[#121966] text-[#7d99d9] hover:text-white rounded-md border border-[#1b2585] active:scale-95 transition cursor-pointer text-center"
          >
            Admin
          </button>
          <button
            type="button"
            @click="fillCredentials('judge_donde', 'password123')"
            class="flex-1 sm:flex-none px-3 py-1.5 bg-[#090d3d] hover:bg-[#121966] text-[#7d99d9] hover:text-white rounded-md border border-[#1b2585] active:scale-95 transition cursor-pointer text-center whitespace-nowrap"
          >
            Nay Donde
          </button>
          <button
            type="button"
            @click="fillCredentials('judge_lester', 'password123')"
            class="flex-1 sm:flex-none px-3 py-1.5 bg-[#090d3d] hover:bg-[#121966] text-[#7d99d9] hover:text-white rounded-md border border-[#1b2585] active:scale-95 transition cursor-pointer text-center whitespace-nowrap"
          >
            Sir Lester
          </button>
        </div>
      </div> -->
    </div>
  </main>
</template>