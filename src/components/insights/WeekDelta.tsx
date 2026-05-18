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
import { useI18n } from '@/i18n';
import type { Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
}

interface StatBlockProps {
  label: string;
  value: string;
  delta: number;
  deltaText: string;
  vsLabel: string;
  betterIs: 'higher' | 'either';
}

function StatBlock({
  label,
  value,
  delta,
  deltaText,
  vsLabel,
  betterIs,
}: StatBlockProps): JSX.Element {
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
        <Text style={{ color }} className="text-sm font-bold mx-1">
          {sign}
          {deltaText}
        </Text>
        <Text className="text-ink-mute text-xs">{vsLabel}</Text>
      </View>
    </View>
  );
}

export function WeekDelta({ meals }: Props): JSX.Element {
  const { t, d, lang } = useI18n();
  const { cur, prev, change } = useMemo(() => {
    const now = new Date();
    const thisWeek = weekRange(now);
    const lastWeek = previousWeek(thisWeek);
    const curMeals = mealsInWeek(meals, thisWeek);
    const prevMeals = mealsInWeek(meals, lastWeek);
    return {
      cur: weekStats(curMeals),
      prev: weekStats(prevMeals),
      change: biggestChange(curMeals, prevMeals, lang),
    };
  }, [meals, lang]);

  if (cur.total === 0 && prev.total === 0) {
    return <Text className="text-ink-soft text-sm">{t('ins.thisWeekEmpty')}</Text>;
  }

  const pctDelta = cur.pct - prev.pct;
  const mealsDelta = cur.total - prev.total;

  return (
    <View>
      <View className="flex-row">
        <StatBlock
          label={t('ins.statOnPath')}
          value={`${d(cur.pct)}%`}
          delta={pctDelta}
          deltaText={`${d(Math.abs(pctDelta))}pp`}
          vsLabel={t('ins.vsLastWeek')}
          betterIs="higher"
        />
        <StatBlock
          label={t('ins.statMeals')}
          value={`${d(cur.total)}`}
          delta={mealsDelta}
          deltaText={d(Math.abs(mealsDelta))}
          vsLabel={t('ins.vsLastWeek')}
          betterIs="either"
        />
      </View>
      {change ? (
        <View className="mt-3 pt-3 border-t border-slate-200">
          <Text className="text-[10px] uppercase tracking-widest text-ink-mute mb-1">
            {t('ins.biggestChange')}
          </Text>
          <Text className="text-ink text-sm font-semibold">{change}</Text>
        </View>
      ) : null}
    </View>
  );
}
