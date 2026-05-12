import { Image, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { formatTimeOfDay } from '@/lib/time';
import type { Meal } from '@/types/meal';

interface Props {
  meal: Meal;
  style?: StyleProp<ViewStyle>;
}

export function CollageTile({ meal, style }: Props): JSX.Element {
  const time = formatTimeOfDay(meal.eatenAt);
  return (
    <View
      style={[
        { position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF' },
        style,
      ]}
    >
      {meal.photoUrl ? (
        <Image
          source={{ uri: meal.photoUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : meal.textContent ? (
        <View
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 12,
          }}
        >
          <Text className="text-ink text-center font-semibold" numberOfLines={5}>
            {meal.textContent}
          </Text>
        </View>
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FCEBD3',
          }}
        >
          <Text style={{ fontSize: 32 }}>🍽️</Text>
        </View>
      )}
      <Text
        style={{
          position: 'absolute',
          top: 8,
          right: 10,
          color: '#FFFFFF',
          fontWeight: '700',
          fontSize: 13,
          textShadowColor: 'rgba(0,0,0,0.5)',
          textShadowRadius: 3,
          textShadowOffset: { width: 0, height: 1 },
        }}
      >
        {time}
      </Text>
    </View>
  );
}
