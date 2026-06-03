import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { type GestureResponderEvent, Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { addDays, startOfDay } from '@/lib/time';

interface Props {
  value: string; // ISO datetime
  onChange: (iso: string) => void;
}

const DAYS_BACK = 60; // how far back the date slider reaches
const MS_DAY = 24 * 60 * 60 * 1000;
const ACCENT = '#7FA37B';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function parseValue(iso: string): Date {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
}

// Local ISO with seconds (keeps same-minute ordering precise); UI shows HH:MM.
function toIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function fmtDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Pure-JS slider (responder events) so it works on web and native without a
// native module — keeps the whole component OTA-updatable.
function Slider({ ratio, onRatio }: { ratio: number; onRatio: (r: number) => void }): JSX.Element {
  const [w, setW] = useState(0);
  const handle = (e: GestureResponderEvent) => {
    if (w > 0) onRatio(clamp(e.nativeEvent.locationX / w, 0, 1));
  };
  const r = clamp(ratio, 0, 1);
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handle}
      onResponderMove={handle}
      style={{ height: 34, justifyContent: 'center' }}
    >
      <View style={{ height: 5, borderRadius: 3, backgroundColor: '#E2E8F0' }}>
        <View
          style={{ position: 'absolute', height: 5, borderRadius: 3, backgroundColor: ACCENT, width: `${r * 100}%` }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: Math.max(0, r * w - 11),
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: ACCENT,
          borderWidth: 2,
          borderColor: '#FFFFFF',
        }}
      />
    </View>
  );
}

function Stepper({ onPress, dir }: { onPress: () => void; dir: 'left' | 'right' }): JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      className="w-8 h-8 items-center justify-center rounded-full bg-bg-card"
      accessibilityRole="button"
    >
      {dir === 'left' ? (
        <ChevronLeft size={18} color="#475569" />
      ) : (
        <ChevronRight size={18} color="#475569" />
      )}
    </Pressable>
  );
}

// Date + 24h time entry via sliders (default = device now, changeable). Shared
// by every meal date/time entry point (capture, text meal, edit).
export function DateTimeRow({ value, onChange }: Props): JSX.Element {
  const { t } = useI18n();
  const d = parseValue(value);
  const today = startOfDay(new Date());

  // ── Date ──────────────────────────────────────────────
  const daysAgo = Math.round((today.getTime() - startOfDay(d).getTime()) / MS_DAY);
  const dateRatio = clamp((DAYS_BACK - daysAgo) / DAYS_BACK, 0, 1);
  const setDay = (dayStart: Date) => {
    if (dayStart.getTime() > today.getTime()) return; // no future days
    const nd = new Date(d);
    nd.setFullYear(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate());
    onChange(toIso(nd));
  };
  const onDateRatio = (r: number) => {
    const idx = Math.round(r * DAYS_BACK); // 0..DAYS_BACK (DAYS_BACK = today)
    setDay(addDays(today, -(DAYS_BACK - idx)));
  };
  const stepDay = (delta: number) => setDay(addDays(startOfDay(d), delta));

  // ── Time ──────────────────────────────────────────────
  const minutes = d.getHours() * 60 + d.getMinutes();
  const timeRatio = minutes / 1439;
  const setMinutes = (mins: number) => {
    const m = clamp(mins, 0, 1439);
    const nd = new Date(d);
    nd.setHours(Math.floor(m / 60), m % 60); // keep seconds for ordering
    onChange(toIso(nd));
  };
  const onTimeRatio = (r: number) => setMinutes(Math.round(r * 1439));
  const stepMin = (delta: number) => setMinutes(minutes + delta);

  return (
    <View>
      {/* Date */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-xs uppercase tracking-widest text-ink-mute">{t('datetime.date')}</Text>
        <Text className="text-ink font-bold">{fmtDate(d)}</Text>
      </View>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Stepper dir="left" onPress={() => stepDay(-1)} />
        <View className="flex-1">
          <Slider ratio={dateRatio} onRatio={onDateRatio} />
        </View>
        <Stepper dir="right" onPress={() => stepDay(1)} />
      </View>

      {/* Time */}
      <View className="flex-row items-center justify-between mb-1 mt-3">
        <Text className="text-xs uppercase tracking-widest text-ink-mute">{t('datetime.time')}</Text>
        <Text className="text-ink font-bold">{fmtTime(d)}</Text>
      </View>
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Stepper dir="left" onPress={() => stepMin(-5)} />
        <View className="flex-1">
          <Slider ratio={timeRatio} onRatio={onTimeRatio} />
        </View>
        <Stepper dir="right" onPress={() => stepMin(5)} />
      </View>
    </View>
  );
}
