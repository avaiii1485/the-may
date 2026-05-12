import { Text, View } from 'react-native';
import { dayLabel } from '@/lib/dayGroup';

interface Props {
  date: Date;
  today: Date;
}

export function EmptyDayPlaceholder({ date, today }: Props): JSX.Element {
  return (
    <View className="py-6 items-center px-8">
      <Text className="text-ink-mute text-sm italic">
        No entry for {dayLabel(date, today)} yet
      </Text>
    </View>
  );
}
