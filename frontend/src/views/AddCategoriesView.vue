<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter, useRoute } from "vue-router";
import Sidebar from "@/components/Sidebar.vue";
import configService from "@/services/configService";
import starImage from "@/assets/img/star.png";
import configurationBanner from "@/assets/img/configuration-banner.png";

const router = useRouter();
const route = useRoute();

const isMobile = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileSidebarOpen = ref(false);

function updateViewportState() {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isSidebarCollapsed.value = false;
    isMobileSidebarOpen.value = false;
  }
}

const categoryId = computed(() => route.params.id || null);
const isEditing = computed(() => Boolean(categoryId.value));

const form = reactive({
  name: "Gown",
  description: "Judges evaluate how the contestant carries herself, the fit and appropriateness of the gown, her posture, grace under pressure, and stage presence.",
  weight: 10,
  isActive: false,
  rubrics: [
    { name: "Fitness & Form", maxPoints: 40 },
    { name: "Stage Presence", maxPoints: 40 },
    { name: "Poise & Bearing", maxPoints: 20 },
  ],
});

const isSubmitting = ref(false);
const message = ref({ text: "", isError: false });

function showFeedback(msg, isErr = false) {
  message.value = { text: msg, isError: isErr };
  setTimeout(() => {
    message.value.text = "";
  }, 4000);
}

function addRubric() {
  form.rubrics.push({ name: "", maxPoints: 40 });
}

function removeRubric(index) {
  form.rubrics.splice(index, 1);
}

// ==========================================
// [READ - GET] Prefill if editing
// ==========================================
async function loadCategory() {
  if (!isEditing.value) return;
  try {
    const res = await configService.getCategories();
    const categories = res.data?.data || res.data || [];
    const current = categories.find((c) => c._id === categoryId.value);
    if (current) {
      form.name = current.name || "";
      form.description = current.description || form.description;
      form.weight = current.weight ?? 10;
      form.isActive = Boolean(current.isActive);
      if (current.rubrics && current.rubrics.length > 0) {
        form.rubrics = current.rubrics.map((r) => ({
          _id: r._id,
          name: r.name,
          maxPoints: r.maxPoints,
        }));
      }
    }
  } catch (err) {
    console.error("Error loading category details:", err);
  }
}

// ==========================================
// [CREATE - POST / UPDATE - PUT] Save Category
// ==========================================
async function handleSave() {
  if (!form.name.trim()) return showFeedback("Category name is required", true);
  if (form.weight < 0 || form.weight > 100) {
    return showFeedback("Category weight must be between 0 and 100", true);
  }

  isSubmitting.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      weight: Number(form.weight),
      isActive: Boolean(form.isActive),
      rubrics: form.rubrics.filter((r) => r.name.trim()),
    };

    if (isEditing.value) {
      await configService.updateCategory(categoryId.value, payload);
      showFeedback("Category updated successfully!");
    } else {
      await configService.createCategory(payload);
      showFeedback("Category created successfully!");
    }

    setTimeout(() => {
      router.push("/admin/configurations");
    }, 700);
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || "Failed to save category";
    showFeedback(errorMsg, true);
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  updateViewportState();
  window.addEventListener("resize", updateViewportState);
  loadCategory();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportState);
});
</script>

