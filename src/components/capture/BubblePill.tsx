import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function BubblePill({ label, active, onPress }: Props): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      className={`px-4 py-2 rounded-full mr-2 mb-2 ${
        active ? 'bg-bubble-active' : 'bg-bubble-bg'
      }`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text className={`text-sm font-medium ${active ? 'text-white' : 'text-ink'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
