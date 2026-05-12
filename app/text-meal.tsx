import { router } from 'expo-router';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTimeRow } from '@/components/capture/DateTimeRow';
import { useCaptureDraftStore } from '@/stores/captureDraftStore';

function nowIso(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString();
}

export default function TextMealScreen(): JSX.Element {
  const setTextContent = useCaptureDraftStore((s) => s.setTextContent);
  const setEatenAt = useCaptureDraftStore((s) => s.setEatenAt);
  const setPhotoUri = useCaptureDraftStore((s) => s.setPhotoUri);
  const reset = useCaptureDraftStore((s) => s.reset);

  const [text, setText] = useState('');
  const [iso, setIso] = useState<string>(nowIso());

  useEffect(() => {
    // Start from a clean draft when arriving here
    reset();
    setPhotoUri(null);
  }, [reset, setPhotoUri]);

  const onDone = () => {
    if (!text.trim()) return;
    setTextContent(text.trim());
    setEatenAt(iso);
    router.replace('/capture-form');
  };

  const canSubmit = text.trim().length > 0;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">Add a text-only meal</Text>
        <Pressable
          onPress={onDone}
          disabled={!canSubmit}
          className="px-3 py-1"
          accessibilityLabel="Done"
        >
          <Text
            className={`font-bold ${canSubmit ? 'text-bubble-active' : 'text-ink-mute'}`}
          >
            Done
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View className="bg-bg-card rounded-2xl p-4 mb-5">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-3">
            When did you eat?
          </Text>
          <DateTimeRow value={iso} onChange={setIso} />
        </View>

        <Text className="text-base font-bold text-ink mb-2">Describe your meal</Text>
        <View className="flex-row items-center border-b border-slate-200 pb-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="e.g. Oatmeal with banana"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-ink text-2xl font-bold"
            autoFocus
            multiline
          />
          <Pencil size={18} color="#94A3B8" />
        </View>
        <Text className="text-ink-mute text-xs mt-3">
          On the next step you'll answer the reflection questions and save as on/off-path.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
