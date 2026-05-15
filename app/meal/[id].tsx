import { router, useLocalSearchParams } from 'expo-router';
import { Pencil, Trash2, X } from 'lucide-react-native';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OffPathArrow, OnPathArrow } from '@/components/icons/OnPathArrow';
import { useDeleteMeal, useMeal } from '@/hooks/useMeals';
import { FEELING_EMOJI } from '@/types/meal';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatWhen(iso: string): string {
  const d = new Date(iso);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} · ${h}:${m} ${ampm}`;
}

// One compact row: fixed-width label on the left, wrapped chips on the right.
function Row({ label, values }: { label: string; values: string[] }): JSX.Element | null {
  if (values.length === 0) return null;
  return (
    <View className="flex-row items-start py-2 border-b border-slate-100">
      <Text
        className="text-[11px] uppercase tracking-wide text-ink-mute font-bold"
        style={{ width: 96, paddingTop: 3 }}
      >
        {label}
      </Text>
      <View className="flex-1 flex-row flex-wrap">
        {values.map((v) => (
          <View key={v} className="px-2.5 py-1 rounded-full bg-bubble-bg mr-1.5 mb-1.5">
            <Text className="text-xs text-ink font-medium">{v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function MealSummaryScreen(): JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const id =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const { data: meal, isLoading } = useMeal(id);
  const deleteMeal = useDeleteMeal();

  if (isLoading || !meal) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-ink-soft">Loading…</Text>
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Close"
        >
          <X size={24} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">Meal</Text>
        <Pressable
          onPress={onDelete}
          className="w-10 h-10 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Delete meal"
        >
          <Trash2 size={20} color="#F25C8B" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Compact header: small thumbnail + when + path badge */}
        <View className="flex-row items-center bg-bg-card rounded-2xl p-3 mb-3">
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E2E8F0',
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
                <Text style={{ fontSize: 26 }}>🍽️</Text>
              </View>
            )}
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-[11px] uppercase tracking-widest text-ink-mute mb-0.5">When</Text>
            <Text className="text-ink text-sm font-bold mb-2">{formatWhen(meal.eatenAt)}</Text>
            <View className="flex-row items-center">
              <View
                className={`w-7 h-7 rounded-full items-center justify-center ${
                  meal.onPath ? 'bg-ink' : 'bg-ink-mute'
                }`}
              >
                {meal.onPath ? (
                  <OnPathArrow size={16} color="#FFFFFF" />
                ) : (
                  <OffPathArrow size={16} color="#FFFFFF" />
                )}
              </View>
              <Text className="text-ink text-sm font-bold ml-2">
                {meal.onPath ? 'On-path' : 'Off-path'}
              </Text>
            </View>
          </View>
        </View>

        {hasReflection ? (
          <View className="bg-bg-card rounded-2xl px-4 py-1">
            {meal.note ? (
              <View className="flex-row items-start py-2 border-b border-slate-100">
                <Text
                  className="text-[11px] uppercase tracking-wide text-ink-mute font-bold"
                  style={{ width: 96, paddingTop: 2 }}
                >
                  Note
                </Text>
                <Text className="flex-1 text-ink text-sm">{meal.note}</Text>
              </View>
            ) : null}

            <Row label="Why I ate" values={meal.whyEat} />

            {feelingEmoji ? (
              <View className="flex-row items-center py-2 border-b border-slate-100">
                <Text
                  className="text-[11px] uppercase tracking-wide text-ink-mute font-bold"
                  style={{ width: 96 }}
                >
                  Feeling
                </Text>
                <Text style={{ fontSize: 22 }}>{feelingEmoji}</Text>
              </View>
            ) : null}

            <Row label="Ate with" values={meal.ateWith} />
            <Row label="How was it" values={meal.howWasIt ? [meal.howWasIt] : []} />
            <Row label="Where" values={meal.whereEat} />
            <Row label="How made" values={meal.howMade ? [meal.howMade] : []} />
            <Row label="After" values={meal.madeMeFeel} />
          </View>
        ) : (
          <View className="items-center py-6">
            <Text className="text-ink-soft text-center text-sm">
              No reflections added for this meal yet.
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-4 pb-6 pt-2 border-t border-slate-100">
        <Pressable
          onPress={() => router.push(`/meal/edit/${meal.id}` as Parameters<typeof router.push>[0])}
          className="flex-row items-center justify-center bg-bubble-active rounded-full py-3.5"
          accessibilityRole="button"
          accessibilityLabel="Edit this meal"
        >
          <Pencil size={18} color="#FFFFFF" />
          <Text className="text-white font-bold tracking-widest ml-2">EDIT</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
