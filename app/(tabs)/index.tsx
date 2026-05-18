import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCelebration } from '@/components/path/BadgeCelebration';
import { DaySection } from '@/components/path/DaySection';
import { EmptyDayPlaceholder } from '@/components/path/EmptyDayPlaceholder';
import { PathHeader } from '@/components/path/PathHeader';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { groupMealsByDay, withEmptyDays } from '@/lib/dayGroup';
import { startOfDay } from '@/lib/time';

export default function PathScreen(): JSX.Element {
  const { t } = useI18n();
  const { data: meals } = useMeals();
  const { goal } = useGoal();
  const today = startOfDay(new Date());

  // groupMealsByDay returns desc (newest first). Reverse so the timeline reads
  // oldest → newest from top to bottom of the scroll, with today at the bottom.
  const ascending = groupMealsByDay(meals).slice().reverse();
  const entries = withEmptyDays(ascending);

  const scrollRef = useRef<ScrollView>(null);

  // On every focus of the Path tab (and on mount), jump to the bottom so the
  // user lands on the most recent meal.
  useFocusEffect(
    useCallback(() => {
      const id = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      }, 80);
      return () => clearTimeout(id);
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <BadgeCelebration />
      <PathHeader goal={goal} />
      <ScrollView
        ref={scrollRef}
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
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
