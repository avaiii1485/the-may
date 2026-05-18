import { TextInput, View, Text } from 'react-native';
import { useI18n } from '@/i18n';

interface Props {
  value: string; // ISO datetime
  onChange: (iso: string) => void;
}

function isoToParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

function partsToIso(date: string, time: string): string {
  return `${date}T${time}:00`;
}

export function DateTimeRow({ value, onChange }: Props): JSX.Element {
  const { t } = useI18n();
  const { date, time } = isoToParts(value);
  return (
    <View className="flex-row gap-3">
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">{t('datetime.date')}</Text>
        <TextInput
          value={date}
          onChangeText={(d) => onChange(partsToIso(d, time))}
          placeholder="YYYY-MM-DD"
          className="border-b border-slate-200 pb-2 text-ink"
        />
      </View>
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">{t('datetime.time')}</Text>
        <TextInput
          value={time}
          onChangeText={(tm) => onChange(partsToIso(date, tm))}
          placeholder="HH:MM"
          className="border-b border-slate-200 pb-2 text-ink"
        />
      </View>
    </View>
  );
}
