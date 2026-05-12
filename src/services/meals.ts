import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useLocalMealsStore } from '@/stores/localMealsStore';
import type { DraftMeal, FeelingLevel, Meal } from '@/types/meal';

function rowToMeal(r: {
  id: string;
  user_id: string;
  photo_url: string | null;
  text_content: string | null;
  eaten_at: string;
  on_path: boolean;
  note: string | null;
  why_eat: string[];
  feeling: number | null;
  ate_with: string[];
  how_was_it: string | null;
  where_eat: string[];
  how_made: string | null;
  made_me_feel: string[];
  created_at: string;
}): Meal {
  return {
    id: r.id,
    userId: r.user_id,
    photoUrl: r.photo_url,
    textContent: r.text_content,
    eatenAt: r.eaten_at,
    onPath: r.on_path,
    note: r.note,
    whyEat: r.why_eat ?? [],
    feeling: r.feeling === null ? null : (Math.max(0, Math.min(4, r.feeling)) as FeelingLevel),
    ateWith: r.ate_with ?? [],
    howWasIt: (r.how_was_it as Meal['howWasIt']) ?? null,
    whereEat: r.where_eat ?? [],
    howMade: (r.how_made as Meal['howMade']) ?? null,
    madeMeFeel: r.made_me_feel ?? [],
    createdAt: r.created_at,
  };
}

export async function listMeals(userId: string): Promise<Meal[]> {
  if (!isSupabaseConfigured || !supabase) {
    return useLocalMealsStore
      .getState()
      .meals.filter((m) => m.userId === userId)
      .slice()
      .sort((a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime());
  }
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .order('eaten_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToMeal);
}

export interface CreateMealInput {
  userId: string;
  draft: DraftMeal;
  onPath: boolean;
  photoUrl: string | null;
}

export async function createMeal(input: CreateMealInput): Promise<Meal> {
  const now = new Date().toISOString();
  const eatenAt = input.draft.eatenAt ?? now;
  const id = `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const meal: Meal = {
    id,
    userId: input.userId,
    photoUrl: input.photoUrl,
    textContent: input.draft.textContent ? input.draft.textContent : null,
    eatenAt,
    onPath: input.onPath,
    note: input.draft.note || null,
    whyEat: input.draft.whyEat,
    feeling: input.draft.feeling,
    ateWith: input.draft.ateWith,
    howWasIt: input.draft.howWasIt,
    whereEat: input.draft.whereEat,
    howMade: input.draft.howMade,
    madeMeFeel: input.draft.madeMeFeel,
    createdAt: now,
  };
  if (!isSupabaseConfigured || !supabase) {
    useLocalMealsStore.getState().addMeal(meal);
    return meal;
  }
  const { data, error } = await supabase
    .from('meals')
    .insert({
      user_id: meal.userId,
      photo_url: meal.photoUrl,
      text_content: meal.textContent,
      eaten_at: meal.eatenAt,
      on_path: meal.onPath,
      note: meal.note,
      why_eat: meal.whyEat,
      feeling: meal.feeling,
      ate_with: meal.ateWith,
      how_was_it: meal.howWasIt,
      where_eat: meal.whereEat,
      how_made: meal.howMade,
      made_me_feel: meal.madeMeFeel,
    } as never)
    .select('*')
    .single();
  if (error) throw error;
  return rowToMeal(data);
}

export interface UpdateMealInput {
  userId: string;
  id: string;
  patch: Partial<Omit<Meal, 'id' | 'userId' | 'createdAt'>>;
}

export async function updateMeal(input: UpdateMealInput): Promise<Meal> {
  if (!isSupabaseConfigured || !supabase) {
    useLocalMealsStore.getState().updateMeal(input.id, input.patch);
    const updated = useLocalMealsStore
      .getState()
      .meals.find((m) => m.id === input.id);
    if (!updated) throw new Error('Meal not found');
    return updated;
  }
  const { patch } = input;
  const { data, error } = await supabase
    .from('meals')
    .update({
      photo_url: patch.photoUrl ?? undefined,
      text_content: patch.textContent ?? undefined,
      eaten_at: patch.eatenAt ?? undefined,
      on_path: patch.onPath ?? undefined,
      note: patch.note ?? undefined,
      why_eat: patch.whyEat ?? undefined,
      feeling: patch.feeling ?? undefined,
      ate_with: patch.ateWith ?? undefined,
      how_was_it: patch.howWasIt ?? undefined,
      where_eat: patch.whereEat ?? undefined,
      how_made: patch.howMade ?? undefined,
      made_me_feel: patch.madeMeFeel ?? undefined,
    } as never)
    .eq('user_id', input.userId)
    .eq('id', input.id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToMeal(data);
}

export async function deleteMeal(userId: string, id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    useLocalMealsStore.getState().removeMeal(id);
    return;
  }
  const { error } = await supabase.from('meals').delete().eq('user_id', userId).eq('id', id);
  if (error) throw error;
}
