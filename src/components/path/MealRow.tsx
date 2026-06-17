import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  CARD_SIZE,
  CENTER_X_PCT,
  GHOST_GRAY,
  LEFT_SPACER,
  OFF_PATH_X_PCT,
  ORANGE,
  TIME_COL_WIDTH,
} from './pathConstants';
import { useI18n } from '@/i18n';
import { formatTimeOfDay, gapBetween } from '@/lib/time';
import type { Meal } from '@/types/meal';

interface Props {
  meal: Meal;
  prevEatenAt: string | null;
  onPress?: () => void;
}

const ROW_HEIGHT = CARD_SIZE + 28;
const DOT_SIZE = 10;

export function MealRow({ meal, prevEatenAt, onPress }: Props): JSX.Element {
  const { d } = useI18n();
  const xPct = meal.onPath ? CENTER_X_PCT : OFF_PATH_X_PCT;
  const time = d(formatTimeOfDay(meal.eatenAt));
  const gap = prevEatenAt ? d(gapBetween(prevEatenAt, meal.eatenAt)) : null;
  const isTextOnly = !meal.photoUrl && !!meal.textContent;

  return (
    <View style={{ flexDirection: 'row', direction: 'ltr' }}>
      <View style={{ width: LEFT_SPACER }} />
      <View style={{ flex: 1, position: 'relative', height: ROW_HEIGHT }}>
        {/* Gray ghost line — always centered, drawn behind everything */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: `${CENTER_X_PCT}%`,
            top: 0,
            bottom: 0,
            width: 1.5,
            marginLeft: -0.75,
            backgroundColor: GHOST_GRAY,
            borderRadius: 1,
          }}
        />

        {/* Meal card */}
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`Meal at ${time}`}
          style={{
            position: 'absolute',
            top: 14,
            left: `${xPct}%`,
            width: CARD_SIZE,
            height: CARD_SIZE,
            marginLeft: -CARD_SIZE / 2,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            shadowColor: '#0F172A',
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 3,
          }}
        >
          {meal.photoUrl ? (
            <Image
              source={{ uri: meal.photoUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              cachePolicy="memory-disk"
              recyclingKey={meal.id}
              transition={120}
            />
          ) : isTextOnly ? (
            <View className="w-full h-full items-center justify-center px-2">
              <Text className="text-ink text-center text-[13px] font-semibold" numberOfLines={4}>
                {meal.textContent}
              </Text>
            </View>
          ) : (
            <View className="w-full h-full items-center justify-center bg-path-soft">
              <Text className="text-2xl">🍽️</Text>
            </View>
          )}
        </Pressable>

        {/* Orange anchor dot at top of card */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 14 - DOT_SIZE / 2,
            left: `${xPct}%`,
            width: DOT_SIZE,
            height: DOT_SIZE,
            marginLeft: -DOT_SIZE / 2,
          }}
        >
          <Svg width={DOT_SIZE} height={DOT_SIZE}>
            <Circle cx={DOT_SIZE / 2} cy={DOT_SIZE / 2} r={DOT_SIZE / 2 - 0.5} fill={ORANGE} />
          </Svg>
        </View>
        {/* Orange anchor dot at bottom of card */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 14 + CARD_SIZE - DOT_SIZE / 2,
            left: `${xPct}%`,
            width: DOT_SIZE,
            height: DOT_SIZE,
            marginLeft: -DOT_SIZE / 2,
          }}
        >
          <Svg width={DOT_SIZE} height={DOT_SIZE}>
            <Circle cx={DOT_SIZE / 2} cy={DOT_SIZE / 2} r={DOT_SIZE / 2 - 0.5} fill={ORANGE} />
          </Svg>
        </View>
      </View>
      <View style={{ width: TIME_COL_WIDTH, justifyContent: 'center', paddingLeft: 8 }}>
        {gap ? <Text className="text-xs text-ink-mute">{gap}</Text> : null}
        <Text className="text-base font-bold text-ink">{time}</Text>
      </View>
    </View>
  );
}
