import { Text, View } from 'react-native';
import { CollageTile } from './CollageTile';
import { useI18n } from '@/i18n';
import type { Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
  height?: number;
}

// Layouts adapt to meal count:
// 1: single tile · 2: two columns · 3: tall left + two stacked right ·
// 4: 2×2 · 5–6: 3 cols × 2 rows · 7–9: 3×3 · 10+: 3 cols, wrapped rows.
export function DayCollage({ meals, height = 380 }: Props): JSX.Element {
  const { t } = useI18n();
  const n = meals.length;
  if (n === 0) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-ink-mute">{t('recap.noMeals')}</Text>
      </View>
    );
  }

  const m = meals;
  if (n === 1) {
    return <CollageTile meal={m[0]!} style={{ height, width: '100%' }} />;
  }
  if (n === 2) {
    return (
      <View style={{ flexDirection: 'row', height }}>
        <CollageTile meal={m[0]!} style={{ flex: 1 }} />
        <CollageTile meal={m[1]!} style={{ flex: 1 }} />
      </View>
    );
  }
  if (n === 3) {
    return (
      <View style={{ flexDirection: 'row', height }}>
        <CollageTile meal={m[0]!} style={{ flex: 1 }} />
        <View style={{ flex: 1 }}>
          <CollageTile meal={m[1]!} style={{ flex: 1 }} />
          <CollageTile meal={m[2]!} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }
  if (n === 4) {
    return (
      <View style={{ height }}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <CollageTile meal={m[0]!} style={{ flex: 1 }} />
          <CollageTile meal={m[1]!} style={{ flex: 1 }} />
        </View>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <CollageTile meal={m[2]!} style={{ flex: 1 }} />
          <CollageTile meal={m[3]!} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }
  // 5+ → 3-column grid, rows wrap. Total grid height fixed; rows share evenly.
  const cols = n <= 6 ? 3 : 3;
  const rows = Math.ceil(n / cols);
  const grid: Meal[][] = [];
  for (let r = 0; r < rows; r++) {
    grid.push(m.slice(r * cols, r * cols + cols));
  }
  return (
    <View style={{ height }}>
      {grid.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', flex: 1 }}>
          {row.map((meal) => (
            <CollageTile key={meal.id} meal={meal} style={{ flex: 1 }} />
          ))}
          {row.length < cols
            ? Array.from({ length: cols - row.length }).map((_, i) => (
                <View key={`pad-${ri}-${i}`} style={{ flex: 1, backgroundColor: '#F1F5F9' }} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}