<template>
  <div class="management-frame" :style="{ '--star-image': `url(${starImage})` }">
    <div
      class="management-shell"
      :style="{ '--sidebar-width': isMobile ? '0px' : isSidebarCollapsed ? '60px' : '218px' }"
    >
      <Sidebar
        active-item="CONFIGURATIONS"
        :is-mobile="isMobile"
        :is-sidebar-collapsed="isSidebarCollapsed"
        :is-mobile-sidebar-open="isMobileSidebarOpen"
        @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed"
        @close-mobile-sidebar="isMobileSidebarOpen = false"
      />

      <main class="main-content">
        <div class="page-content">
          <header class="management-banner" :style="{ '--banner-bg': `url(${configurationBanner})` }">
            <h1>CONTESTANT MANAGEMENT</h1>
          </header>

          <div
            v-if="message.text"
            :class="[
              'my-4 px-4 py-2.5 rounded-lg text-sm font-semibold transition',
              message.isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            ]"
          >
            {{ message.text }}
          </div>

          <form @submit.prevent="handleSave" class="mt-8 space-y-6">
            <div>
              <label class="block text-sm font-bold text-[#00227B] mb-2">Category name</label>
              <div class="relative w-full max-w-xs">
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Gown"
                  class="gradient-field w-full text-white px-4 py-2.5 rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-[#00227B] mb-2">Description</label>
              <div class="relative w-full rounded-lg bg-[#001D8A] p-4 text-white shadow-inner">
                <p class="text-xs leading-relaxed">
                  <strong class="text-yellow-300 font-black tracking-wide">What to look for:</strong>
                  Judges evaluate how the contestant carries herself, the fit and appropriateness of the gown, her posture, grace under pressure, and stage presence.
                </p>
                <textarea
                  v-model="form.description"
                  rows="2"
                  placeholder="Enter full criteria description..."
                  class="w-full mt-3 bg-[#031566] text-white p-2.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                ></textarea>
              </div>
            </div>

            <div class="flex items-center gap-10">
              <div>
                <label class="block text-sm font-bold text-[#00227B] mb-2">Weight</label>
                <div class="relative w-36">
                  <input
                    v-model.number="form.weight"
                    type="number"
                    min="0"
                    max="100"
                    class="gradient-field w-full text-white px-4 py-2 rounded-md text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <span class="absolute right-4 top-2 text-white font-bold">%</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-[#00227B] mb-2">
                  {{ form.isActive ? 'Active' : 'Not Active' }}
                </label>
                <button
                  type="button"
                  @click="form.isActive = !form.isActive"
                  :class="[
                    'relative w-16 h-8 rounded-full transition-colors duration-200 cursor-pointer p-1',
                    form.isActive ? 'bg-[#0028B4]' : 'bg-[#001358]'
                  ]"
                >
                  <span
                    :class="[
                      'block w-6 h-6 rounded-full transition-transform duration-200 shadow-md',
                      form.isActive ? 'translate-x-8 bg-[#00FF66]' : 'translate-x-0 bg-[#E00000]'
                    ]"
                  ></span>
                </button>
              </div>
            </div>

            <div class="pt-4 border-t-2 border-[#00227B]/60">
              <h2 class="text-base font-extrabold text-[#00227B] mb-4">Rubrics</h2>

              <div class="overflow-x-auto">
                <!-- Larger text labels without underline -->
                <div class="flex justify-between text-sm md:text-base font-black text-[#00227B] px-5 pb-3">
                  <span>Name</span>
                  <span class="pr-5">Max Points</span>
                </div>

                <!-- Alternating Rubrics Rows -->
                <div class="space-y-1.5">
                  <div
                    v-for="(rubric, index) in form.rubrics"
                    :key="index"
                    :class="[
                      'flex items-center justify-between px-5 py-2.5 rounded-md transition select-none',
                      index % 2 === 0
                        ? 'bg-[#060071]'
                        : 'bg-[#f5f6f6]'
                    ]"
                  >
                    <!-- Rubric Name -->
                    <input
                      v-model="rubric.name"
                      type="text"
                      placeholder="Criterion name"
                      :class="[
                        'bg-transparent text-sm font-medium focus:outline-none flex-1 mr-4 tracking-wide',
                        index % 2 === 0
                          ? 'text-white placeholder:text-white/60'
                          : 'text-[#1948cc] placeholder:text-blue-400'
                      ]"
                    />

                    <!-- Points Box & Delete Button -->
                    <div class="flex items-center gap-3">
                      <input
                        v-model.number="rubric.maxPoints"
                        type="number"
                        :class="[
                          'w-20 h-7 text-center text-xs font-bold rounded-md focus:outline-none border-none transition-colors',
                          index % 2 === 0
                            ? 'bg-white text-[#060071]'
                            : 'bg-[#060071] text-white'
                        ]"
                      />
                      <button
                        type="button"
                        @click="removeRubric(index)"
                        :class="[
                          'font-bold px-1 text-sm cursor-pointer transition',
                          index % 2 === 0
                            ? 'text-red-300 hover:text-red-100'
                            : 'text-red-500 hover:text-red-700'
                        ]"
                        title="Delete criterion"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                </div>

                <div class="flex justify-end pt-3">
                  <button
                    type="button"
                    @click="addRubric"
                    class="text-xs font-extrabold text-[#00227B] hover:text-blue-800 transition cursor-pointer"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <div class="pt-4 flex items-center gap-4">
              <button
                type="submit"
                :disabled="isSubmitting"
                class="bg-[#051F68] hover:bg-[#082982] text-white font-bold px-12 py-2 rounded-full text-xs tracking-widest transition disabled:opacity-50 cursor-pointer"
              >
                {{ isSubmitting ? 'SAVING...' : 'SAVE' }}
              </button>

              <button
                type="button"
                @click="router.push('/admin/configurations')"
                class="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.management-frame,
.management-shell {
  min-height: 100vh;
  background: #f5f6f6;
}

.management-shell {
  --sidebar-width: 218px;
  position: relative;
  overflow-x: hidden;
  color: #08065a;
}

.main-content {
  min-height: 100vh;
  margin-left: var(--sidebar-width);
  padding: clamp(22px, 2.5vw, 56px) clamp(18px, 2.8vw, 58px) 56px;
  transition: margin-left 0.25s ease;
}

.page-content {
  width: min(100%, 1040px);
  margin: 0 auto;
}

.gradient-field {
  background: linear-gradient(90deg, #023EC6 0%, #011E60 100%) !important;
}

.management-banner {
  position: relative;
  display: flex;
  width: min(100%);
  height: clamp(120px, 13vw, 170px);
  align-items: flex-start;
  overflow: hidden;
  padding: clamp(18px, 2vw, 27px) clamp(18px, 2vw, 36px);
  border-radius: 17px;
  background-color: #02004a;
  background-image: var(--banner-bg), linear-gradient(90deg, #02004a 0%, #0500b0 100%);
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  box-sizing: border-box;
}

.management-banner::before {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(32deg, transparent 31%, rgb(161 184 255 / 20%) 31.1%, transparent 31.25%),
    linear-gradient(122deg, transparent 82%, rgb(161 184 255 / 15%) 82.1%, transparent 82.25%);
  content: "";
  pointer-events: none;
}

.management-banner h1 {
  position: relative;
  z-index: 1;
  margin: 0;
  color: #dedfff;
  font-family: "Croparo", Regular, sans-serif;
  font-size: clamp(2rem, 3vw, 3.1rem);
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  -webkit-text-stroke: 0.35px #fff;
  text-shadow: 0 0 8px rgba(180, 200, 255, 0.4);
}

@media (min-width: 768px) {
  .management-shell :deep(.sidebar-navigation) { padding-top: 78px; }
  .management-shell :deep(.sidebar-link) { min-height: 50px; }
  .management-shell :deep(.sidebar-link.active) { min-height: 50px; }
}

@media (max-width: 767px) {
  .main-content {
    margin-left: 0;
    padding: 78px 18px 36px;
  }
}
</style>