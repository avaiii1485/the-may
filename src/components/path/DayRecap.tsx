import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';

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
  const { t, d } = useI18n();
  const onTap = () => {
    router.push(`/day-recap/${toIsoDate(date)}`);
  };
  const mealsWord = mealCount === 1 ? t('path.meal') : t('path.meals');
  return (
    <View className="bg-bg-card items-center py-5 px-6">
      <Text className="text-ink text-lg font-bold mb-1">{label}</Text>
      <Text className="text-ink-soft text-sm text-center">
        {d(pct)}% {t('path.onPath')} · {d(mealCount)} {mealsWord}
        {frequency ? ` · ${t('path.frequency')}: ${frequency}` : ''}
      </Text>
      <Pressable
        onPress={onTap}
        className="mt-3 px-6 py-2 rounded-full border border-ink-mute"
        accessibilityRole="button"
        accessibilityLabel={t('path.dayRecap')}
      >
        <Text className="text-ink-soft tracking-widest text-xs font-bold">
          {t('path.dayRecap')}
        </Text>
      </Pressable>
    </View>
  );
}
