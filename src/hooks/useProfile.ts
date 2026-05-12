import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as profileService from '@/services/profile';
import { useAuthStore } from '@/stores/authStore';

const KEY = ['profile'] as const;

export function useGoal(): { goal: string; isLoading: boolean } {
  const userId = useAuthStore((s) => s.userId);
  const q = useQuery({
    queryKey: [...KEY, userId, 'goal'],
    queryFn: () => profileService.getGoal(userId),
  });
  return { goal: q.data ?? 'Feeling happy and healthy', isLoading: q.isLoading };
}

export function useSetGoal(): (goal: string) => Promise<void> {
  const userId = useAuthStore((s) => s.userId);
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: (goal: string) => profileService.setGoal(userId, goal),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  return (goal: string) => m.mutateAsync(goal);
}
