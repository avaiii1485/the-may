import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';

interface Props {
  value: string; // ISO datetime
  onChange: (iso: string) => void;
}

// Local ISO (no timezone suffix), matching the web variant so `eatenAt`
// semantics stay identical across platforms.
function toLocalIso(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

function parseValue(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

function fmtDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function fmtTime(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

// Native (iOS/Android) date & time entry via the platform picker. Tapping a
// field opens the native spinner/calendar; the previous free-text TextInputs
// reformatted on every keystroke, which fought the user and made entry
// effectively impossible.
export function DateTimeRow({ value, onChange }: Props): JSX.Element {
  const { t } = useI18n();
  const current = parseValue(value);
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);

  const handleChange = (mode: 'date' | 'time') => (
    event: DateTimePickerEvent,
    selected?: Date,
  ) => {
    setPicker(null); // Android dialog auto-dismisses; close our state either way.
    if (event.type !== 'set' || !selected) return;
    const next = new Date(current);
    if (mode === 'date') {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      // Keep the existing seconds so same-minute ordering is preserved.
      next.setHours(selected.getHours(), selected.getMinutes());
    }
    onChange(toLocalIso(next));
  };

  return (
    <View className="flex-row" style={{ gap: 12 }}>
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
          {t('datetime.date')}
        </Text>
        <Pressable
          onPress={() => setPicker('date')}
          className="border-b border-slate-200 pb-2"
          accessibilityRole="button"
          accessibilityLabel={t('datetime.date')}
        >
          <Text className="text-ink text-base">{fmtDate(current)}</Text>
        </Pressable>
      </View>
      <View className="flex-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
          {t('datetime.time')}
        </Text>
        <Pressable
          onPress={() => setPicker('time')}
          className="border-b border-slate-200 pb-2"
          accessibilityRole="button"
          accessibilityLabel={t('datetime.time')}
        >
          <Text className="text-ink text-base">{fmtTime(current)}</Text>
        </Pressable>
      </View>

      {picker ? (
        <DateTimePicker
          value={current}
          mode={picker}
          is24Hour
          onChange={handleChange(picker)}
        />
      ) : null}
    </View>
  );
}
