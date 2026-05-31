import { isSupabaseConfigured } from '@/lib/supabase';
import {
  remoteListMeals,
  remoteSoftDeleteMeal,
  remoteUpdateMeal,
  remoteUpsertMeal,
} from '@/services/meals';
import { getProfile, upsertProfile } from '@/services/profile';
import { uploadMealPhoto } from '@/services/storage';
import { useAuthStore, LOCAL_USER_ID } from '@/stores/authStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useLocalMealsStore } from '@/stores/localMealsStore';
import { useOutboxStore, type MealPatch } from '@/stores/outboxStore';
import { usePinnedInsightsStore } from '@/stores/pinnedInsightsStore';
import { useProfileStore } from '@/stores/profileStore';
import { useSeenBadgesStore } from '@/stores/seenBadgesStore';
import type { Meal } from '@/types/meal';

// Local-first sync engine. The meals store is the source of truth the UI renders;
// this drains the outbox to Supabase and pulls server state back, so the app
// works offline and reconciles when a connection is available.

let running = false;
let debounce: ReturnType<typeof setTimeout> | null = null;

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

// Pull the account's profile from the cloud and adopt cloud values where the
// local field is empty/default — i.e. a fresh device picks up your name, goal,
// etc., while a device where you've already edited keeps its edits. The
// "local non-empty wins" rule + diffing avoids clobbering and sync loops.
async function pullProfile(userId: string): Promise<void> {
  const remote = await getProfile(userId);
  if (!remote) return;

  const ps = useProfileStore.getState();
  const patch: Partial<{ preferredName: string; handle: string; bio: string; phoneNumber: string }> = {};
  if (!ps.preferredName && remote.preferredName) patch.preferredName = remote.preferredName;
  if (!ps.handle && remote.handle) patch.handle = remote.handle;
  if (!ps.bio && remote.bio) patch.bio = remote.bio;
  if (!ps.phoneNumber && remote.phoneNumber) patch.phoneNumber = remote.phoneNumber;
  if (Object.keys(patch).length > 0) ps.update(patch);

  const localGoal = useLocalMealsStore.getState().goal;
  const isDefaultGoal = !localGoal || localGoal === 'Feeling happy and healthy';
  if (isDefaultGoal && remote.goal && remote.goal !== localGoal) {
    useLocalMealsStore.getState().setGoal(remote.goal);
  }
}

// Push-only for now: this device's profile state wins. (Multi-device profile
// pull/merge is a future refinement; push-only guarantees offline edits aren't lost.)
async function pushProfile(userId: string): Promise<void> {
  const p = useProfileStore.getState();
  await upsertProfile(userId, {
    preferredName: p.preferredName,
    handle: p.handle || null,
    bio: p.bio,
    phoneNumber: p.phoneNumber,
    goal: useLocalMealsStore.getState().goal,
    lang: useLanguageStore.getState().lang,
    prefs: {
      pinnedInsights: usePinnedInsightsStore.getState().pinned,
      seenBadges: useSeenBadgesStore.getState().seen,
    },
  });
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
  const userId = useAuthStore.getState().userId;
  // Pull before push: a fresh device must show the account's data immediately,
  // and pulling the profile first prevents an empty local profile from
  // overwriting the cloud one.
  await runPhase('pullProfile', () => pullProfile(userId));
  await runPhase('pullMeals', () => pullMeals(userId));
  await runPhase('pushOutbox', () => pushOutbox(userId));
  await runPhase('pushProfile', () => pushProfile(userId));
  running = false;
}

// Debounced trigger for write paths and event listeners.
export function triggerSync(delayMs = 400): void {
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(() => {
    debounce = null;
    void syncNow();
  }, delayMs);
}
