import { Text, View } from 'react-native';

interface Props {
  emoji: string;
  color: string;
  earned: boolean;
  size?: number;
}

function hexWithAlpha(hex: string, alphaHex: string): string {
  // Expect hex like '#RRGGBB'. Return '#RRGGBBAA'.
  if (hex.length === 7) return `${hex}${alphaHex}`;
  return hex;
}

export function BadgeIcon({ emoji, color, earned, size = 56 }: Props): JSX.Element {
  const radius = size / 2;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: earned ? hexWithAlpha(color, '22') : '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: earned ? color : '#E5E7EB',
      }}
    >
      <Text
        style={{
          fontSize: size * 0.45,
          opacity: earned ? 1 : 0.4,
        }}
      >
        {emoji}
      </Text>
    </View>
  );
}
