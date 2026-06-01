import { ChevronRight } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { detectInsights } from '@/lib/patternDetector';
import type { Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
}

const VISIBLE_COUNT = 5;

export function PatternCard({ meals }: Props): JSX.Element {
  const { t, lang, isRTL } = useI18n();
  const insights = useMemo(
    () => detectInsights(meals, lang).slice(0, VISIBLE_COUNT),
    [meals, lang],
  );
  const [idx, setIdx] = useState(0);

  if (insights.length === 0) {
    return <Text className="text-ink-soft text-sm">{t('exp.empty')}</Text>;
  }

  const current = insights[idx % insights.length]!;
  const accent = current.direction === 'on' ? '#34C9A2' : '#F39C3D';

  return (
    <View>
      <Text className="text-[10px] uppercase tracking-widest text-ink-mute mb-2">
        {current.category}
      </Text>
      <View className="flex-row items-start">
        <View
          style={{
            width: 4,
            alignSelf: 'stretch',
            backgroundColor: accent,
            borderRadius: 2,
            ...(isRTL ? { marginLeft: 12 } : { marginRight: 12 }),
            marginTop: 4,
          }}
        />
        <Text className="text-ink text-base font-semibold flex-1">{current.text}</Text>
      </View>

      {insights.length > 1 ? (
        <View className="flex-row items-center justify-between mt-3">
          <View className="flex-row">
            {insights.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginRight: 4,
                  backgroundColor: i === idx % insights.length ? '#0F172A' : '#CBD5E1',
                }}
              />
            ))}
          </View>
          <Pressable
            onPress={() => setIdx((i) => (i + 1) % insights.length)}
            className="flex-row items-center"
            accessibilityRole="button"
            accessibilityLabel={t('exp.next')}
          >
            <Text className="text-bubble-active font-semibold text-sm mr-1">{t('exp.next')}</Text>
            <ChevronRight size={16} color="#7FA37B" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
