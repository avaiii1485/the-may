import { ArrowDown, ArrowUp, Minus } from 'lucide-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import {
  biggestChange,
  mealsInWeek,
  previousWeek,
  weekRange,
  weekStats,
} from '@/lib/weekCompare';
import type { Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
}

interface StatBlockProps {
  label: string;
  value: string;
  delta: number;
  deltaSuffix: string;
  /** 'higher' = green when up; 'either' = neutral coloring regardless */
  betterIs: 'higher' | 'either';
}

function StatBlock({ label, value, delta, deltaSuffix, betterIs }: StatBlockProps): JSX.Element {
  const isFlat = delta === 0;
  let color = '#94A3B8';
  if (!isFlat && betterIs === 'higher') {
    color = delta > 0 ? '#34C9A2' : '#F25C8B';
  }
  const Icon = isFlat ? Minus : delta > 0 ? ArrowUp : ArrowDown;
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return (
    <View className="flex-1">
      <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">{label}</Text>
      <Text className="text-ink text-3xl font-bold">{value}</Text>
      <View className="flex-row items-center mt-1">
        <Icon size={14} color={color} />
        <Text style={{ color }} className="text-sm font-bold ml-1">
          {sign}
          {Math.abs(delta)}
          {deltaSuffix}
        </Text>
        <Text className="text-ink-mute text-xs ml-1">vs last week</Text>
      </View>
    </View>
  );
}

export function WeekDelta({ meals }: Props): JSX.Element {
  const { cur, prev, change } = useMemo(() => {
    const now = new Date();
    const thisWeek = weekRange(now);
    const lastWeek = previousWeek(thisWeek);
    const curMeals = mealsInWeek(meals, thisWeek);
    const prevMeals = mealsInWeek(meals, lastWeek);
    return {
      cur: weekStats(curMeals),
      prev: weekStats(prevMeals),
      change: biggestChange(curMeals, prevMeals),
    };
  }, [meals]);

  if (cur.total === 0 && prev.total === 0) {
    return (
      <Text className="text-ink-soft text-sm">
        Log meals across two weeks and you'll see week-over-week trends here.
      </Text>
    );
  }

  return (
    <View>
      <View className="flex-row">
        <StatBlock
          label="On-path"
          value={`${cur.pct}%`}
          delta={cur.pct - prev.pct}
          deltaSuffix="pp"
          betterIs="higher"
        />
        <StatBlock
          label="Meals"
          value={`${cur.total}`}
          delta={cur.total - prev.total}
          deltaSuffix=""
          betterIs="either"
        />
      </View>
      {change ? (
        <View className="mt-3 pt-3 border-t border-slate-200">
          <Text className="text-[10px] uppercase tracking-widest text-ink-mute mb-1">
            Biggest change
          </Text>
          <Text className="text-ink text-sm font-semibold">{change}</Text>
        </View>
      ) : null}
    </View>
  );
}
