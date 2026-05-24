import { QUESTIONS, type DraftMeal } from '@/types/meal';

// The capture/edit forms are driven by the question catalog (which questions
// appear, their order, type, and option values). This module maps the catalog's
// core question keys to the typed draft fields they bind to, and provides an
// offline fallback so the form always has something to render.

export type QuestionType = 'single' | 'multi' | 'scale';

export interface CatalogQuestion {
  /** Snake-case key matching the DB / meals column, e.g. 'why_eat'. */
  key: string;
  type: QuestionType;
  /** Canonical English option values (display handled by i18n `tv('opt', …)`). */
  options: string[];
  order: number;
  active: boolean;
  isCore: boolean;
}

interface CoreField {
  /** Draft/Meal field this question binds to. */
  field: keyof DraftMeal;
  type: QuestionType;
  /** i18n key for the section heading. */
  promptKey: string;
}

// The six built-in questions: catalog key -> typed field + control + label key.
export const CORE_FIELDS: Record<string, CoreField> = {
  why_eat: { field: 'whyEat', type: 'multi', promptKey: 'q.whyEat' },
  feeling: { field: 'feeling', type: 'scale', promptKey: 'q.feeling' },
  ate_with: { field: 'ateWith', type: 'multi', promptKey: 'q.ateWith' },
  how_was_it: { field: 'howWasIt', type: 'single', promptKey: 'q.howWasIt' },
  where_eat: { field: 'whereEat', type: 'multi', promptKey: 'q.whereEat' },
  how_made: { field: 'howMade', type: 'single', promptKey: 'q.howMade' },
  made_me_feel: { field: 'madeMeFeel', type: 'multi', promptKey: 'q.madeMeFeel' },
};

export function isCoreKey(key: string): boolean {
  return key in CORE_FIELDS;
}

export function coreField(key: string): CoreField | undefined {
  return CORE_FIELDS[key];
}

// Used when Supabase is unconfigured, offline, or the catalog is empty. Mirrors
// the seed in 0002_questions_catalog.sql so online/offline render identically.
export const FALLBACK_QUESTIONS: CatalogQuestion[] = [
  { key: 'why_eat', type: 'multi', options: [...QUESTIONS.whyEat.options], order: 1, active: true, isCore: true },
  { key: 'feeling', type: 'scale', options: [], order: 2, active: true, isCore: true },
  { key: 'ate_with', type: 'multi', options: [...QUESTIONS.ateWith.options], order: 3, active: true, isCore: true },
  { key: 'how_was_it', type: 'single', options: [...QUESTIONS.howWasIt.options], order: 4, active: true, isCore: true },
  { key: 'where_eat', type: 'multi', options: [...QUESTIONS.whereEat.options], order: 5, active: true, isCore: true },
  { key: 'how_made', type: 'single', options: [...QUESTIONS.howMade.options], order: 6, active: true, isCore: true },
  { key: 'made_me_feel', type: 'multi', options: [...QUESTIONS.madeMeFeel.options], order: 7, active: true, isCore: true },
];
