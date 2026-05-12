import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as mealService from '@/services/meals';
import { uploadMealPhoto } from '@/services/storage';
import { useAuthStore } from '@/stores/authStore';
import { useCaptureDraftStore } from '@/stores/captureDraftStore';
import type { Meal } from '@/types/meal';

const KEY = ['meals'] as const;

export function useMeals(): { data: Meal[]; isLoading: boolean } {
  const userId = useAuthStore((s) => s.userId);
  const q = useQuery({
    queryKey: [...KEY, userId],
    queryFn: () => mealService.listMeals(userId),
  });
  return { data: q.data ?? [], isLoading: q.isLoading };
}

export function useCreateMeal(): {
  saveOnPath: () => Promise<Meal>;
  saveOffPath: () => Promise<Meal>;
  isPending: boolean;
} {
  const userId = useAuthStore((s) => s.userId);
  const draft = useCaptureDraftStore((s) => s.draft);
  const reset = useCaptureDraftStore((s) => s.reset);
  const qc = useQueryClient();

  const queryKey = [...KEY, userId] as const;

  const mutation = useMutation<Meal, Error, boolean, { previous: Meal[] | undefined; optimisticId: string }>({
    mutationFn: async (onPath: boolean): Promise<Meal> => {
      const photoUrl = draft.photoUri ? await uploadMealPhoto(userId, draft.photoUri) : null;
      const meal = await mealService.createMeal({ userId, draft, onPath, photoUrl });
      return meal;
    },
    onMutate: async (onPath: boolean) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Meal[]>(queryKey);
      const now = new Date().toISOString();
      const optimisticId = `optimistic_${Date.now()}`;
      const optimistic: Meal = {
        id: optimisticId,
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
      qc.setQueryData<Meal[]>(queryKey, [optimistic, ...(previous ?? [])]);
      return { previous, optimisticId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKey, ctx.previous);
    },
    onSuccess: (meal, _vars, ctx) => {
      qc.setQueryData<Meal[]>(queryKey, (old) => {
        if (!old) return [meal];
        return old.map((m) => (m.id === ctx?.optimisticId ? meal : m));
      });
      reset();
    },
  });

  return {
    saveOnPath: () => mutation.mutateAsync(true),
    saveOffPath: () => mutation.mutateAsync(false),
    isPending: mutation.isPending,
  };
}

export function useDeleteMeal(): (id: string) => Promise<void> {
  const userId = useAuthStore((s) => s.userId);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => mealService.deleteMeal(userId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return (id: string) => mutation.mutateAsync(id);
}

export function useMeal(id: string | undefined): { data: Meal | undefined; isLoading: boolean } {
  const { data, isLoading } = useMeals();
  const meal = id ? data.find((m) => m.id === id) : undefined;
  return { data: meal, isLoading };
}

export function useUpdateMeal(): {
  update: (id: string, patch: Parameters<typeof mealService.updateMeal>[0]['patch']) => Promise<Meal>;
  isPending: boolean;
} {
  const userId = useAuthStore((s) => s.userId);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (vars: { id: string; patch: Parameters<typeof mealService.updateMeal>[0]['patch'] }) =>
      mealService.updateMeal({ userId, id: vars.id, patch: vars.patch }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return {
    update: (id, patch) => mutation.mutateAsync({ id, patch }),
    isPending: mutation.isPending,
  };
}
