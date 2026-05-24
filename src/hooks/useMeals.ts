import { useMemo } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { triggerSync } from '@/lib/sync';
import { uuidv4 } from '@/lib/uuid';
import { useAuthStore } from '@/stores/authStore';
import { useCaptureDraftStore } from '@/stores/captureDraftStore';
import { useLocalMealsStore } from '@/stores/localMealsStore';
import { useOutboxStore, type MealPatch } from '@/stores/outboxStore';
import type { Meal } from '@/types/meal';

// Local-first: the meals store is the source of truth the UI renders. Writes go
// to the store immediately (instant UI) and, when Supabase is configured, are
// queued in the outbox for the sync engine to push.

export function useMeals(): { data: Meal[]; isLoading: boolean } {
  const userId = useAuthStore((s) => s.userId);
  const meals = useLocalMealsStore((s) => s.meals);
  const hydrated = useLocalMealsStore((s) => s.hydrated);
  const data = useMemo(
    () =>
      meals
        .filter((m) => m.userId === userId)
        .slice()
        .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime()),
    [meals, userId],
  );
  return { data, isLoading: !hydrated };
}

export function useCreateMeal(): {
  saveOnPath: () => Promise<Meal>;
  saveOffPath: () => Promise<Meal>;
  isPending: boolean;
} {
  const userId = useAuthStore((s) => s.userId);
  const draft = useCaptureDraftStore((s) => s.draft);
  const reset = useCaptureDraftStore((s) => s.reset);

  const save = async (onPath: boolean): Promise<Meal> => {
    const now = new Date().toISOString();
    const meal: Meal = {
      id: uuidv4(),
      userId,
      photoUrl: draft.photoUri,
      textContent: draft.textContent ? draft.textContent : null,
      eatenAt: draft.eatenAt ?? now,
      onPath,
      note: draft.note || null,
      whyEat: draft.whyEat,
      feeling: draft.feeling,
      ateWith: draft.ateWith,
      howWasIt: draft.howWasIt,
      whereEat: draft.whereEat,
      howMade: draft.howMade,
      madeMeFeel: draft.madeMeFeel,
      createdAt: now,
    };
    useLocalMealsStore.getState().addMeal(meal);
    if (isSupabaseConfigured) {
      useOutboxStore.getState().enqueueCreate(meal);
      triggerSync();
    }
    reset();
    return meal;
  };

  return {
    saveOnPath: () => save(true),
    saveOffPath: () => save(false),
    isPending: false,
  };
}

export function useDeleteMeal(): (id: string) => Promise<void> {
  return async (id: string) => {
    useLocalMealsStore.getState().removeMeal(id);
    if (isSupabaseConfigured) {
      useOutboxStore.getState().enqueueDelete(id);
      triggerSync();
    }
  };
}

export function useMeal(id: string | undefined): { data: Meal | undefined; isLoading: boolean } {
  const { data, isLoading } = useMeals();
  const meal = id ? data.find((m) => m.id === id) : undefined;
  return { data: meal, isLoading };
}

export function useUpdateMeal(): {
  update: (id: string, patch: MealPatch) => Promise<Meal>;
  isPending: boolean;
} {
  return {
    update: async (id, patch) => {
      useLocalMealsStore.getState().updateMeal(id, patch);
      if (isSupabaseConfigured) {
        useOutboxStore.getState().enqueueUpdate(id, patch);
        triggerSync();
      }
      const updated = useLocalMealsStore.getState().meals.find((m) => m.id === id);
      if (!updated) throw new Error('Meal not found');
      return updated;
    },
    isPending: false,
  };
}
