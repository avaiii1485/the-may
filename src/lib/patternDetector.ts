import type { Meal } from '@/types/meal';

export interface Insight {
  /** A complete, user-facing sentence */
  text: string;
  /** Short subtitle / category label */
  category: string;
  /** Direction relative to user's average */
  direction: 'on' | 'off';
  /** Percentage value for the highlighted segment */
  pct: number;
  /** Number of meals supporting this insight */
  count: number;
  /** Sort key — combines deviation magnitude with sample size */
  impact: number;
}

const MIN_TOTAL_MEALS = 5;
const MIN_BUCKET_COUNT = 3;
const MIN_DEVIATION = 0.12; // 12 percentage points away from overall mean

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

interface Bucket {
  count: number;
  onPath: number;
}

function aggregateBy<T>(
  meals: Meal[],
  keyFn: (m: Meal) => T | T[] | null,
): Map<T, Bucket> {
  const map = new Map<T, Bucket>();
  for (const m of meals) {
    const k = keyFn(m);
    const keys: T[] = k === null ? [] : Array.isArray(k) ? k : [k];
    for (const key of keys) {
      const cur = map.get(key) ?? { count: 0, onPath: 0 };
      cur.count += 1;
      if (m.onPath) cur.onPath += 1;
      map.set(key, cur);
    }
  }
  return map;
}

function pluralize(word: string): string {
  if (/[sxz]$/.test(word) || /(ch|sh)$/.test(word)) return word + 'es';
  return word + 's';
}

function lowercaseFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function timeBucket(hour: number): { key: string; label: string } {
  if (hour >= 5 && hour < 12) return { key: 'morning', label: 'in the morning' };
  if (hour >= 12 && hour < 17) return { key: 'afternoon', label: 'in the afternoon' };
  if (hour >= 17 && hour < 22) return { key: 'evening', label: 'in the evening' };
  return { key: 'late-night', label: 'late at night' };
}

function buildSentence(
  pct: number,
  overall: number,
  count: number,
  dimension: 'where' | 'with' | 'made' | 'why' | 'dow' | 'tod' | 'feel' | 'after',
  value: string,
): { text: string; direction: 'on' | 'off' } {
  const percent = Math.round(pct * 100);
  const direction: 'on' | 'off' = pct >= overall ? 'on' : 'off';
  const word = direction === 'on' ? 'on-path' : 'off-path';
  const shown = direction === 'on' ? percent : 100 - percent;
  const verb = direction === 'on' ? "you're" : 'you go';
  const cMeals = `${count} ${count === 1 ? 'meal' : 'meals'}`;
  switch (dimension) {
    case 'where':
      return {
        text: `${shown}% of meals you ate at ${lowercaseFirst(value)} were ${word}. (${cMeals})`,
        direction,
      };
    case 'with':
      return {
        text:
          value === 'By myself'
            ? `${shown}% of meals eaten by yourself were ${word}. (${cMeals})`
            : `${shown}% of meals with ${lowercaseFirst(value)} were ${word}. (${cMeals})`,
        direction,
      };
    case 'made':
      return {
        text: `${shown}% of ${lowercaseFirst(value)} meals were ${word}. (${cMeals})`,
        direction,
      };
    case 'why':
      return {
        text: `When you ate because of "${lowercaseFirst(value)}", ${verb} ${word} ${shown}% of the time. (${cMeals})`,
        direction,
      };
    case 'dow':
      return {
        text: `${pluralize(value)} are your ${direction === 'on' ? 'best' : 'toughest'} day — ${shown}% ${word}. (${cMeals})`,
        direction,
      };
    case 'tod':
      return {
        text: `${shown}% of meals ${value} were ${word}. (${cMeals})`,
        direction,
      };
    case 'after':
      return {
        text: `${shown}% of meals that left you feeling "${lowercaseFirst(value)}" were ${word}. (${cMeals})`,
        direction,
      };
    case 'feel':
      return {
        text: `${shown}% of meals when you felt ${value} were ${word}. (${cMeals})`,
        direction,
      };
  }
}

export function detectInsights(meals: Meal[]): Insight[] {
  if (meals.length < MIN_TOTAL_MEALS) return [];
  const overall = meals.filter((m) => m.onPath).length / meals.length;
  const out: Insight[] = [];

  const consider = (
    bucket: Bucket,
    dimension: Parameters<typeof buildSentence>[3],
    value: string,
    categoryLabel: string,
  ) => {
    if (bucket.count < MIN_BUCKET_COUNT) return;
    const pct = bucket.onPath / bucket.count;
    const deviation = Math.abs(pct - overall);
    if (deviation < MIN_DEVIATION) return;
    const { text, direction } = buildSentence(pct, overall, bucket.count, dimension, value);
    const impact = deviation * Math.sqrt(bucket.count);
    out.push({ text, category: categoryLabel, direction, pct, count: bucket.count, impact });
  };

  // Where you ate
  for (const [k, v] of aggregateBy(meals, (m) => m.whereEat)) {
    consider(v, 'where', k, 'Where you eat');
  }
  // Who you ate with
  for (const [k, v] of aggregateBy(meals, (m) => m.ateWith)) {
    consider(v, 'with', k, 'Who you eat with');
  }
  // How it was made
  for (const [k, v] of aggregateBy(meals, (m) => (m.howMade ? m.howMade : null))) {
    consider(v, 'made', k, 'How meals are made');
  }
  // Why you ate
  for (const [k, v] of aggregateBy(meals, (m) => m.whyEat)) {
    consider(v, 'why', k, 'Why you eat');
  }
  // Day of week
  for (const [k, v] of aggregateBy(meals, (m) => new Date(m.eatenAt).getDay())) {
    consider(v, 'dow', DAY_NAMES[k] ?? '', 'Day of the week');
  }
  // Time of day
  for (const [k, v] of aggregateBy(meals, (m) => timeBucket(new Date(m.eatenAt).getHours()).label)) {
    consider(v, 'tod', k, 'Time of day');
  }
  // How meals made you feel after
  for (const [k, v] of aggregateBy(meals, (m) => m.madeMeFeel)) {
    consider(v, 'after', k, 'How meals made you feel');
  }

  out.sort((a, b) => b.impact - a.impact);
  return out;
}
