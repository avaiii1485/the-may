import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocalMealsStore } from '@/stores/localMealsStore';

export async function getGoal(userId: string): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    return useLocalMealsStore.getState().goal;
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('goal')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data?.goal ?? 'Feeling happy and healthy';
}

export async function setGoal(userId: string, goal: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    useLocalMealsStore.getState().setGoal(goal);
    return;
  }
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, goal, updated_at: new Date().toISOString() });
  if (error) throw error;
}
