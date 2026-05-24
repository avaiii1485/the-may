import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CatalogReflection, type MultiField, type SingleField } from '@/components/capture/CatalogReflection';
import { DateTimeRow } from '@/components/capture/DateTimeRow';
import { OffPathArrow, OnPathArrow } from '@/components/icons/OnPathArrow';
import { useI18n } from '@/i18n';
import { useMeal, useUpdateMeal } from '@/hooks/useMeals';
import { useQuestions } from '@/hooks/useQuestions';
import { type FeelingLevel, type Meal } from '@/types/meal';

interface FormState {
  note: string;
  eatenAt: string;
  whyEat: string[];
  feeling: FeelingLevel | null;
  ateWith: string[];
  howWasIt: Meal['howWasIt'];
  whereEat: string[];
  howMade: Meal['howMade'];
  madeMeFeel: string[];
  onPath: boolean;
}

function fromMeal(m: Meal): FormState {
  return {
    note: m.note ?? '',
    eatenAt: m.eatenAt,
    whyEat: [...m.whyEat],
    feeling: m.feeling,
    ateWith: [...m.ateWith],
    howWasIt: m.howWasIt,
    whereEat: [...m.whereEat],
    howMade: m.howMade,
    madeMeFeel: [...m.madeMeFeel],
    onPath: m.onPath,
  };
}

export default function MealEditScreen(): JSX.Element {
  const { t } = useI18n();
  const params = useLocalSearchParams<{ id: string }>();
  const id =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const { data: meal, isLoading } = useMeal(id);
  const { update, isPending } = useUpdateMeal();
  const questions = useQuestions();
  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    if (meal && !form) setForm(fromMeal(meal));
  }, [meal, form]);

  const set = useMemo(
    () =>
      <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((s) => (s ? { ...s, [key]: value } : s)),
    [],
  );

  const toggleMulti = (key: MultiField, value: string) => {
    setForm((s) => {
      if (!s) return s;
      const arr = s[key];
      const next = arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
      return { ...s, [key]: next };
    });
  };

  const setSingleSafe = (field: SingleField, value: string) => {
    if (field === 'howWasIt') set('howWasIt', value as Meal['howWasIt']);
    else set('howMade', value as Meal['howMade']);
  };

  const onSave = async () => {
    if (!id || !form) return;
    const patch: Partial<Omit<Meal, 'id' | 'userId' | 'createdAt'>> = {
      note: form.note || null,
      eatenAt: form.eatenAt,
      whyEat: form.whyEat,
      feeling: form.feeling,
      ateWith: form.ateWith,
      howWasIt: form.howWasIt,
      whereEat: form.whereEat,
      howMade: form.howMade,
      madeMeFeel: form.madeMeFeel,
      onPath: form.onPath,
    };
    try {
      await update(id, patch);
      router.back();
    } catch {
      // surface UI error if desired
    }
  };

  if (isLoading || !form || !meal) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-ink-soft">{t('common.loading')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Cancel"
        >
          <X size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t('meal.editTitle')}</Text>
        <Pressable
          onPress={onSave}
          disabled={isPending}
          className={`px-4 py-2 rounded-full ${isPending ? 'bg-ink-mute' : 'bg-bubble-active'}`}
          accessibilityLabel="Save changes"
        >
          <Text className="text-white font-bold">{t('meal.save')}</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {meal.photoUrl ? (
          <Image
            source={{ uri: meal.photoUrl }}
            className="w-full aspect-square rounded-2xl mb-4"
            resizeMode="cover"
          />
        ) : meal.textContent ? (
          <View
            className="w-full aspect-square rounded-2xl mb-4 items-center justify-center bg-white"
            style={{
              shadowColor: '#0F172A',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Text className="text-ink text-center text-2xl font-bold px-8" numberOfLines={6}>
              {meal.textContent}
            </Text>
          </View>
        ) : (
          <View className="w-full aspect-square rounded-2xl bg-bg-card mb-4 items-center justify-center">
            <Text className="text-ink-mute">{t('capture.noPhoto')}</Text>
          </View>
        )}

        <View className="bg-bg-card rounded-2xl p-4 mb-3">
          <Text className="text-base font-semibold text-ink mb-3">{t('meal.saveAs')}</Text>
          <View className="flex-row justify-around">
            <Pressable
              onPress={() => set('onPath', false)}
              className="items-center"
              accessibilityRole="button"
              accessibilityState={{ selected: !form.onPath }}
            >
              <View
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  !form.onPath ? 'bg-ink' : 'bg-ink-mute'
                }`}
              >
                <OffPathArrow color="#FFFFFF" />
              </View>
              <Text className="text-ink mt-1 text-sm">{t('path.offPath')}</Text>
            </Pressable>
            <Pressable
              onPress={() => set('onPath', true)}
              className="items-center"
              accessibilityRole="button"
              accessibilityState={{ selected: form.onPath }}
            >
              <View
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  form.onPath ? 'bg-ink' : 'bg-ink-mute'
                }`}
              >
                <OnPathArrow color="#FFFFFF" />
              </View>
              <Text className="text-ink mt-1 text-sm">{t('path.onPath')}</Text>
            </Pressable>
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-base font-bold text-ink mb-1">{t('capture.note')}</Text>
          <View className="flex-row items-center border-b border-slate-200 pb-2">
            <TextInput
              value={form.note}
              onChangeText={(v) => set('note', v)}
              placeholder={t('capture.addNotes')}
              placeholderTextColor="#94A3B8"
              className="flex-1 text-ink"
              multiline
            />
            <Pencil size={16} color="#94A3B8" />
          </View>
        </View>

        {/* Adjust the meal time — saving will move the meal in the timeline. */}
        <View className="bg-bg-card rounded-2xl p-4 mb-3">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-2">
            {t('capture.whenAteTitle')}
          </Text>
          <DateTimeRow value={form.eatenAt} onChange={(iso) => set('eatenAt', iso)} />
        </View>

        <CatalogReflection
          questions={questions}
          multiValues={{
            whyEat: form.whyEat,
            ateWith: form.ateWith,
            whereEat: form.whereEat,
            madeMeFeel: form.madeMeFeel,
          }}
          onToggleMulti={toggleMulti}
          howWasIt={form.howWasIt}
          howMade={form.howMade}
          onSetSingle={setSingleSafe}
          feeling={form.feeling}
          onSetFeeling={(f) => set('feeling', f)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
