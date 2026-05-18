import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import { BadgeIcon } from '@/components/profile/BadgeIcon';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { getAllBadges, type ResolvedBadge } from '@/lib/badges';
import { useProfileStore } from '@/stores/profileStore';
import { useSeenBadgesStore } from '@/stores/seenBadgesStore';

// Shows a celebratory banner on the Path tab the first time the user lands
// here after earning a new badge.
export function BadgeCelebration(): JSX.Element | null {
  const { t, lang } = useI18n();
  const { data: meals } = useMeals();
  const { goal } = useGoal();
  const preferredName = useProfileStore((s) => s.preferredName);
  const handle = useProfileStore((s) => s.handle);

  const seen = useSeenBadgesStore((s) => s.seen);
  const primed = useSeenBadgesStore((s) => s.primed);
  const prime = useSeenBadgesStore((s) => s.prime);
  const markSeen = useSeenBadgesStore((s) => s.markSeen);

  const earned = useMemo(
    () =>
      getAllBadges({ meals, goal, preferredName, handle }, lang).filter(
        (b) => b.progress.earned,
      ),
    [meals, goal, preferredName, handle, lang],
  );
  const earnedIds = useMemo(() => earned.map((b) => b.def.id), [earned]);

  const [celebrating, setCelebrating] = useState<ResolvedBadge | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  // Decide what (if anything) to celebrate.
  useEffect(() => {
    if (!primed) {
      // First ever snapshot — adopt current badges silently, no banner.
      prime(earnedIds);
      return;
    }
    const fresh = earned.filter((b) => !seen.includes(b.def.id));
    if (fresh.length > 0 && !celebrating) {
      setCelebrating(fresh[0] ?? null);
      markSeen(earnedIds);
    }
  }, [primed, earned, earnedIds, seen, prime, markSeen, celebrating]);

  // Animate in, hold, animate out.
  useEffect(() => {
    if (!celebrating) return;
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();
    const id = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => setCelebrating(null));
    }, 4200);
    return () => clearTimeout(id);
  }, [celebrating, anim]);

  if (!celebrating) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 12,
        left: 16,
        right: 16,
        zIndex: 50,
        opacity: anim,
        transform: [{ translateY }],
      }}
    >
      <Pressable
        onPress={() => {
          const id = celebrating.def.id;
          setCelebrating(null);
          router.push(`/badges?focus=${id}` as Parameters<typeof router.push>[0]);
        }}
        className="flex-row items-center bg-white rounded-2xl px-4 py-3"
        style={{
          shadowColor: '#0F172A',
          shadowOpacity: 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
          borderWidth: 1,
          borderColor: '#F4C04C',
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t('badge.unlocked')} ${celebrating.name}`}
      >
        <BadgeIcon
          emoji={celebrating.def.emoji}
          color={celebrating.def.color}
          earned
          size={44}
        />
        <View className="flex-1 mx-3">
          <Text className="text-[11px] uppercase tracking-widest text-path-dark font-bold">
            🎉 {t('badge.unlocked')}
          </Text>
          <Text className="text-ink text-base font-extrabold" numberOfLines={1}>
            {celebrating.name}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
