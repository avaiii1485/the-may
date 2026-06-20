import { router, useLocalSearchParams } from 'expo-router';
import { X } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeIcon } from '@/components/profile/BadgeIcon';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { getAllBadges, type ResolvedBadge } from '@/lib/badges';
import { useProfileStore } from '@/stores/profileStore';
import { useThemeStore } from '@/stores/themeStore';

function BadgeRow({
  badge,
  earnedLabel,
  d,
  highlight = false,
}: {
  badge: ResolvedBadge;
  earnedLabel: string;
  d: (n: string | number) => string;
  highlight?: boolean;
}): JSX.Element {
  const earned = badge.progress.earned;
  const pct = Math.round(badge.progress.ratio * 100);
  return (
    <View
      className="flex-row items-center rounded-2xl p-4 mb-3"
      style={{
        backgroundColor: highlight ? `${badge.def.color}22` : '#F8FAFC',
        borderWidth: highlight ? 2 : 0,
        borderColor: highlight ? badge.def.color : 'transparent',
      }}
    >
      <BadgeIcon emoji={badge.def.emoji} color={badge.def.color} earned={earned} size={56} />
      <View className="flex-1 mx-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-base font-bold ${earned ? 'text-ink' : 'text-ink-soft'}`}>
            {badge.name}
          </Text>
          {earned ? (
            <Text
              className="text-[10px] uppercase tracking-widest font-bold"
              style={{ color: badge.def.color }}
            >
              {earnedLabel}
            </Text>
          ) : (
            <Text className="text-[10px] uppercase tracking-widest text-ink-mute font-bold">
              {d(pct)}%
            </Text>
          )}
        </View>
        <Text
          className={`text-xs mb-2 ${earned ? 'text-ink-soft' : 'text-ink-mute'}`}
          numberOfLines={2}
        >
          {badge.description}
        </Text>
        <View
          style={{ height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' }}
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

export default function BadgesScreen(): JSX.Element {
  const { t, d, lang } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const params = useLocalSearchParams<{ focus?: string }>();
  const focusId =
    typeof params.focus === 'string'
      ? params.focus
      : Array.isArray(params.focus)
        ? params.focus[0]
        : undefined;
  const { data: meals } = useMeals();
  const { goal } = useGoal();
  const profile = useProfileStore();

  const badges = useMemo(
    () =>
      getAllBadges(
        { meals, goal, preferredName: profile.preferredName, handle: profile.handle },
        lang,
      ),
    [meals, goal, profile.preferredName, profile.handle, lang],
  );

  const earnedCount = badges.filter((b) => b.progress.earned).length;

  const grouped = useMemo(() => {
    const map = new Map<string, ResolvedBadge[]>();
    for (const b of badges) {
      const arr = map.get(b.def.category) ?? [];
      arr.push(b);
      map.set(b.def.category, arr);
    }
    const order: string[] = [
      'logging',
      'streak',
      'path',
      'reflection',
      'features',
      'time',
      'variety',
    ];
    let groups = order
      .map((cat) => ({ cat, items: map.get(cat) ?? [] }))
      .filter((g) => g.items.length > 0);

    if (focusId) {
      // Hoist the focused badge's group to the top, and the badge to the top
      // of its group, so the user lands right on the one they just earned.
      groups = groups
        .map((g) => {
          if (!g.items.some((b) => b.def.id === focusId)) return g;
          const focused = g.items.filter((b) => b.def.id === focusId);
          const rest = g.items.filter((b) => b.def.id !== focusId);
          return { cat: g.cat, items: [...focused, ...rest] };
        })
        .sort((a, b) => {
          const aHas = a.items.some((x) => x.def.id === focusId) ? 0 : 1;
          const bHas = b.items.some((x) => x.def.id === focusId) ? 0 : 1;
          return aHas - bHas;
        });
    }
    return groups;
  }, [badges, focusId]);

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel={t('common.close')}
        >
          <X size={22} color={dark ? '#D2C3AF' : '#0F172A'} />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t('badges.title')}</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center py-6 bg-path-soft">
          <Text className="text-path-dark text-5xl font-extrabold">
            {d(earnedCount)}
            <Text className="text-2xl font-bold">
              {' '}
              / {d(badges.length)}
            </Text>
          </Text>
          <Text className="text-ink-soft text-sm mt-1">{t('badges.earned')}</Text>
        </View>

        <View className="px-4 pt-4">
          {grouped.map(({ cat, items }) => (
            <View key={cat}>
              <Text className="text-xs uppercase tracking-widest text-ink-mute font-bold mt-4 mb-2 px-1">
                {t(`badges.cat.${cat}`)}
              </Text>
              {items.map((b) => (
                <BadgeRow
                  key={b.def.id}
                  badge={b}
                  earnedLabel={t('badges.earnedTag')}
                  d={d}
                  highlight={b.def.id === focusId}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
