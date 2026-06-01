import { router } from 'expo-router';
import { Share2, X } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { DayCollage } from '@/components/recap/DayCollage';
import { toJalali } from '@/lib/jalali';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { detectInsights } from '@/lib/patternDetector';
import { addDays, startOfDay } from '@/lib/time';

const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

export default function WeekRecapScreen(): JSX.Element {
  const { t, d: dg, lang } = useI18n();
  const { data: meals } = useMeals();
  const today = startOfDay(new Date());
  const start = addDays(today, -6);

  const fmtDate = (dt: Date): string => {
    if (lang === 'fa') {
      const j = toJalali(dt);
      return `${j.jd} ${j.monthName}`;
    }
    return `${MONTHS_EN[dt.getMonth()] ?? ''} ${dt.getDate()}`;
  };

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
    const ins = detectInsights(weekMeals, lang);
    return ins[0]?.text ?? null;
  }, [weekMeals, lang]);

  const onShare = useCallback(async () => {
    const lines = [
      `${t('recap.trackedWith')} — ${fmtDate(start)} – ${fmtDate(today)}`,
      `${dg(pct)}% ${t('path.onPath')} · ${dg(total)} ${
        total === 1 ? t('path.meal') : t('path.meals')
      }`,
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
            window.alert(message);
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
  }, [start, today, pct, total, topInsight, t, dg, fmtDate]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(15,23,42,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        accessibilityLabel={t('common.close')}
      />
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '88%',
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        <View className="flex-row items-center justify-between px-4 py-2">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
            accessibilityLabel={t('common.close')}
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
          <Text className="text-ink text-4xl font-extrabold mt-1">{t('recap.weekTitle')}</Text>
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
            <Text className="text-ink text-base font-bold">{t('recap.weekly')}</Text>
            <Text className="text-ink-mute text-xs mt-1">{t('recap.trackedWith')}</Text>
          </View>

          <DayCollage meals={weekMeals} />

          <View className="flex-row justify-around py-5 bg-white">
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{dg(total)}</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">
                {t('recap.meals')}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{dg(pct)}%</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">
                {t('recap.onPath')}
              </Text>
            </View>
            <View className="items-center">
              <Text className="text-ink text-xl font-extrabold">{dg(uniqueDays)}</Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1">
                {t('recap.daysLogged')}
              </Text>
            </View>
          </View>

          {topInsight ? (
            <View className="px-4 pb-4">
              <Text className="text-[10px] uppercase tracking-widest text-ink-mute mb-1">
                {t('recap.topInsight')}
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
            accessibilityLabel={t('recap.shareWeek')}
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text className="text-white font-bold tracking-widest ml-2">
              {t('recap.shareWeek')}
            </Text>
          </Pressable>
        </View>
        </ScrollView>
      </View>
    </View>
  );
}
