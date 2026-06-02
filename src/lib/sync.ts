import { isSupabaseConfigured } from '@/lib/supabase';
import {
  remoteListMeals,
  remoteSoftDeleteMeal,
  remoteUpdateMeal,
  remoteUpsertMeal,
} from '@/services/meals';
import { getProfile, upsertProfile } from '@/services/profile';
import { uploadAvatar, uploadMealPhoto } from '@/services/storage';
import { useAuthStore, LOCAL_USER_ID } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useLocalMealsStore } from '@/stores/localMealsStore';
import { useOutboxStore, type MealPatch } from '@/stores/outboxStore';
import { usePinnedInsightsStore } from '@/stores/pinnedInsightsStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSeenBadgesStore } from '@/stores/seenBadgesStore';
import { useSyncStatusStore } from '@/stores/syncStatusStore';
import type { Meal } from '@/types/meal';

// Local-first sync engine. The meals store is the source of truth the UI renders;
// this drains the outbox to Supabase and pulls server state back, so the app
// works offline and reconciles when a connection is available.

let running = false;
let debounce: ReturnType<typeof setTimeout> | null = null;
// Avoids re-writing unchanged settings on every periodic sync.
let lastPushedSettings: string | null = null;

function isLocalUri(url: string | null): url is string {
  return !!url && !/^https?:\/\//i.test(url);
}

function canSync(): boolean {
  if (!isSupabaseConfigured) return false;
  const userId = useAuthStore.getState().userId;
  if (!userId || userId === LOCAL_USER_ID) return false;
  // On web, skip when the browser reports offline; native attempts and relies on
  // the request failing fast.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return true;
}

// Replace a local-only photo URI with a Storage URL, updating the local store so
// the UI and any later ops use the remote URL. Returns the URL to persist.
async function resolvePhoto(userId: string, mealId: string, photoUrl: string | null): Promise<string | null> {
  if (!isLocalUri(photoUrl)) return photoUrl;
  const remoteUrl = await uploadMealPhoto(userId, photoUrl);
  if (remoteUrl && remoteUrl !== photoUrl) {
    useLocalMealsStore.getState().updateMeal(mealId, { photoUrl: remoteUrl });
  }
  return remoteUrl;
}

