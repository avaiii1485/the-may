import { Image, Pressable, Text, View } from 'react-native';
import { formatTimeOfDay, gapBetween } from '@/lib/time';
import { useThemeStore } from '@/stores/themeStore';
import type { Meal } from '@/types/meal';

interface Props {
  meal: Meal;
  prevEatenAt: string | null;
  onPress?: () => void;
}

const NODE_SIZE = 96;

export function MealNode({ meal, prevEatenAt, onPress }: Props): JSX.Element {
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const offsetClass = meal.onPath ? 'self-center' : 'self-start ml-6';
  const time = formatTimeOfDay(meal.eatenAt);
  const gap = prevEatenAt ? gapBetween(prevEatenAt, meal.eatenAt) : null;
  const isTextOnly = !meal.photoUrl && !!meal.textContent;

  return (
    <View className="flex-row items-center w-full px-6">
      <View className="flex-1">
        <Pressable
          onPress={onPress}
          className={`${offsetClass} rounded-2xl overflow-hidden`}
          style={{
            width: NODE_SIZE,
            height: NODE_SIZE,
            backgroundColor: dark ? '#241B12' : isTextOnly ? '#FFFFFF' : '#F8FAFC',
            shadowColor: '#0F172A',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          }}
        >
          {meal.photoUrl ? (
            <Image
              source={{ uri: meal.photoUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : isTextOnly ? (
            <View className="w-full h-full items-center justify-center px-2">
              <Text
                className="text-ink text-center text-[13px] font-semibold"
                numberOfLines={4}
              >
                {meal.textContent}
              </Text>
            </View>
          ) : (
            <View className="w-full h-full items-center justify-center bg-path-soft">
              <Text className="text-2xl">🍽️</Text>
            </View>
          )}
        </Pressable>
      </View>
      <View className="w-20 items-end">
        {gap ? <Text className="text-xs text-ink-mute mb-1">{gap}</Text> : null}
        <Text className="text-base font-bold text-ink">{time}</Text>
      </View>
    </View>
  );
}
