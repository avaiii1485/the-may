import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OffPathArrow, OnPathArrow } from '@/components/icons/OnPathArrow';
import { useI18n, type I18n } from '@/i18n';
import { useDeleteMeal, useMeal } from '@/hooks/useMeals';
import { toJalali } from '@/lib/jalali';
import { useThemeStore } from '@/stores/themeStore';
import { FEELING_EMOJI } from '@/types/meal';

const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;
const WEEKDAYS_FA = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'] as const;

function formatWhen(iso: string, i18n: I18n): string {
  const dt = new Date(iso);
  let h = dt.getHours();
  const m = dt.getMinutes().toString().padStart(2, '0');
  if (i18n.lang === 'fa') {
    const wd = WEEKDAYS_FA[dt.getDay()];
    const j = toJalali(dt);
    return `${wd}، ${j.jd} ${j.monthName} · ${h}:${m}`;
  }
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${WEEKDAYS_EN[dt.getDay()]}, ${MONTHS_EN[dt.getMonth()]} ${dt.getDate()} · ${h}:${m} ${ampm}`;
}

function Row({
  label,
  values,
  tv,
}: {
  label: string;
  values: string[];
  tv: I18n['tv'];
}): JSX.Element | null {
  if (values.length === 0) return null;
  return (
    <View className="flex-row items-start py-3">
      <View className="flex-row items-center" style={{ width: 104, paddingTop: 4 }}>
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: '#F39C3D',
            marginEnd: 8,
          }}
        />
        <Text className="text-[11px] uppercase tracking-wide text-path-dark font-bold flex-1">
          {label}
        </Text>
      </View>
      <View className="flex-1 flex-row flex-wrap">
        {values.map((v) => (
          <View
            key={v}
            className="px-3 py-1.5 rounded-full bg-path-soft mr-1.5 mb-1.5"
          >
            <Text className="text-xs text-path-dark font-semibold">{tv('opt', v)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MealSummaryScreen(): JSX.Element {
  const i18n = useI18n();
  const { t, tv } = i18n;
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const params = useLocalSearchParams<{ id: string }>();
  const id =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const { data: meal, isLoading } = useMeal(id);
  const deleteMeal = useDeleteMeal();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !meal) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <Text className="text-ink-soft">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  const onDelete = async () => {
    if (!id) return;
    try {
      await deleteMeal(id);
      router.back();
    } catch {
      // ignore
    }
  };

  const feelingEmoji = meal.feeling !== null ? FEELING_EMOJI[meal.feeling] : null;
  const hasReflection =
    !!meal.note ||
    meal.whyEat.length > 0 ||
    meal.feeling !== null ||
    meal.ateWith.length > 0 ||
    !!meal.howWasIt ||
    meal.whereEat.length > 0 ||
    !!meal.howMade ||
    meal.madeMeFeel.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel={t('common.close')}
        >
          <X size={24} color={dark ? '#D2C3AF' : '#0F172A'} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t('meal.title')}</Text>
        <Pressable
          onPress={() => setConfirmOpen(true)}
          className="w-10 h-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={t('meal.deleteMeal')}
        >
          <Trash2 size={20} color="#F25C8B" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero — soft peach card with the signature color */}
        <View
          className="rounded-3xl p-4 mb-4 flex-row items-center"
          style={{
            backgroundColor: dark ? '#8A7860' : '#FCEBD3',
            shadowColor: '#D6791F',
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#0F172A',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            }}
          >
            {meal.photoUrl ? (
              <Image
                source={{ uri: meal.photoUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : meal.textContent ? (
              <View className="w-full h-full items-center justify-center px-1">
                <Text className="text-ink text-center text-[11px] font-semibold" numberOfLines={4}>
                  {meal.textContent}
                </Text>
              </View>
            ) : (
              <View className="w-full h-full items-center justify-center bg-path-soft">
                <Text style={{ fontSize: 30 }}>🍽️</Text>
              </View>
            )}
          </View>

          <View className="flex-1 mx-4">
            <Text className="text-[11px] uppercase tracking-widest text-path-dark font-bold mb-1">
              {t('meal.when')}
            </Text>
            <Text className="text-ink text-base font-extrabold mb-3">
              {formatWhen(meal.eatenAt, i18n)}
            </Text>
            <View
              className="self-start flex-row items-center rounded-full pe-3 ps-1 py-1"
              style={{ backgroundColor: meal.onPath ? '#F39C3D' : '#FFFFFF' }}
            >
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: meal.onPath ? 'rgba(255,255,255,0.25)' : '#94A3B8' }}
              >
                {meal.onPath ? (
                  <OnPathArrow size={14} color="#FFFFFF" />
                ) : (
                  <OffPathArrow size={14} color="#FFFFFF" />
                )}
              </View>
              <Text
                className="text-xs font-extrabold mx-2"
                style={{ color: meal.onPath ? '#FFFFFF' : '#475569' }}
              >
                {meal.onPath ? t('path.onPath') : t('path.offPath')}
              </Text>
            </View>
          </View>
        </View>

        {hasReflection ? (
          <View
            className="bg-white dark:bg-[#241B12] rounded-3xl px-5 py-2"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.06,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
              borderWidth: 1,
              borderColor: '#FCEBD3',
            }}
          >
            {meal.note ? (
              <View className="flex-row items-start py-3">
                <View className="flex-row items-center" style={{ width: 104, paddingTop: 2 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#F39C3D',
                      marginEnd: 8,
                    }}
                  />
                  <Text className="text-[11px] uppercase tracking-wide text-path-dark font-bold flex-1">
                    {t('capture.note')}
                  </Text>
                </View>
                <Text className="flex-1 text-ink text-sm">{meal.note}</Text>
              </View>
            ) : null}

            <Row label={t('meal.sum.whyIAte')} values={meal.whyEat} tv={tv} />

            {feelingEmoji ? (
              <View className="flex-row items-center py-3">
                <View className="flex-row items-center" style={{ width: 104 }}>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: '#F39C3D',
                      marginEnd: 8,
                    }}
                  />
                  <Text className="text-[11px] uppercase tracking-wide text-path-dark font-bold flex-1">
                    {t('meal.sum.feeling')}
                  </Text>
                </View>
                <Text style={{ fontSize: 24 }}>{feelingEmoji}</Text>
              </View>
            ) : null}

            <Row label={t('meal.sum.ateWith')} values={meal.ateWith} tv={tv} />
            <Row
              label={t('meal.sum.howWasIt')}
              values={meal.howWasIt ? [meal.howWasIt] : []}
              tv={tv}
            />
            <Row label={t('meal.sum.where')} values={meal.whereEat} tv={tv} />
            <Row
              label={t('meal.sum.howMade')}
              values={meal.howMade ? [meal.howMade] : []}
              tv={tv}
            />
            <Row label={t('meal.sum.after')} values={meal.madeMeFeel} tv={tv} />
          </View>
        ) : (
          <View
            className="bg-white dark:bg-[#241B12] rounded-3xl items-center py-10 px-6"
            style={{ borderWidth: 1, borderColor: '#FCEBD3' }}
          >
            <Text className="text-ink-soft text-center text-sm">{t('meal.noReflections')}</Text>
          </View>
        )}
      </ScrollView>

      <View className="px-4 pb-6 pt-3">
        <Pressable
          onPress={() => router.push(`/meal/edit/${meal.id}` as Parameters<typeof router.push>[0])}
          className="flex-row items-center justify-center rounded-full py-4"
          style={{
            backgroundColor: dark ? '#8A7860' : '#F39C3D',
            shadowColor: '#D6791F',
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 5 },
            elevation: 4,
          }}
          accessibilityRole="button"
          accessibilityLabel={t('meal.edit')}
        >
          <Pencil size={18} color="#FFFFFF" />
          <Text className="text-white font-extrabold tracking-widest mx-2">{t('meal.edit')}</Text>
        </Pressable>
      </View>

      {confirmOpen ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View className="bg-white dark:bg-[#241B12] rounded-3xl p-6 w-full" style={{ maxWidth: 360 }}>
            <Text className="text-ink text-lg font-extrabold text-center mb-1">
              {t('confirm.deleteTitle')}
            </Text>
            <Text className="text-ink-soft text-sm text-center mb-5">
              {t('confirm.deleteBody')}
            </Text>
            <Pressable
              onPress={onDelete}
              className="rounded-full py-3 items-center mb-2"
              style={{ backgroundColor: '#F25C8B' }}
              accessibilityRole="button"
              accessibilityLabel={t('common.yesDelete')}
            >
              <Text className="text-white font-bold tracking-wide">{t('common.yesDelete')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setConfirmOpen(false)}
              className="rounded-full py-3 items-center bg-bg-card"
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text className="text-ink font-bold tracking-wide">{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
