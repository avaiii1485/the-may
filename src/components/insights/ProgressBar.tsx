import { Text, View } from 'react-native';
import { useI18n } from '@/i18n';

interface Props {
  pct: number;
  color?: string;
}

export function ProgressBar({ pct, color = '#F39C3D' }: Props): JSX.Element {
  const { d } = useI18n();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View>
      <View className="h-3 rounded-full bg-slate-200 overflow-hidden">
        <View style={{ width: `${clamped}%`, backgroundColor: color }} className="h-full" />
      </View>
      <View className="flex-row justify-end mt-1">
        <Text className="text-xs text-ink-mute mr-8">{d(70)}</Text>
        <Text className="text-xs text-ink-mute">{d(90)}</Text>
      </View>
    </View>
  );
}
