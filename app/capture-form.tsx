import { router } from 'expo-router';
import { Pencil, X } from 'lucide-react-native';
import { useEffect } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimeRow } from '@/components/capture/DateTimeRow';
import { FeelingRow } from '@/components/capture/FeelingRow';
import {
  MultiSelectSection,
  SingleSelectSection,
} from '@/components/capture/ReflectionSection';
import { SaveAsBar } from '@/components/capture/SaveAsBar';
import { LoadingOverlay } from '@/components/common/LoadingOverlay';
import { useI18n } from '@/i18n';
import { useCreateMeal } from '@/hooks/useMeals';
import { useCaptureDraftStore } from '@/stores/captureDraftStore';
import { QUESTIONS, type DraftMeal } from '@/types/meal';

function nowIso(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString();
}

export default function CaptureFormScreen(): JSX.Element {
  const { t } = useI18n();
  const draft = useCaptureDraftStore((s) => s.draft);
  const setNote = useCaptureDraftStore((s) => s.setNote);
  const setEatenAt = useCaptureDraftStore((s) => s.setEatenAt);
  const toggleMulti = useCaptureDraftStore((s) => s.toggleMulti);
  const setSingle = useCaptureDraftStore((s) => s.setSingle);
  const setFeeling = useCaptureDraftStore((s) => s.setFeeling);
  const { saveOnPath, saveOffPath, isPending } = useCreateMeal();

  // Default the meal time to now when arriving with no time set (camera/import flow).
  useEffect(() => {
    if (!draft.eatenAt) {
      setEatenAt(nowIso());
    }
  }, [draft.eatenAt, setEatenAt]);

  const isoValue = draft.eatenAt ?? nowIso();

  const goToPath = () => {
    // Close any modal stack (capture-form is a modal), then make sure we're on Path.
    try {
      if (router.canDismiss?.()) router.dismissAll();
    } catch {
      // ignore
    }
    // The Path tab's URL is `/` (route groups like `(tabs)` are not part of the URL).
    router.replace('/');
  };

  const handleSave = async (onPath: boolean) => {
    try {
      // Optimistic cache update inside the mutation makes the meal appear instantly
      // on the Path tab, so we navigate as soon as the save resolves.
      if (onPath) await saveOnPath();
      else await saveOffPath();
      goToPath();
    } catch {
      // Navigate anyway — optimistic write already happened.
      goToPath();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View
        pointerEvents={isPending ? 'none' : 'auto'}
        style={{ flex: 1 }}
      >
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <X size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t('capture.uncoverWhy')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 40 }}>
        {draft.photoUri ? (
          <Image
            source={{ uri: draft.photoUri }}
            className="w-full aspect-square rounded-2xl mb-4"
            resizeMode="cover"
          />
        ) : draft.textContent ? (
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
            <Text
              className="text-ink text-center text-2xl font-bold px-8"
              numberOfLines={6}
            >
              {draft.textContent}
            </Text>
          </View>
        ) : (
          <View className="w-full aspect-square rounded-2xl bg-bg-card mb-4 items-center justify-center">
            <Text className="text-ink-mute">{t('capture.noPhoto')}</Text>
          </View>
        )}

        {/* When did you eat? — adjust so an imported (or just-taken) photo lands
            in the right place on the timeline. */}
        <View className="bg-bg-card rounded-2xl p-4 mb-3">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-2">
            {t('capture.whenAteTitle')}
          </Text>
          <DateTimeRow value={isoValue} onChange={setEatenAt} />
        </View>

        <View className="mb-3">
          <Text className="text-base font-bold text-ink mb-1">{t('capture.note')}</Text>
          <View className="flex-row items-center border-b border-slate-200 pb-2">
            <TextInput
              value={draft.note}
              onChangeText={setNote}
              placeholder={t('capture.addNotes')}
              placeholderTextColor="#94A3B8"
              className="flex-1 text-ink"
              multiline
            />
            <Pencil size={16} color="#94A3B8" />
          </View>
        </View>

        <View className="flex-row items-center justify-between mb-2 mt-2">
          <Text className="text-lg font-bold text-ink">{t('capture.qas')}</Text>
          <Text className="text-bubble-active font-semibold">{t('capture.customize')}</Text>
        </View>

        <MultiSelectSection
          label={t('q.whyEat')}
          options={QUESTIONS.whyEat.options}
          selected={draft.whyEat}
          onToggle={(v) => toggleMulti('whyEat', v)}
        />

        <FeelingRow selected={draft.feeling} onSelect={setFeeling} />

        <MultiSelectSection
          label={t('q.ateWith')}
          options={QUESTIONS.ateWith.options}
          selected={draft.ateWith}
          onToggle={(v) => toggleMulti('ateWith', v)}
        />

        <SingleSelectSection<NonNullable<DraftMeal['howWasIt']>>
          label={t('q.howWasIt')}
          options={QUESTIONS.howWasIt.options}
          selected={draft.howWasIt}
          onSelect={(v) => setSingle('howWasIt', v)}
        />

        <MultiSelectSection
          label={t('q.whereEat')}
          options={QUESTIONS.whereEat.options}
          selected={draft.whereEat}
          onToggle={(v) => toggleMulti('whereEat', v)}
        />

        <SingleSelectSection<NonNullable<DraftMeal['howMade']>>
          label={t('q.howMade')}
          options={QUESTIONS.howMade.options}
          selected={draft.howMade}
          onSelect={(v) => setSingle('howMade', v)}
        />

        <MultiSelectSection
          label={t('q.madeMeFeel')}
          options={QUESTIONS.madeMeFeel.options}
          selected={draft.madeMeFeel}
          onToggle={(v) => toggleMulti('madeMeFeel', v)}
        />
      </ScrollView>

      <SaveAsBar
        onSaveOnPath={() => handleSave(true)}
        onSaveOffPath={() => handleSave(false)}
        disabled={isPending}
      />
      </View>
      <LoadingOverlay visible={isPending} />
    </SafeAreaView>
  );
}
