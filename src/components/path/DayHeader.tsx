import { Text, View } from 'react-native';

interface Props {
  label: string;
}

export function DayHeader({ label }: Props): JSX.Element {
  return (
    <View className="bg-bg-card py-4 items-center">
      <Text className="text-ink text-base font-bold">{label}</Text>
    </View>
  );
}
