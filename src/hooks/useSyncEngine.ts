import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { isSupabaseConfigured } from '@/lib/supabase';
import { syncNow, triggerSync } from '@/lib/sync';
import { useAuthStore } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useOutboxStore } from '@/stores/outboxStore';
import { usePinnedInsightsStore } from '@/stores/pinnedInsightsStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSeenBadgesStore } from '@/stores/seenBadgesStore';

const RETRY_INTERVAL_MS = 20_000;

// Drives the sync engine: runs when identity is ready, when the outbox changes,
// on reconnect/foreground, and on a slow retry timer while ops are pending.
export function useSyncEngine(): void {
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Kick a sync whenever identity changes (e.g. anon sign-in completes).
    triggerSync();

    // Whenever the outbox or any synced profile state changes, attempt a push.
    const unsubs = [
      useOutboxStore.subscribe(() => triggerSync()),
      useProfileStore.subscribe(() => triggerSync()),
      useLanguageStore.subscribe(() => triggerSync()),
      usePinnedInsightsStore.subscribe(() => triggerSync()),
      useSeenBadgesStore.subscribe(() => triggerSync()),
    ];

    // Reconnect + tab focus (web).
    const onlineHandlers: Array<() => void> = [];
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const fire = () => triggerSync();
      window.addEventListener('online', fire);
      window.addEventListener('focus', fire);
      onlineHandlers.push(() => {
        window.removeEventListener('online', fire);
        window.removeEventListener('focus', fire);
      });
    }

    // Foreground (native).
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') triggerSync();
    });

    // Slow retry while anything is still queued.
    const interval = setInterval(() => {
      if (useOutboxStore.getState().ops.length > 0) void syncNow();
    }, RETRY_INTERVAL_MS);

    return () => {
      unsubs.forEach((off) => off());
      onlineHandlers.forEach((off) => off());
      appStateSub.remove();
      clearInterval(interval);
    };
  }, [userId]);
}
