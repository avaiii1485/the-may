import { Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { addDays, startOfDay } from '@/lib/time';
import { ITEM_H, VISIBLE, Wheel } from './Wheel';

interface Props {
  value: string; // ISO datetime
  onChange: (iso: string) => void;
}

const DAYS_BACK = 60;
const MS_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// Falls back to the device's current time when the value is unreadable.
function parseValue(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Date + time entry as iOS-style wheel pickers. Displays/edits in the device's
// local time (synced to the system clock) and stores a UTC ISO instant
// (toISOString) so the cloud round-trip is timezone-safe.
export function DateTimeRow({ value, onChange }: Props): JSX.Element {
  const { t } = useI18n();
  const d = parseValue(value);
  const today = startOfDay(new Date());

  // Date wheel: oldest (DAYS_BACK ago) → today.
  const dayLabels = Array.from({ length: DAYS_BACK + 1 }, (_, i) => {
    const dt = addDays(today, -(DAYS_BACK - i));
    return `${WEEKDAYS[dt.getDay()]} ${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
  });
  const daysAgo = clamp(Math.round((today.getTime() - startOfDay(d).getTime()) / MS_DAY), 0, DAYS_BACK);
  const dateIndex = DAYS_BACK - daysAgo;

  const setDateIndex = (i: number) => {
    const dt = addDays(today, -(DAYS_BACK - i));
    const nd = new Date(d);
    nd.setFullYear(dt.getFullYear(), dt.getMonth(), dt.getDate());
    onChange(nd.toISOString());
  };
  const setHour = (h: number) => {
    const nd = new Date(d);
    nd.setHours(clamp(h, 0, 23));
    onChange(nd.toISOString());
  };
  const setMinute = (m: number) => {
    const nd = new Date(d);
    nd.setMinutes(clamp(m, 0, 59));
    onChange(nd.toISOString());
  };

  const height = VISIBLE * ITEM_H;
  const bandTop = ITEM_H * Math.floor(VISIBLE / 2);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-[10px] uppercase tracking-widest text-ink-mute">{t('datetime.date')}</Text>
        <Text className="text-[10px] uppercase tracking-widest text-ink-mute">{t('datetime.time')}</Text>
      </View>

      <View style={{ height }}>
        {/* Center selection band */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: bandTop,
            height: ITEM_H,
            backgroundColor: 'rgba(127,163,123,0.12)',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: 'rgba(127,163,123,0.45)',
            borderRadius: 6,
          }}
        />
        <View className="flex-row items-center justify-center">
          <Wheel data={dayLabels} index={dateIndex} onIndexChange={setDateIndex} width={118} />
          <View style={{ width: 10 }} />
          <Wheel data={HOURS} index={d.getHours()} onIndexChange={setHour} loop width={42} />
          <Text className="text-ink text-base font-bold mx-0.5">:</Text>
          <Wheel data={MINUTES} index={d.getMinutes()} onIndexChange={setMinute} loop width={42} />
        </View>
      </View>
    </View>
  );
}
