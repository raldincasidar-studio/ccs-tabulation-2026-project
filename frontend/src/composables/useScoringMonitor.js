import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { getScoringDashboard } from '@/services/dashboardService.js';

export function useScoringMonitor() {
  const dashboard = ref(null);
  const isRefreshing = ref(false);
  const error = ref('');
  const isPaused = ref(false);
  const lastReceivedAt = ref(null);
  const isLoading = computed(() => !dashboard.value && isRefreshing.value);
  let timer;
  let controller;
  let inFlight;
  let mounted = false;
  let failedAttempts = 0;

  function stopTimer() {
    clearTimeout(timer);
    timer = undefined;
  }

  function scheduleRefresh() {
    stopTimer();
    if (!mounted || document.hidden || !navigator.onLine) return;
    const interval = dashboard.value?.refreshIntervalMs ?? 3000;
    // Retry automatically after transient failures, but don't hammer an API
    // that is down. Schedule AFTER completion so requests never overlap.
    timer = setTimeout(refresh, Math.min(interval * Math.max(1, failedAttempts), 15000));
  }

  function refresh() {
    stopTimer();
    if (inFlight) return inFlight;
    if (!mounted) return Promise.resolve();
    if (!navigator.onLine) {
      error.value = 'You are offline. Monitoring will resume when your connection returns.';
      return Promise.resolve();
    }

    controller = new AbortController();
    isRefreshing.value = true;
    inFlight = (async () => {
      try {
        const data = await getScoringDashboard(controller.signal);
        if (!mounted) return;
        if (!data || !Array.isArray(data.categories) || !data.stats) {
          throw new Error('The server returned an invalid dashboard response.');
        }
        dashboard.value = data;
        lastReceivedAt.value = new Date();
        error.value = '';
        failedAttempts = 0;
      } catch (requestError) {
        if (!mounted || requestError?.code === 'ERR_CANCELED') return;
        failedAttempts += 1;
        // Keep the last successful snapshot and explicitly label it stale.
        error.value = requestError?.message || 'Unable to load live scoring data.';
      } finally {
        isRefreshing.value = false;
        inFlight = undefined;
        scheduleRefresh();
      }
    })();
    return inFlight;
  }

  // A mutation must fetch a snapshot started AFTER the write; reusing an
  // older in-flight polling request could otherwise briefly show old data.
  async function reload() {
    if (inFlight) await inFlight;
    return refresh();
  }

  function handleVisibility() {
    isPaused.value = document.hidden;
    if (document.hidden) stopTimer();
    else refresh();
  }

  function handleOffline() {
    stopTimer();
    error.value = 'You are offline. Monitoring will resume when your connection returns.';
  }

  onMounted(() => {
    mounted = true;
    isPaused.value = document.hidden;
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', refresh);
    window.addEventListener('offline', handleOffline);
    refresh();
  });

  onBeforeUnmount(() => {
    mounted = false;
    stopTimer();
    controller?.abort();
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('online', refresh);
    window.removeEventListener('offline', handleOffline);
  });

  return { dashboard, isLoading, isRefreshing, isPaused, error, lastReceivedAt, refresh, reload };
}
