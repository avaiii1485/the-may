import { startOfDay } from './time';
import { tvStatic } from '@/i18n';
import type { Lang } from '@/stores/languageStore';
import type { Meal } from '@/types/meal';

export interface WeekRange {
  start: Date;
  end: Date; // exclusive
}

// Returns the Mon..next-Mon range that contains `ref` (local time, Monday-first weeks).
export function weekRange(ref: Date): WeekRange {
  const start = startOfDay(ref);
  const dow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dow);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function previousWeek(current: WeekRange): WeekRange {
  const start = new Date(current.start);
  start.setDate(start.getDate() - 7);
  const end = new Date(current.start);
  return { start, end };
}

function inRange(iso: string, r: WeekRange): boolean {
  const t = new Date(iso).getTime();
  return t >= r.start.getTime() && t < r.end.getTime();
}

export function mealsInWeek(meals: Meal[], r: WeekRange): Meal[] {
  return meals.filter((m) => inRange(m.eatenAt, r));
}

export interface WeekStats {
  total: number;
  onPath: number;
  pct: number; // 0..100
}

export function weekStats(meals: Meal[]): WeekStats {
  const total = meals.length;
  const onPath = meals.filter((m) => m.onPath).length;
  const pct = total === 0 ? 0 : Math.round((onPath / total) * 100);
  return { total, onPath, pct };
}

function lowercaseFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

interface ChangeCandidate {
  text: string;
  magnitude: number;
}

// Surface the most striking behavioural change between two weeks
// (e.g. "you ate at the table more this week").
export function biggestChange(
  current: Meal[],
  previous: Meal[],
  lang: Lang = 'en',
): string | null {
  if (current.length === 0 && previous.length === 0) return null;

  const dimensions: { label: 'location' | 'company' | 'prep' | 'reason'; get: (m: Meal) => string[] }[] = [
    { label: 'location', get: (m) => m.whereEat },
    { label: 'company', get: (m) => m.ateWith },
    { label: 'prep', get: (m) => (m.howMade ? [m.howMade] : []) },
    { label: 'reason', get: (m) => m.whyEat },
  ];

  const candidates: ChangeCandidate[] = [];
  for (const dim of dimensions) {
    const curCounts = new Map<string, number>();
    const prevCounts = new Map<string, number>();
    for (const m of current) for (const v of dim.get(m)) curCounts.set(v, (curCounts.get(v) ?? 0) + 1);
    for (const m of previous) for (const v of dim.get(m)) prevCounts.set(v, (prevCounts.get(v) ?? 0) + 1);

    const all = new Set<string>([...curCounts.keys(), ...prevCounts.keys()]);
    for (const v of all) {
      const c = curCounts.get(v) ?? 0;
      const p = prevCounts.get(v) ?? 0;
      const delta = c - p;
      if (Math.abs(delta) < 2) continue;
      const dir = delta > 0 ? 'more' : 'less';
      let text: string;
      if (lang === 'fa') {
        const vf = tvStatic('fa', 'opt', v);
        const d = delta > 0 ? 'بیشتر' : 'کمتر';
        switch (dim.label) {
          case 'location':
            text = `این هفته ${vf} ${d} غذا خوردی`;
            break;
          case 'company':
            text =
              v === 'By myself'
                ? `این هفته ${d} تنها غذا خوردی`
                : `این هفته ${d} با ${vf} غذا خوردی`;
            break;
          case 'prep':
            text = `این هفته ${d} وعده‌ی ${vf} داشتی`;
            break;
          case 'reason':
            text = `این هفته ${d} به‌خاطر «${vf}» غذا خوردی`;
            break;
        }
      } else {
        switch (dim.label) {
          case 'location':
            text = `Ate at ${lowercaseFirst(v)} ${dir} this week`;
            break;
          case 'company':
            text =
              v === 'By myself'
                ? `Ate by yourself ${dir} this week`
                : `Ate with ${lowercaseFirst(v)} ${dir} this week`;
            break;
          case 'prep':
            text = `${dir === 'more' ? 'More' : 'Less'} ${lowercaseFirst(v)} meals this week`;
            break;
          case 'reason':
            text = `Ate because of "${lowercaseFirst(v)}" ${dir} this week`;
            break;
        }
      }
      candidates.push({ text, magnitude: Math.abs(delta) });
    }
  }

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.magnitude - a.magnitude);
  return candidates[0]!.text;
}
