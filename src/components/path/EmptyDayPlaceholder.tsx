import { Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { dayLabel } from '@/lib/dayGroup';

interface Props {
  date: Date;
  today: Date;
}

export function EmptyDayPlaceholder({ date, today }: Props): JSX.Element {
  const { t, lang } = useI18n();
  return (
    <View className="py-6 items-center px-8">
      <Text className="text-ink-mute text-sm italic">
        {t('path.noEntry', { day: dayLabel(date, today, lang) })}
      </Text>
    </View>
  );
}
