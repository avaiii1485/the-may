import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { addDays, startOfDay } from '@/lib/time';
import type { Meal } from '@/types/meal';

const WEEKS = 12;
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
const CELL_SIZE = 18;
const GAP = 3;

const COLORS = {
  empty: '#F1F5F9',
  q1: '#FCEBD3',
  q2: '#F4D29F',
  q3: '#F4B370',
  q4: '#F39C3D',
  future: 'transparent',
} as const;

interface Props {
  meals: Meal[];
}

interface DayBucket {
  date: Date;
  count: number;
  onPath: number;
  pct: number;
  isFuture: boolean;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function colorForDay(b: DayBucket): string {
  if (b.isFuture) return COLORS.future;
  if (b.count === 0) return COLORS.empty;
  if (b.pct >= 0.75) return COLORS.q4;
  if (b.pct >= 0.5) return COLORS.q3;
  if (b.pct >= 0.25) return COLORS.q2;
  return COLORS.q1;
}

export function CalendarHeatmap({ meals }: Props): JSX.Element {
  const today = startOfDay(new Date());
  const dayOfWeekMonStart = (today.getDay() + 6) % 7;
  const gridStart = addDays(today, -((WEEKS - 1) * 7 + dayOfWeekMonStart));

  const byDay = new Map<string, { count: number; onPath: number }>();
  for (const m of meals) {
    const key = toIsoDate(startOfDay(new Date(m.eatenAt)));
    const cur = byDay.get(key) ?? { count: 0, onPath: 0 };
    cur.count += 1;
    if (m.onPath) cur.onPath += 1;
    byDay.set(key, cur);
  }

  const grid: DayBucket[][] = [];
  for (let row = 0; row < 7; row++) {
    const week: DayBucket[] = [];
    for (let col = 0; col < WEEKS; col++) {
      const date = addDays(gridStart, col * 7 + row);
      const data = byDay.get(toIsoDate(date)) ?? { count: 0, onPath: 0 };
      const pct = data.count > 0 ? data.onPath / data.count : 0;
      week.push({
        date,
        count: data.count,
        onPath: data.onPath,
        pct,
        isFuture: date.getTime() > today.getTime(),
      });
    }
    grid.push(week);
  }

  return (
    <View>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ marginRight: 6 }}>
          {DAY_LABELS.map((label, i) => (
            <View
              key={i}
              style={{ height: CELL_SIZE + GAP, justifyContent: 'center' }}
            >
              <Text className="text-[10px] text-ink-mute">{label}</Text>
            </View>
          ))}
        </View>
        <View>
          {grid.map((row, ri) => (
            <View key={ri} style={{ flexDirection: 'row', marginBottom: GAP }}>
              {row.map((cell, ci) => {
                const interactive = !cell.isFuture && cell.count > 0;
                return (
                  <Pressable
                    key={`${ri}-${ci}`}
                    disabled={!interactive}
                    onPress={
                      interactive
                        ? () => router.push(`/day-recap/${toIsoDate(cell.date)}`)
                        : undefined
                    }
                    accessibilityLabel={
                      interactive
                        ? `${toIsoDate(cell.date)} — ${Math.round(cell.pct * 100)}% on-path, ${cell.count} meals`
                        : undefined
                    }
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: 4,
                      backgroundColor: colorForDay(cell),
                      marginRight: GAP,
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View className="flex-row items-center justify-end mt-3">
        <Text className="text-[10px] text-ink-mute mr-2">Less</Text>
        {[COLORS.empty, COLORS.q1, COLORS.q2, COLORS.q3, COLORS.q4].map((c, i) => (
          <View
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              backgroundColor: c,
              marginRight: 3,
            }}
          />
        ))}
        <Text className="text-[10px] text-ink-mute ml-1">More on-path</Text>
      </View>
    </View>
  );
}
