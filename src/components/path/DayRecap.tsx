import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

interface Props {
  label: string;
  pct: number;
  mealCount: number;
  frequency: string | null;
  date: Date;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function DayRecap({ label, pct, mealCount, frequency, date }: Props): JSX.Element {
  const onTap = () => {
    router.push(`/day-recap/${toIsoDate(date)}`);
  };
  return (
    <View className="bg-bg-card items-center py-5 px-6">
      <Text className="text-ink text-lg font-bold mb-1">{label}</Text>
      <Text className="text-ink-soft text-sm text-center">
        {pct}% On-path · {mealCount} {mealCount === 1 ? 'meal' : 'meals'}
        {frequency ? ` · Frequency: ${frequency}` : ''}
      </Text>
      <Pressable
        onPress={onTap}
        className="mt-3 px-6 py-2 rounded-full border border-ink-mute"
        accessibilityRole="button"
        accessibilityLabel="Open day recap"
      >
        <Text className="text-ink-soft tracking-widest text-xs font-bold">DAY RECAP</Text>
      </Pressable>
    </View>
  );
}
