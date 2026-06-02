import { isSupabaseConfigured } from '@/lib/supabase';
import { triggerSync } from '@/lib/sync';
import { uuidv4 } from '@/lib/uuid';
import { useLocalMealsStore } from '@/stores/localMealsStore';
import { useOutboxStore } from '@/stores/outboxStore';
import type { Meal } from '@/types/meal';

// Re-assigns meals logged under an un-owned local id (the `local-user` fallback
// or an anonymous session) to the account the user just signed into, so they're
// kept and synced under that account. Meals already owned by a real account are
// left alone. New ids are minted so they sync as fresh rows under the new uid
// (any old anonymous cloud rows are simply abandoned).
export function claimLocalMeals(fromUserId: string, toUserId: string): void {
  if (!fromUserId || !toUserId || fromUserId === toUserId) return;

  const store = useLocalMealsStore.getState();
  const reassigned: Meal[] = [];
  const remaining: Meal[] = [];
  for (const m of store.meals) {
    if (m.userId === fromUserId) {
      const claimed: Meal = { ...m, id: uuidv4(), userId: toUserId };
      reassigned.push(claimed);
      if (isSupabaseConfigured) useOutboxStore.getState().enqueueCreate(claimed);
    } else {
      remaining.push(m);
    }
  }

  if (reassigned.length === 0) return;
  store.setMeals([...reassigned, ...remaining]);
  if (isSupabaseConfigured) triggerSync();
}
