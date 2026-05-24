import { supabase } from '@/lib/supabase';
import type { CatalogQuestion, QuestionType } from '@/lib/questionFields';
import type { Database } from '@/types/database.types';

type QuestionRow = Database['public']['Tables']['questions']['Row'];
type OptionRow = Database['public']['Tables']['question_options']['Row'];

// Fetches the question catalog from Supabase. Two simple queries joined in code
// (our hand-written Database types don't model the relationship for an embed).
// `.returns<T>()` pins the row types, which the typed client otherwise widens to
// `never` (the null-client quirk noted in CLAUDE.md).
export async function fetchCatalog(): Promise<CatalogQuestion[]> {
  if (!supabase) return [];

  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true)
    .order('display_order')
    .returns<QuestionRow[]>();
  if (qErr) throw qErr;

  const { data: options, error: oErr } = await supabase
    .from('question_options')
    .select('*')
    .eq('active', true)
    .order('display_order')
    .returns<OptionRow[]>();
  if (oErr) throw oErr;

  const valuesByQuestion = new Map<string, string[]>();
  for (const o of options ?? []) {
    const arr = valuesByQuestion.get(o.question_id) ?? [];
    arr.push(o.value);
    valuesByQuestion.set(o.question_id, arr);
  }

  return (questions ?? []).map((q) => ({
    key: q.key,
    type: q.type as QuestionType,
    options: valuesByQuestion.get(q.id) ?? [],
    order: q.display_order,
    active: q.active,
    isCore: q.is_core,
  }));
}
