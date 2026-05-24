import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type { FeelingLevel, Meal } from '@/types/meal';
import type { MealPatch } from '@/stores/outboxStore';

// Remote layer only. Local-first reads/writes live in the meals store; the sync
// engine (src/lib/sync.ts) calls these to push the outbox and pull server state.
// Every function assumes Supabase is configured — callers guard on that.

type MealRow = Database['public']['Tables']['meals']['Row'];
type MealInsert = Database['public']['Tables']['meals']['Insert'];
type MealUpdate = Database['public']['Tables']['meals']['Update'];

export function rowToMeal(r: MealRow): Meal {
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

function mealToInsert(m: Meal): MealInsert {
  return {
    id: m.id,
    user_id: m.userId,
    eaten_at: m.eatenAt,
    on_path: m.onPath,
    note: m.note,
    photo_url: m.photoUrl,
    text_content: m.textContent,
    why_eat: m.whyEat,
    feeling: m.feeling,
    ate_with: m.ateWith,
    how_was_it: m.howWasIt,
    where_eat: m.whereEat,
    how_made: m.howMade,
    made_me_feel: m.madeMeFeel,
  };
}

function patchToUpdate(patch: MealPatch): MealUpdate {
  const u: MealUpdate = {};
  if ('photoUrl' in patch) u.photo_url = patch.photoUrl;
  if ('textContent' in patch) u.text_content = patch.textContent;
  if ('eatenAt' in patch) u.eaten_at = patch.eatenAt;
  if ('onPath' in patch) u.on_path = patch.onPath;
  if ('note' in patch) u.note = patch.note;
  if ('whyEat' in patch) u.why_eat = patch.whyEat;
  if ('feeling' in patch) u.feeling = patch.feeling;
  if ('ateWith' in patch) u.ate_with = patch.ateWith;
  if ('howWasIt' in patch) u.how_was_it = patch.howWasIt;
  if ('whereEat' in patch) u.where_eat = patch.whereEat;
  if ('howMade' in patch) u.how_made = patch.howMade;
  if ('madeMeFeel' in patch) u.made_me_feel = patch.madeMeFeel;
  return u;
}

export async function remoteListMeals(userId: string): Promise<Meal[]> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('eaten_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToMeal);
}

// Upsert so a retried create (same client-generated id) is idempotent.
export async function remoteUpsertMeal(meal: Meal): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  // `as never`: Supabase's typed client narrows insert args to never when the
  // client type includes null (see CLAUDE.md). The runtime payload is correct.
  const { error } = await supabase.from('meals').upsert(mealToInsert(meal) as never);
  if (error) throw error;
}

export async function remoteUpdateMeal(
  userId: string,
  id: string,
  patch: MealPatch,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('meals')
    .update(patchToUpdate(patch) as never)
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

// Soft delete: keep the row for recoverability; local store removes it from view.
export async function remoteSoftDeleteMeal(userId: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('meals')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}
