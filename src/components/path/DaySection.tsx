import { router } from 'expo-router';
import { View } from 'react-native';
import { ConnectorRow } from './ConnectorRow';
import { DayEndArrow } from './DayEndArrow';
import { DayHeader } from './DayHeader';
import { DayRecap } from './DayRecap';
import { MealRow } from './MealRow';
import { dayLabel, formatFrequency, pctOnPath } from '@/lib/dayGroup';
import { startOfDay } from '@/lib/time';
import type { Meal } from '@/types/meal';

interface Props {
  date: Date;
  meals: Meal[];
  today: Date;
}

export function DaySection({ date, meals, today }: Props): JSX.Element {
  const isToday = startOfDay(date).getTime() === today.getTime();
  const label = dayLabel(date, today);
  const last = meals[meals.length - 1];

  return (
    <View>
      {!isToday ? <DayHeader label={label} /> : null}

      <View className="pt-2">
        {meals.map((m, i) => (
          <View key={m.id}>
            {i > 0 ? (
              <ConnectorRow
                fromOnPath={meals[i - 1]?.onPath ?? true}
                toOnPath={m.onPath}
              />
            ) : null}
            <MealRow
              meal={m}
              prevEatenAt={meals[i - 1]?.eatenAt ?? null}
              onPress={() => router.push(`/meal/${m.id}`)}
            />
          </View>
        ))}
        {last ? <DayEndArrow fromOnPath={last.onPath} /> : null}
      </View>

      <DayRecap
        label={label}
        date={date}
        pct={pctOnPath(meals)}
        mealCount={meals.length}
        frequency={formatFrequency(meals)}
      />
    </View>
  );
}
