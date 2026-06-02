import { createElement, type ChangeEvent } from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '@/i18n';

interface Props {
  value: string;
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

// Preserve the existing seconds so same-minute entries keep a distinct order
// (the <input type=time> only edits HH:MM).
function partsToIso(date: string, time: string, seconds: number): string {
  const ss = String(seconds).padStart(2, '0');
  return `${date}T${time}:${ss}`;
}

const inputStyle = {
  fontSize: 16,
  padding: 8,
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
} as const;

export function DateTimeRow({ value, onChange }: Props): JSX.Element {
  const { t } = useI18n();
  const { date, time } = isoToParts(value);
  const parsed = new Date(value);
  const seconds = isNaN(parsed.getTime()) ? 0 : parsed.getSeconds();
  const dateInput = createElement('input', {
    type: 'date',
    value: date,
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(partsToIso(e.target.value, time, seconds)),
    style: inputStyle,
  });
  const timeInput = createElement('input', {
    type: 'time',
    value: time,
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(partsToIso(date, e.target.value, seconds)),
    style: inputStyle,
  });
  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">{t('datetime.date')}</Text>
        {dateInput}
      </View>
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">{t('datetime.time')}</Text>
        {timeInput}
      </View>
    </View>
  );
}
