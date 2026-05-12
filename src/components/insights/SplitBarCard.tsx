import { Text, View } from 'react-native';
import type { Meal } from '@/types/meal';

export interface BarItem {
  label: string;
  onPath: number;
  offPath: number;
}

interface Props {
  title: string;
  emptyHint: string;
  extract: (meal: Meal) => string[];
  meals: Meal[];
}

const ON_COLOR = '#34C9A2';
const OFF_COLOR = '#F25C8B';

function aggregate(meals: Meal[], extract: (m: Meal) => string[]): BarItem[] {
  const map = new Map<string, { onPath: number; offPath: number }>();
  for (const m of meals) {
    for (const v of extract(m)) {
      const cur = map.get(v) ?? { onPath: 0, offPath: 0 };
      if (m.onPath) cur.onPath += 1;
      else cur.offPath += 1;
      map.set(v, cur);
    }
  }
  return Array.from(map.entries())
    .map(([label, x]) => ({ label, ...x }))
    .sort((a, b) => b.onPath + b.offPath - (a.onPath + a.offPath));
}

export function SplitBarCard({ title: _title, emptyHint, extract, meals }: Props): JSX.Element {
  const data = aggregate(meals, extract);
  const maxTotal = data.reduce((m, d) => Math.max(m, d.onPath + d.offPath), 0);

  return (
    <View>
      <View className="flex-row items-center justify-end mb-3">
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: ON_COLOR, marginRight: 4 }}
        />
        <Text className="text-[10px] text-ink-mute mr-3">On-path</Text>
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: OFF_COLOR, marginRight: 4 }}
        />
        <Text className="text-[10px] text-ink-mute">Off-path</Text>
      </View>

      {data.length === 0 ? (
        <Text className="text-ink-soft text-sm">{emptyHint}</Text>
      ) : (
        data.map((d) => {
          const total = d.onPath + d.offPath;
          const widthPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
          const onShare = total > 0 ? Math.round((d.onPath / total) * 100) : 0;
          return (
            <View key={d.label} className="mb-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-ink text-sm font-semibold">{d.label}</Text>
                <Text className="text-ink-soft text-xs">
                  {total} {total === 1 ? 'meal' : 'meals'} · {onShare}% on
                </Text>
              </View>
              <View
                style={{
                  width: `${widthPct}%`,
                  minWidth: 6,
                  height: 10,
                  borderRadius: 5,
                  overflow: 'hidden',
                  flexDirection: 'row',
                  backgroundColor: '#E5E7EB',
                }}
              >
                {d.onPath > 0 ? (
                  <View style={{ flex: d.onPath, backgroundColor: ON_COLOR, height: 10 }} />
                ) : null}
                {d.offPath > 0 ? (
                  <View style={{ flex: d.offPath, backgroundColor: OFF_COLOR, height: 10 }} />
                ) : null}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
