import { useMemo } from 'react';
import { useMeals } from './useMeals';
import { addDays, isSameLocalDay, startOfDay } from '@/lib/time';
import { FEELING_EMOJI } from '@/types/meal';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

const PALETTE = ['#1FB6E5', '#8C6CF1', '#F4C04C', '#34C9A2', '#F25C8B', '#94A3B8'];

function topCounts(items: string[][], take = 4): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const arr of items) {
    for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, take);
}

export interface InsightsData {
  weekDays: { label: string; value: number; date: Date }[];
  highlightIndex: number;
  onPathPct: number;
  whyEatSlices: DonutSlice[];
  feelingSlices: DonutSlice[];
  weekMealCount: number;
}

export function useInsights(): InsightsData {
  const { data: meals } = useMeals();

  return useMemo(() => {
    const today = startOfDay(new Date());
    // Build week starting Mon of current week
    const dow = (today.getDay() + 6) % 7; // Mon=0..Sun=6
    const monday = addDays(today, -dow);
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weekDays = labels.map((label, i) => {
      const date = addDays(monday, i);
      const value = meals.filter((m) => isSameLocalDay(m.eatenAt, date)).length;
      return { label, value, date };
    });
    const highlightIndex = (today.getDay() + 6) % 7;

    const weekMeals = meals.filter((m) =>
      weekDays.some((d) => isSameLocalDay(m.eatenAt, d.date)),
    );
    const onPathPct =
      weekMeals.length === 0
        ? 0
        : (weekMeals.filter((m) => m.onPath).length / weekMeals.length) * 100;

    const whyEatTop = topCounts(weekMeals.map((m) => m.whyEat));
    const whyEatSlices: DonutSlice[] = whyEatTop.map((x, i) => ({
      ...x,
      color: PALETTE[i % PALETTE.length] as string,
    }));

    const feelingCounts = new Map<number, number>();
    for (const m of weekMeals) {
      if (m.feeling !== null) {
        feelingCounts.set(m.feeling, (feelingCounts.get(m.feeling) ?? 0) + 1);
      }
    }
    const feelingArr = Array.from(feelingCounts.entries())
      .map(([k, v]) => ({ label: FEELING_EMOJI[k] ?? '🙂', value: v }))
      .sort((a, b) => b.value - a.value);
    const feelingPalette = ['#F25C8B', '#1FB6E5', '#8C6CF1', '#34C9A2', '#F4C04C'];
    const feelingSlices: DonutSlice[] = feelingArr.map((x, i) => ({
      ...x,
      color: feelingPalette[i % feelingPalette.length] as string,
    }));

    return {
      weekDays,
      highlightIndex,
      onPathPct,
      whyEatSlices,
      feelingSlices,
      weekMealCount: weekMeals.length,
    };
  }, [meals]);
}
