import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { FEELING_EMOJI, type FeelingLevel } from '@/types/meal';

interface Props {
  selected: FeelingLevel | null;
  onSelect: (f: FeelingLevel) => void;
}

export function FeelingRow({ selected, onSelect }: Props): JSX.Element {
  const { t } = useI18n();
  return (
    <View className="bg-bg-card rounded-2xl p-4 mb-3">
      <Text className="text-base font-semibold text-ink mb-3">{t('q.feeling')}</Text>
      <View className="flex-row justify-around">
        {FEELING_EMOJI.map((emoji, idx) => {
          const level = idx as FeelingLevel;
          const isActive = selected === level;
          return (
            <Pressable
              key={emoji}
              onPress={() => onSelect(level)}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isActive ? 'bg-bubble-active' : 'bg-bubble-bg'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text className="text-2xl">{emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
