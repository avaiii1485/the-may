import { router, useLocalSearchParams } from 'expo-router';
import { Share2, X } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayCollage } from '@/components/recap/DayCollage';
import { useMeals } from '@/hooks/useMeals';
import {
  computeFasting,
  dayHeaderParts,
  formatFrequency,
  pctOnPath,
} from '@/lib/dayGroup';
import { isSameLocalDay, startOfDay } from '@/lib/time';

function parseDateParam(raw: string | string[] | undefined): Date | null {
  const value = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
  if (!value) return null;
  // Expect YYYY-MM-DD; construct in local time to avoid TZ drift.
  const parts = value.split('-').map((p) => Number(p));
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return null;
  const [y, m, d] = parts as [number, number, number];
  return new Date(y, m - 1, d);
}

export default function DayRecapScreen(): JSX.Element {
  const params = useLocalSearchParams<{ date: string }>();
  const { data: meals } = useMeals();
  const date = parseDateParam(params.date);

  const dayMeals = useMemo(() => {
    if (!date) return [];
    const ref = startOfDay(date);
    return meals
      .filter((m) => isSameLocalDay(m.eatenAt, ref))
      .sort((a, b) => new Date(a.eatenAt).getTime() - new Date(b.eatenAt).getTime());
  }, [meals, date]);

  if (!date) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="items-center justify-center flex-1">
          <Text className="text-ink-soft">Bad date.</Text>
          <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2">
            <Text className="text-bubble-active font-bold">Close</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { dayMonth, weekday, full } = dayHeaderParts(date);
  const pct = pctOnPath(dayMeals);
  const freq = formatFrequency(dayMeals) ?? '—';
  const fasting = computeFasting(dayMeals, meals) ?? '—';

  const onShare = useCallback(async () => {
    const lines = [
      `My day on The May — ${full}`,
      `${pct}% on-path · ${dayMeals.length} ${dayMeals.length === 1 ? 'meal' : 'meals'}`,
    ];
    if (fasting !== '—') lines.push(`Fasting: ${fasting}`);
    if (freq !== '—') lines.push(`Frequency: ${freq}`);
    const message = lines.join('\n');
    const title = `The May · ${full}`;

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
            window.alert('Day recap copied to clipboard.');
          }
          return;
        }
        if (typeof window !== 'undefined') {
          window.alert(message);
        }
        return;
      }
      // Native (iOS / Android): bring up the OS share sheet.
      await Share.share({ title, message });
    } catch (e) {
      // The user dismissed the share sheet, or the platform refused. Don't crash.
      if (e instanceof Error && e.name !== 'AbortError') {
        Alert.alert('Could not share', e.message);
      }
    }
  }, [full, pct, dayMeals.length, fasting, freq]);

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
        {/* Date header */}
        <View className="items-center pt-2 pb-3">
          <Text className="text-ink-mute text-base">{dayMonth}</Text>
          <Text className="text-ink text-4xl font-extrabold mt-1">{weekday}</Text>
          {/* Orange dot + line dropping into the card */}
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

        {/* Recap card */}
        <View className="mx-4 rounded-2xl overflow-hidden bg-white border border-slate-200">
          <View className="items-center py-4 px-4">
            <Text className="text-ink text-base font-bold">{full}</Text>
            <Text className="text-ink-mute text-xs mt-1">Tracked with The May</Text>
          </View>

          <DayCollage meals={dayMeals} />

          {/* Stats row */}
          <View className="flex-row justify-around py-5 bg-white">
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{fasting}</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">FASTING</Text>
            </View>
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{pct}%</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">ON-PATH</Text>
            </View>
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{freq}</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">
                FREQUENCY
              </Text>
            </View>
          </View>
        </View>

        {/* Share button */}
        <View className="px-4 mt-6">
          <Pressable
            onPress={onShare}
            className="flex-row items-center justify-center bg-bubble-active rounded-full py-4"
            accessibilityRole="button"
            accessibilityLabel="Share your day"
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text className="text-white font-bold tracking-widest ml-2">SHARE YOUR DAY NOW</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
