import { toJalali } from './jalali';
import { startOfDay } from './time';
import type { Lang } from '@/stores/languageStore';
import type { Meal } from '@/types/meal';

const WEEKDAYS_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'] as const;


export interface DayGroup {
  date: Date;
  meals: Meal[];
}

export function groupMealsByDay(meals: Meal[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const m of meals) {
    const day = startOfDay(new Date(m.eatenAt));
    const key = day.toISOString();
    const existing = groups.get(key);
    if (existing) {
      existing.meals.push(m);
    } else {
      groups.set(key, { date: day, meals: [m] });
    }
  }
  // Oldest within day first (so the path reads top→bottom in time order).
  // Tie-break on createdAt (always full-precision) so meals logged in the same
  // minute still order by when they were actually logged.
  for (const g of groups.values()) {
    g.meals.sort((a, b) => {
      const byEaten = new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime();
      if (byEaten !== 0) return byEaten;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }
  // Most recent day at the top.
  return Array.from(groups.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export function dayLabel(date: Date, today: Date, lang: Lang = 'en'): string {
  const diffMs = today.getTime() - date.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (lang === 'fa') {
    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    const j = toJalali(date);
    return `${WEEKDAYS_FA[date.getDay()] ?? ''} - ${j.jd} ${j.monthName}`;
  }
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${WEEKDAYS[date.getDay()] ?? ''} - ${MONTHS[date.getMonth()] ?? ''} ${date.getDate()}`;
}

export function pctOnPath(meals: Meal[]): number {
  if (meals.length === 0) return 0;
  return Math.round((meals.filter((m) => m.onPath).length / meals.length) * 100);
}

export type TimelineEntry =
  | { kind: 'day'; date: Date; meals: Meal[] }
  | { kind: 'empty'; date: Date };

// Takes day groups in ascending order (oldest first) and inserts empty-day
// placeholders for every skipped calendar day between consecutive entries.
export function withEmptyDays(ascending: DayGroup[]): TimelineEntry[] {
  const result: TimelineEntry[] = [];
  for (let i = 0; i < ascending.length; i++) {
    const g = ascending[i];
    if (!g) continue;
    result.push({ kind: 'day', date: g.date, meals: g.meals });
    const next = ascending[i + 1];
    if (!next) continue;
    const cursor = new Date(g.date);
    cursor.setDate(cursor.getDate() + 1);
    while (cursor.getTime() < next.date.getTime()) {
      result.push({ kind: 'empty', date: new Date(cursor) });
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return result;
}

function dur(hours: number, mins: number, lang: Lang): string {
  if (lang === 'fa') {
    if (hours === 0) return `${mins} دقیقه`;
    return `${hours} ساعت ${mins} دقیقه`;
  }
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export function formatFrequency(meals: Meal[], lang: Lang = 'en'): string | null {
  if (meals.length < 2) return null;
  const sorted = [...meals].sort(
    (a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime(),
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return null;
  const totalMs = new Date(last.eatenAt).getTime() - new Date(first.eatenAt).getTime();
  const avgMs = totalMs / (meals.length - 1);
  const minutes = Math.max(0, Math.round(avgMs / 60000));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return dur(hours, mins, lang);
}

// Fasting = gap between the prior day's last meal and the current day's first meal.
export function computeFasting(
  currentDayMeals: Meal[],
  allMeals: Meal[],
  lang: Lang = 'en',
): string | null {
  const sortedToday = [...currentDayMeals].sort(
    (a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime(),
  );
  const firstToday = sortedToday[0];
  if (!firstToday) return null;
  const firstTodayMs = new Date(firstToday.eatenAt).getTime();
  let latestBefore: Meal | null = null;
  let latestBeforeMs = -Infinity;
  for (const m of allMeals) {
    const ms = new Date(m.eatenAt).getTime();
    if (ms < firstTodayMs && ms > latestBeforeMs) {
      latestBefore = m;
      latestBeforeMs = ms;
    }
  }
  if (!latestBefore) return null;
  const diffMin = Math.round((firstTodayMs - latestBeforeMs) / 60000);
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return dur(h, m, lang);
}

// "2 August" / "Sunday" parts for the recap header.
const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;
const FULL_WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
] as const;

export function dayHeaderParts(
  date: Date,
  lang: Lang = 'en',
): { dayMonth: string; weekday: string; full: string } {
  if (lang === 'fa') {
    const j = toJalali(date);
    const dayMonthFa = `${j.jd} ${j.monthName}`;
    const weekdayFa = WEEKDAYS_FA[date.getDay()] ?? '';
    const fullFa = `${weekdayFa} · ${j.jd} ${j.monthName} ${j.jy}`;
    return { dayMonth: dayMonthFa, weekday: weekdayFa, full: fullFa };
  }
  const dayMonth = `${date.getDate()} ${FULL_MONTHS[date.getMonth()] ?? ''}`;
  const weekday = FULL_WEEKDAYS[date.getDay()] ?? '';
  const monthShort = MONTHS[date.getMonth()] ?? '';
  const full = `${weekday} · ${monthShort} ${date.getDate()}, ${date.getFullYear()}`;
  return { dayMonth, weekday, full };
}
