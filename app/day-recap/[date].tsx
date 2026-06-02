import { router, useLocalSearchParams } from 'expo-router';
import { Share2, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DayCollage } from '@/components/recap/DayCollage';
import { ShareChoice } from '@/components/recap/ShareChoice';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { shareCardImage, shareText } from '@/lib/shareRecap';
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
  const { t, d: dg, lang } = useI18n();
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

  const cardRef = useRef<View>(null);
  const [shareOpen, setShareOpen] = useState(false);

  if (!date) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
        <View className="items-center justify-center flex-1">
          <Text className="text-ink-soft">{t('recap.badDate')}</Text>
          <Pressable onPress={() => router.back()} className="mt-4 px-4 py-2">
            <Text className="text-bubble-active font-bold">{t('common.close')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { dayMonth, weekday, full } = dayHeaderParts(date, lang);
  const pct = pctOnPath(dayMeals);
  const freq = formatFrequency(dayMeals, lang) ?? '—';
  const fasting = computeFasting(dayMeals, meals, lang) ?? '—';

  const buildMessage = (): string => {
    const lines = [
      `${t('recap.trackedWith')} — ${full}`,
      `${dg(pct)}% ${t('path.onPath')} · ${dg(dayMeals.length)} ${
        dayMeals.length === 1 ? t('path.meal') : t('path.meals')
      }`,
    ];
    if (fasting !== '—') lines.push(`${t('recap.fasting')}: ${fasting}`);
    if (freq !== '—') lines.push(`${t('path.frequency')}: ${freq}`);
    lines.push('', t('share.tagline'));
    return lines.join('\n');
  };
  const title = `The May · ${full}`;

  const onShareText = async () => {
    setShareOpen(false);
    try {
      await shareText(title, buildMessage());
    } catch {
      // dismissed / unsupported
    }
  };
  const onShareImage = async () => {
    setShareOpen(false);
    try {
      await shareCardImage(cardRef, title, buildMessage());
    } catch {
      try {
        await shareText(title, buildMessage());
      } catch {
        // ignore
      }
    }
  };

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

        {/* Recap card (also captured as the shareable image) */}
        <View
          ref={cardRef}
          collapsable={false}
          className="mx-4 rounded-2xl overflow-hidden bg-white border border-slate-200"
        >
          <View className="items-center py-4 px-4">
            <Text className="text-ink text-base font-bold">{full}</Text>
            <Text className="text-ink-mute text-xs mt-1">{t('recap.trackedWith')}</Text>
          </View>

          <DayCollage meals={dayMeals} />

          {/* Stats row */}
          <View className="flex-row py-5 bg-white">
            <View className="flex-1 items-center px-1">
              <Text
                className="text-ink text-lg font-extrabold text-center"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {fasting}
              </Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1 text-center">
                {t('recap.fasting')}
              </Text>
            </View>
            <View className="flex-1 items-center px-1">
              <Text className="text-ink text-lg font-extrabold text-center" numberOfLines={2} adjustsFontSizeToFit>
                {dg(pct)}%
              </Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1 text-center">
                {t('recap.onPath')}
              </Text>
            </View>
            <View className="flex-1 items-center px-1">
              <Text
                className="text-ink text-lg font-extrabold text-center"
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {freq}
              </Text>
              <Text className="text-path-dark text-xs tracking-widest font-bold mt-1 text-center">
                {t('recap.frequency')}
              </Text>
            </View>
          </View>

          <Text className="text-ink-mute text-[11px] text-center pb-4 px-4">
            {t('share.tagline')}
          </Text>
        </View>

        {/* Share button */}
        <View className="px-4 mt-6">
          <Pressable
            onPress={() => setShareOpen(true)}
            className="flex-row items-center justify-center bg-bubble-active rounded-full py-4"
            accessibilityRole="button"
            accessibilityLabel={t('recap.shareDay')}
          >
            <Share2 size={18} color="#FFFFFF" />
            <Text className="text-white font-bold tracking-widest ml-2">
              {t('recap.shareDay')}
            </Text>
          </Pressable>
        </View>
        </ScrollView>
      </View>

      <ShareChoice
        visible={shareOpen}
        onTextOnly={onShareText}
        onWithPictures={onShareImage}
        onClose={() => setShareOpen(false)}
      />
    </View>
  );
}
