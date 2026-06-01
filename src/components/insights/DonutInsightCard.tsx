import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { DonutChart, type DonutSlice } from './DonutChart';

interface Props {
  slices: DonutSlice[];
  /** Renders a slice's display label (e.g. translate, or emoji as-is). */
  labelFor?: (slice: DonutSlice) => string;
}

// A donut + legend where tapping a legend item or a slice updates the center
// percentage, label, and color to the selected slice.
export function DonutInsightCard({ slices, labelFor }: Props): JSX.Element {
  const [selected, setSelected] = useState(0);
  const label = (s: DonutSlice): string => (labelFor ? labelFor(s) : s.label);

  const total = slices.reduce((sum, x) => sum + x.value, 0) || 1;
  const sel = Math.min(selected, slices.length - 1);
  const active = slices[sel] ?? slices[0];
  const pct = active ? Math.round((active.value / total) * 100) : 0;

  return (
    <View className="flex-row items-center">
      <View className="flex-1">
        {slices.map((s, i) => {
          const isActive = i === sel;
          return (
            <Pressable
              key={s.label}
              onPress={() => setSelected(i)}
              className="flex-row items-center mb-2"
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={label(s)}
            >
              <View style={{ backgroundColor: s.color, width: 10, height: 10, borderRadius: 5 }} />
              <Text
                className={`ml-2 ${isActive ? 'font-bold' : ''}`}
                style={{ color: isActive ? s.color : '#0F172A' }}
              >
                {label(s)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <DonutChart
        slices={slices}
        onSlicePress={setSelected}
        centerTopLabel={active ? `${pct}%` : undefined}
        centerBottomLabel={active ? label(active) : undefined}
        centerColor={active?.color}
      />
    </View>
  );
}
