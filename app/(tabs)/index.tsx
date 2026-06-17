import { router, useFocusEffect } from 'expo-router';
import { ChevronDown } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SyncStatus } from '@/components/common/SyncStatus';
import { BadgeCelebration } from '@/components/path/BadgeCelebration';
import { DaySection } from '@/components/path/DaySection';
import { EmptyDayPlaceholder } from '@/components/path/EmptyDayPlaceholder';
import { PathHeader } from '@/components/path/PathHeader';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { groupMealsByDay, withEmptyDays } from '@/lib/dayGroup';
import { isSupabaseConfigured } from '@/lib/supabase';
import { startOfDay } from '@/lib/time';
import { useAuthStore } from '@/stores/authStore';
import { useAuthPromptStore } from '@/stores/authPromptStore';
import { usePathScrollStore } from '@/stores/pathScrollStore';

export default function PathScreen(): JSX.Element {
  const { t } = useI18n();
  const { data: meals } = useMeals();
  const { goal } = useGoal();
  const today = startOfDay(new Date());

  // Invite sign-in on first launch when there's no account and the user hasn't
  // skipped. Presented once per session; logout re-opens it explicitly.
  const accountEmail = useAuthStore((s) => s.email);
  const authInitialized = useAuthStore((s) => s.initialized);
  const authRecovery = useAuthStore((s) => s.recovery);
  const authDismissed = useAuthPromptStore((s) => s.dismissed);
  const promptedRef = useRef(false);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (authInitialized && !accountEmail && !authDismissed && !promptedRef.current) {
      promptedRef.current = true;
      router.push('/auth');
    }
  }, [authInitialized, accountEmail, authDismissed]);

  // Arriving from a password-reset link: open the auth screen to set a new password.
  useEffect(() => {
    if (authRecovery) router.push('/auth');
  }, [authRecovery]);

  // groupMealsByDay returns desc (newest first). Reverse so the timeline reads
  // oldest → newest from top to bottom of the scroll, with today at the bottom.
  const ascending = groupMealsByDay(meals).slice().reverse();
  const entries = withEmptyDays(ascending);

  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);
  const viewportH = useRef(0);
  const contentH = useRef(0);
  const didInitialScroll = useRef(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const jumpToBottom = usePathScrollStore((s) => s.jumpToBottom);
  const clearJump = usePathScrollStore((s) => s.clearJump);
  const focusMealId = usePathScrollStore((s) => s.focusMealId);
  const clearFocusMeal = usePathScrollStore((s) => s.clearFocusMeal);
  const rowRefs = useRef(new Map<string, View>()).current;

  const NEAR_BOTTOM = 80; // px tolerance for treating the feed as "at the bottom"

  // The jump-to-bottom button shows only when the feed is scrollable AND the
  // user has scrolled up away from the bottom.
  const recomputeShowDown = useCallback(() => {
    const scrollable = contentH.current - viewportH.current;
    const distFromBottom = scrollable - offsetRef.current;
    setShowScrollDown(scrollable > NEAR_BOTTOM && distFromBottom > NEAR_BOTTOM);
  }, []);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      offsetRef.current = e.nativeEvent.contentOffset.y;
      viewportH.current = e.nativeEvent.layoutMeasurement.height;
      contentH.current = e.nativeEvent.contentSize.height;
      recomputeShowDown();
    },
    [recomputeShowDown],
  );

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const registerRow = useCallback(
    (id: string, node: View | null) => {
      if (node) rowRefs.set(id, node);
      else rowRefs.delete(id);
    },
    [rowRefs],
  );

  // Smoothly scroll to a specific meal's row by measuring its offset within the
  // ScrollView's content (used after a meal's time is edited and it moves).
  const scrollToMeal = useCallback(
    (id: string) => {
      const node = rowRefs.get(id);
      const inner = scrollRef.current?.getInnerViewNode?.();
      if (!node || inner == null) return;
      node.measureLayout(
        inner,
        (_x: number, y: number) => {
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
        },
        () => {},
      );
    },
    [rowRefs],
  );

  // Scroll behavior on focus, in priority order:
  //  - first mount: land on the latest meal (bottom), no animation.
  //  - a new meal was just saved: smoothly scroll to the bottom to reveal it.
  //  - a meal's time was edited: smoothly scroll to its new timeline position.
  //  - otherwise (returning from an edit/summary or another tab): leave the
  //    scroll where the user left it — the ScrollView keeps its own position.
  useFocusEffect(
    useCallback(() => {
      const id = setTimeout(() => {
        if (!didInitialScroll.current) {
          scrollRef.current?.scrollToEnd({ animated: false });
          didInitialScroll.current = true;
        } else if (jumpToBottom) {
          scrollRef.current?.scrollToEnd({ animated: true });
        } else if (focusMealId) {
          scrollToMeal(focusMealId);
        }
        if (jumpToBottom) clearJump();
        if (focusMealId) clearFocusMeal();
        recomputeShowDown();
      }, 80);
      return () => clearTimeout(id);
    }, [jumpToBottom, clearJump, focusMealId, clearFocusMeal, scrollToMeal, recomputeShowDown]),
  );

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <BadgeCelebration />
      <PathHeader goal={goal} />
      <SyncStatus />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1, justifyContent: 'flex-end' }}
      >
        {entries.length === 0 ? (
          <View className="items-center px-8 py-16">
            <Text className="text-ink-soft text-center">{t('path.empty')}</Text>
          </View>
        ) : (
          entries.map((entry) => {
            if (entry.kind === 'empty') {
              return (
                <EmptyDayPlaceholder
                  key={`empty-${entry.date.toISOString()}`}
                  date={entry.date}
                  today={today}
                />
              );
            }
            return (
              <DaySection
                key={entry.date.toISOString()}
                date={entry.date}
                meals={entry.meals}
                today={today}
                registerRow={registerRow}
              />
            );
          })
        )}
      </ScrollView>

      {showScrollDown ? (
        <Pressable
          onPress={scrollToBottom}
          accessibilityRole="button"
          accessibilityLabel="Scroll to latest"
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#F39C3D',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#0F172A',
            shadowOpacity: 0.18,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <ChevronDown size={24} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
