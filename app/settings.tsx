import { router } from 'expo-router';
import { Check, ChevronRight, Pencil, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { useGoal, useSetGoal } from '@/hooks/useProfile';

const PRESET_GOALS: readonly string[] = [
  'Eating from smaller plates',
  'Eating with non-dominant hand',
  'Using smaller utensils',
  'Eating more veggies',
  'Putting the phone down while eating',
  'Eating with chopsticks',
  'Eating bite-sized',
  'Taking 2 deep breaths before meals',
  'Eating from a bowl',
  'Reduce snacking',
] as const;

export default function SettingsScreen(): JSX.Element {
  const { t, tv } = useI18n();
  const { goal } = useGoal();
  const setGoal = useSetGoal();
  const [custom, setCustom] = useState('');

  useEffect(() => {
    // If the existing goal isn't one of the presets, prefill the custom input.
    if (goal && !PRESET_GOALS.includes(goal)) setCustom(goal);
  }, [goal]);

  const pick = async (next: string) => {
    await setGoal(next);
    router.back();
  };

  const saveCustom = async () => {
    const trimmed = custom.trim();
    if (!trimmed) return;
    await setGoal(trimmed);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Close"
        >
          <X size={22} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t('settings.currentFocus')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 py-6 items-center">
          <Text className="text-xl font-extrabold text-ink text-center">
            {t('settings.title')}
          </Text>
          <Text className="text-ink-soft text-center mt-2">{t('settings.subtitle')}</Text>
        </View>

        <View className="px-4">
          {PRESET_GOALS.map((preset) => {
            const isActive = goal === preset;
            return (
              <Pressable
                key={preset}
                onPress={() => pick(preset)}
                className={`flex-row items-center justify-between py-4 px-4 mb-2 rounded-2xl ${
                  isActive ? 'bg-path-soft' : 'bg-bg-card'
                }`}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={tv('focus', preset)}
              >
                <Text
                  className={`text-ink font-bold tracking-wide uppercase text-[13px] flex-1 pr-2 ${
                    isActive ? 'text-path-dark' : ''
                  }`}
                >
                  {tv('focus', preset)}
                </Text>
                {isActive ? (
                  <Check size={20} color="#D6791F" />
                ) : (
                  <ChevronRight size={20} color="#94A3B8" />
                )}
              </Pressable>
            );
          })}
        </View>

        <View className="px-5 mt-6">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-2">
            {t('settings.orOwn')}
          </Text>
          <View className="flex-row items-center border-b border-slate-200 pb-2">
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder={t('settings.ownPlaceholder')}
              placeholderTextColor="#94A3B8"
              className="flex-1 text-ink text-base"
              multiline
            />
            <Pencil size={16} color="#94A3B8" />
          </View>
          <Pressable
            onPress={saveCustom}
            disabled={custom.trim().length === 0}
            className={`mt-4 rounded-full py-3 items-center ${
              custom.trim().length === 0 ? 'bg-ink-mute' : 'bg-bubble-active'
            }`}
            accessibilityRole="button"
            accessibilityLabel={t('settings.saveFocus')}
          >
            <Text className="text-white font-bold tracking-widest">
              {t('settings.saveFocus')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
