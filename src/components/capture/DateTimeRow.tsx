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

function parseValue(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Local ISO with seconds preserved (keeps same-minute ordering precise).
function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// Date + time entry as iOS-style wheel pickers (default = device now). Date is a
// bounded wheel of recent days; hour/minute loop (wrap-around). Shared across
// every meal date/time entry point.
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
    onChange(toIso(nd));
  };
  const setHour = (h: number) => {
    const nd = new Date(d);
    nd.setHours(clamp(h, 0, 23));
    onChange(toIso(nd));
  };
  const setMinute = (m: number) => {
    const nd = new Date(d);
    nd.setMinutes(clamp(m, 0, 59));
    onChange(toIso(nd));
  };

  const parseHour = (txt: string): number | null => {
    const n = parseInt(txt, 10);
    return isNaN(n) ? null : clamp(n, 0, 23);
  };
  const parseMinute = (txt: string): number | null => {
    const n = parseInt(txt, 10);
    return isNaN(n) ? null : clamp(n, 0, 59);
  };

  const height = VISIBLE * ITEM_H;
  const bandTop = ITEM_H * Math.floor(VISIBLE / 2);

  return (
    <View>
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute">{t('datetime.date')}</Text>
        <Text className="text-xs uppercase tracking-widest text-ink-mute">{t('datetime.time')}</Text>
      </View>

      <View style={{ height }}>
        {/* Center selection band (drawn under the wheels) */}
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
            borderRadius: 8,
          }}
        />
        <View className="flex-row items-center justify-center">
          <Wheel data={dayLabels} index={dateIndex} onIndexChange={setDateIndex} width={140} />
          <View style={{ width: 16 }} />
          <Wheel
            data={HOURS}
            index={d.getHours()}
            onIndexChange={setHour}
            loop
            width={52}
            parseInput={parseHour}
          />
          <Text className="text-ink text-xl font-bold mx-1">:</Text>
          <Wheel
            data={MINUTES}
            index={d.getMinutes()}
            onIndexChange={setMinute}
            loop
            width={52}
            parseInput={parseMinute}
          />
        </View>
      </View>
    </View>
  );
}