async function pushOutbox(userId: string): Promise<void> {
  const outbox = useOutboxStore.getState();
  // FIFO; stop at the first failure to preserve per-meal ordering, retry later.
  for (const op of [...outbox.ops]) {
    try {
      if (op.kind === 'create' && op.meal) {
        const photoUrl = await resolvePhoto(userId, op.mealId, op.meal.photoUrl);
        await remoteUpsertMeal({ ...op.meal, photoUrl });
      } else if (op.kind === 'update' && op.patch) {
        let patch: MealPatch = op.patch;
        if ('photoUrl' in patch) {
          patch = { ...patch, photoUrl: await resolvePhoto(userId, op.mealId, patch.photoUrl ?? null) };
        }
        await remoteUpdateMeal(userId, op.mealId, patch);
      } else if (op.kind === 'delete') {
        await remoteSoftDeleteMeal(userId, op.mealId);
      }
      useOutboxStore.getState().remove(op.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn('[sync] push FAILED for', op.kind, op.mealId, '->', msg);
      useOutboxStore.getState().markAttempt(op.id, msg);
      // Leave this op queued for a later retry, but keep processing the rest —
      // one failing meal shouldn't block the others (each op is a separate meal).
    }
  }
}

async function pullMeals(userId: string): Promise<void> {
  const server = await remoteListMeals(userId);
  // Don't let the server overwrite meals that still have un-synced local changes.
  const pendingIds = new Set(useOutboxStore.getState().ops.map((o) => o.mealId));
  const localPending: Meal[] = useLocalMealsStore
    .getState()
    .meals.filter((m) => m.userId === userId && pendingIds.has(m.id));
  const merged = [...server.filter((m) => !pendingIds.has(m.id)), ...localPending];
  useLocalMealsStore.getState().replaceUserMeals(userId, merged);
}

// Pull the account's profile and adopt it as the source of truth — UNLESS this
// device has unsaved local edits (dirty), in which case the local edit wins and
// will be pushed. This makes profile fields (name, handle, bio, phone, avatar,
// join date) match across all devices: a change on one device is adopted by the
// others on their next sync.
async function pullProfile(userId: string): Promise<void> {
  const remote = await getProfile(userId);
  if (!remote) return;

  const ps = useProfileStore.getState();
  if (!ps.dirty) {
    ps.adopt({
      preferredName: remote.preferredName,
      handle: remote.handle ?? '',
      bio: remote.bio,
      phoneNumber: remote.phoneNumber,
      avatarUri: remote.avatarUrl,
      joinedAt: remote.createdAt, // join date is the account's creation time
    });
  }

  // Goal / card order: adopt when this device hasn't customized them.
  const localGoal = useLocalMealsStore.getState().goal;
  const isDefaultGoal = !localGoal || localGoal === 'Feeling happy and healthy';
  if (isDefaultGoal && remote.goal && remote.goal !== localGoal) {
    useLocalMealsStore.getState().setGoal(remote.goal);
  }
  const cloudOrder = remote.prefs.insightOrder;
  if (
    Array.isArray(cloudOrder) &&
    cloudOrder.length > 0 &&
    usePinnedInsightsStore.getState().order.length === 0
  ) {
    usePinnedInsightsStore.getState().setOrder(cloudOrder);
  }
}

async function pushProfile(userId: string): Promise<void> {
  const settings = {
    goal: useLocalMealsStore.getState().goal,
    lang: useLanguageStore.getState().lang,
    prefs: {
      pinnedInsights: usePinnedInsightsStore.getState().pinned,
      seenBadges: useSeenBadgesStore.getState().seen,
      insightOrder: usePinnedInsightsStore.getState().order,
    },
  };

  const ps = useProfileStore.getState();
  if (!ps.dirty) {
    // No local profile edits: only sync settings, and only when they changed.
    const key = JSON.stringify(settings);
    if (key !== lastPushedSettings) {
      await upsertProfile(userId, settings);
      lastPushedSettings = key;
    }
    return;
  }

  // Local profile edits win: upload a freshly-picked avatar, then push everything.
  let avatarUrl = ps.avatarUri;
  if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
    avatarUrl = await uploadAvatar(userId, avatarUrl);
    if (avatarUrl) useProfileStore.getState().adopt({ avatarUri: avatarUrl });
  }
  await upsertProfile(userId, {
    ...settings,
    preferredName: ps.preferredName,
    handle: ps.handle || null,
    bio: ps.bio,
    phoneNumber: ps.phoneNumber,
    email: ps.email || null,
    avatarUrl: avatarUrl ?? null,
  });
  lastPushedSettings = JSON.stringify(settings);
  useProfileStore.getState().clearDirty();
}

async function runPhase(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    // Each phase is isolated: one failing must never block the others. In
    // particular a failed push must not stop the pull that loads a fresh
    // device's data (that caused a blank screen after logging in elsewhere).
    console.warn(`[sync] ${name} failed:`, e instanceof Error ? e.message : String(e));
  }
}

export async function syncNow(): Promise<void> {
  if (running || !canSync()) return;
  running = true;
  useSyncStatusStore.getState().setSyncing(true);
  const userId = useAuthStore.getState().userId;
  // Pull before push: a fresh device must show the account's data immediately,
  // and pulling the profile first prevents an empty local profile from
  // overwriting the cloud one.
  await runPhase('pullProfile', () => pullProfile(userId));
  await runPhase('pullMeals', () => pullMeals(userId));
  await runPhase('pushOutbox', () => pushOutbox(userId));
  await runPhase('pushProfile', () => pushProfile(userId));
  running = false;
  useSyncStatusStore.getState().setSyncing(false);
}

// Debounced trigger for write paths and event listeners.
export function triggerSync(delayMs = 400): void {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    debounce = null;
    void syncNow();
  }, delayMs);
}
