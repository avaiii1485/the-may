import { isSupabaseConfigured } from '@/lib/supabase';
import { triggerSync } from '@/lib/sync';
import { useLocalMealsStore } from '@/stores/localMealsStore';

// Goal is local-first like meals: the local store is the source of truth, and the
// sync engine pushes it to profiles.goal. Reads work offline.
export function useGoal(): { goal: string; isLoading: boolean } {
  const goal = useLocalMealsStore((s) => s.goal);
  const hydrated = useLocalMealsStore((s) => s.hydrated);
  return { goal: goal || 'Feeling happy and healthy', isLoading: !hydrated };
}

export function useSetGoal(): (goal: string) => Promise<void> {
  return async (goal: string) => {
    useLocalMealsStore.getState().setGoal(goal);
    if (isSupabaseConfigured) triggerSync();
  };
}
