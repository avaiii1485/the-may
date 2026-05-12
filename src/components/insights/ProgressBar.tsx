import { Text, View } from 'react-native';

interface Props {
  pct: number;
  color?: string;
}

export function ProgressBar({ pct, color = '#F39C3D' }: Props): JSX.Element {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View>
      <View className="h-3 rounded-full bg-slate-200 overflow-hidden">
        <View style={{ width: `${clamped}%`, backgroundColor: color }} className="h-full" />
      </View>
      <View className="flex-row justify-end mt-1">
        <Text className="text-xs text-ink-mute mr-8">70</Text>
        <Text className="text-xs text-ink-mute">90</Text>
      </View>
    </View>
  );
}
