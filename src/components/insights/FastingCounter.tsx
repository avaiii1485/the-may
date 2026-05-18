import { Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import type { Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
}

export function FastingCounter({ meals }: Props): JSX.Element {
  const { t, lang, d: dg } = useI18n();
  const [now, setNow] = useState(Date.now());

  const formatDur = (ms: number): string => {
    const totalMin = Math.max(0, Math.floor(ms / 60000));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (lang === 'fa') {
      return h === 0 ? `${dg(m)} دقیقه` : `${dg(h)} ساعت ${dg(m)} دقیقه`;
    }
    return h === 0 ? `${m}m` : `${h}h ${m}m`;
  };

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const last = meals.reduce<Meal | null>((acc, m) => {
    if (!acc) return m;
    return new Date(m.eatenAt).getTime() > new Date(acc.eatenAt).getTime() ? m : acc;
  }, null);

  if (!last) {
    return <Text className="text-ink-soft text-sm">{t('fasting.none')}</Text>;
  }
  const sinceMs = Math.max(0, now - new Date(last.eatenAt).getTime());

  return (
    <View className="flex-row items-center">
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: '#F39C3D',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Clock size={18} color="#FFFFFF" />
      </View>
      <Text className="text-ink text-2xl font-extrabold">{formatDur(sinceMs)}</Text>
    </View>
  );
}
