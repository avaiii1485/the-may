import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeIcon } from '@/components/profile/BadgeIcon';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { getAllBadges, type ResolvedBadge } from '@/lib/badges';
import { useProfileStore } from '@/stores/profileStore';

function BadgeRow({ badge }: { badge: ResolvedBadge }): JSX.Element {
  const earned = badge.progress.earned;
  const pct = Math.round(badge.progress.ratio * 100);
  return (
    <View className="flex-row items-center bg-bg-card rounded-2xl p-4 mb-3">
      <BadgeIcon emoji={badge.def.emoji} color={badge.def.color} earned={earned} size={56} />
      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-base font-bold ${earned ? 'text-ink' : 'text-ink-soft'}`}>
            {badge.def.name}
          </Text>
          {earned ? (
            <Text
              className="text-[10px] uppercase tracking-widest font-bold"
              style={{ color: badge.def.color }}
            >
              Earned
            </Text>
          ) : (
            <Text className="text-[10px] uppercase tracking-widest text-ink-mute font-bold">
              {pct}%
            </Text>
          )}
        </View>
        <Text
          className={`text-xs mb-2 ${earned ? 'text-ink-soft' : 'text-ink-mute'}`}
          numberOfLines={2}
        >
          {badge.def.description}
        </Text>
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#E5E7EB',
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(2, pct)}%`,
              height: 6,
              backgroundColor: earned ? badge.def.color : '#94A3B8',
            }}
          />
        </View>
        <Text className="text-[10px] text-ink-mute mt-1">{badge.progress.statusText}</Text>
      </View>
    </View>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  logging: 'Logging',
  streak: 'Days logged',
  path: 'On-path',
  reflection: 'Reflection',
  features: 'Features explored',
  time: 'Time of day',
  variety: 'Variety',
};

export default function BadgesScreen(): JSX.Element {
  const { data: meals } = useMeals();
  const { goal } = useGoal();
  const profile = useProfileStore();

  const badges = useMemo(
    () =>
      getAllBadges({
        meals,
        goal,
        preferredName: profile.preferredName,
        handle: profile.handle,
      }),
    [meals, goal, profile.preferredName, profile.handle],
  );

  const earnedCount = badges.filter((b) => b.progress.earned).length;

  const grouped = useMemo(() => {
    const map = new Map<string, ResolvedBadge[]>();
    for (const b of badges) {
      const arr = map.get(b.def.category) ?? [];
      arr.push(b);
      map.set(b.def.category, arr);
    }
    const order: string[] = ['logging', 'streak', 'path', 'reflection', 'features', 'time', 'variety'];
    return order
      .map((cat) => ({ cat, items: map.get(cat) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [badges]);

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
        <Text className="text-lg font-bold text-ink">Badges</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center py-6 bg-path-soft">
          <Text className="text-path-dark text-5xl font-extrabold">
            {earnedCount}
            <Text className="text-2xl font-bold"> / {badges.length}</Text>
          </Text>
          <Text className="text-ink-soft text-sm mt-1">badges earned</Text>
        </View>

        <View className="px-4 pt-4">
          {grouped.map(({ cat, items }) => (
            <View key={cat}>
              <Text className="text-xs uppercase tracking-widest text-ink-mute font-bold mt-4 mb-2 px-1">
                {CATEGORY_LABELS[cat] ?? cat}
              </Text>
              {items.map((b) => (
                <BadgeRow key={b.def.id} badge={b} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
