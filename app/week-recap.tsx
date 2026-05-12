import { router } from 'expo-router';
import { Share2, X } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayCollage } from '@/components/recap/DayCollage';
import { useMeals } from '@/hooks/useMeals';
import { detectInsights } from '@/lib/patternDetector';
import { addDays, startOfDay } from '@/lib/time';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()] ?? ''} ${d.getDate()}`;
}

export default function WeekRecapScreen(): JSX.Element {
  const { data: meals } = useMeals();
  const today = startOfDay(new Date());
  const start = addDays(today, -6);

  const weekMeals = useMemo(() => {
    const startMs = start.getTime();
    const endMs = today.getTime() + 24 * 60 * 60 * 1000;
    return meals
      .filter((m) => {
        const t = new Date(m.eatenAt).getTime();
        return t >= startMs && t < endMs;
      })
      .sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime());
  }, [meals, start, today]);

  const total = weekMeals.length;
  const onPath = weekMeals.filter((m) => m.onPath).length;
  const pct = total === 0 ? 0 : Math.round((onPath / total) * 100);
  const uniqueDays = new Set(
    weekMeals.map((m) => {
      const d = new Date(m.eatenAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  ).size;

  const topInsight = useMemo(() => {
    const ins = detectInsights(weekMeals);
    return ins[0]?.text ?? null;
  }, [weekMeals]);

  const onShare = useCallback(async () => {
    const lines = [
      `My week on The May — ${fmtDate(start)} – ${fmtDate(today)}`,
      `${pct}% on-path · ${total} ${total === 1 ? 'meal' : 'meals'}`,
    ];
    if (topInsight) lines.push(topInsight);
    const message = lines.join('\n');
    const title = `The May · ${fmtDate(start)}–${fmtDate(today)}`;
    try {
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? navigator : undefined;
        const shareData = { title, text: message } as ShareData;
        if (nav?.share && (!nav.canShare || nav.canShare(shareData))) {
          await nav.share(shareData);
          return;
        }
        if (nav?.clipboard?.writeText) {
          await nav.clipboard.writeText(message);
          if (typeof window !== 'undefined') {
            window.alert('Week recap copied to clipboard.');
          }
          return;
        }
        if (typeof window !== 'undefined') window.alert(message);
        return;
      }
      await Share.share({ title, message });
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        Alert.alert('Could not share', e.message);
      }
    }
  }, [start, today, pct, total, topInsight]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Close"
        >
          <X size={24} color="#0F172A" />
        </Pressable>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="items-center pt-2 pb-3">
          <Text className="text-ink-mute text-base">
            {fmtDate(start)} – {fmtDate(today)}
          </Text>
          <Text className="text-ink text-4xl font-extrabold mt-1">Past 7 days</Text>
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                borderWidth: 2,
                borderColor: '#F39C3D',
                backgroundColor: '#FFFFFF',
              }}
            />
            <View style={{ width: 2, height: 22, backgroundColor: '#F39C3D' }} />
          </View>
        </View>

        <View className="mx-4 rounded-2xl overflow-hidden bg-white border border-slate-200">
          <View className="items-center py-4 px-4">
            <Text className="text-ink text-base font-bold">Weekly recap</Text>
            <Text className="text-ink-mute text-xs mt-1">Tracked with The May</Text>
          </View>

          <DayCollage meals={weekMeals} />

          <View className="flex-row justify-around py-5 bg-white">
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{total}</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">MEALS</Text>
            </View>
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{pct}%</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">ON-PATH</Text>
            </View>
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{uniqueDays}</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">
                DAYS LOGGED
              </Text>
            </View>
          </View>

          {topInsight ? (
            <View className="px-4 pb-4">
              <Text className="text-[10px] uppercase tracking-widest text-ink-mute mb-1">
                Top insight
              </Text>
              <Text className="text-ink text-sm font-semibold">{topInsight}</Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 mt-6">
          <Pressable
            onPress={onShare}
            className="flex-row items-center justify-center bg-bubble-active rounded-full py-4"
            accessibilityRole="button"
            accessibilityLabel="Share your week"
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text className="text-white font-bold tracking-widest ml-2">SHARE YOUR WEEK</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
