import { router } from 'expo-router';
import { CalendarDays, Clock, Lightbulb, Sparkles } from 'lucide-react-native';
import { useCallback, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import { CalendarHeatmap } from '@/components/insights/CalendarHeatmap';
import { DonutChart } from '@/components/insights/DonutChart';
import { FastingCounter } from '@/components/insights/FastingCounter';
import { MoodBySourceCard } from '@/components/insights/MoodBySourceCard';
import { PatternCard } from '@/components/insights/PatternCard';
import { ProgressBar } from '@/components/insights/ProgressBar';
import { SplitBarCard } from '@/components/insights/SplitBarCard';
import { TodaysExperiment } from '@/components/insights/TodaysExperiment';
import { WeekDelta } from '@/components/insights/WeekDelta';
import { useMeals } from '@/hooks/useMeals';
import { useI18n } from '@/i18n';
import { useInsights } from '@/hooks/useInsights';
import { useGoal } from '@/hooks/useProfile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { triggerSync } from '@/lib/sync';
import { usePinnedInsightsStore } from '@/stores/pinnedInsightsStore';

interface CardDef {
  id: string;
  title: string;
  variant?: 'default' | 'highlight';
  leftAdornment?: ReactNode;
  content: ReactNode;
}

export default function InsightsScreen(): JSX.Element {
  const { t, tv, d } = useI18n();
  const insights = useInsights();
  const { goal } = useGoal();
  const { data: allMeals } = useMeals();
  const pinned = usePinnedInsightsStore((s) => s.pinned);
  const savedOrder = usePinnedInsightsStore((s) => s.order);
  const setOrder = usePinnedInsightsStore((s) => s.setOrder);

  const topWhy = insights.whyEatSlices[0];
  const totalWhy = insights.whyEatSlices.reduce((s, x) => s + x.value, 0);
  const whyPct = totalWhy === 0 || !topWhy ? 0 : Math.round((topWhy.value / totalWhy) * 100);

  const topFeel = insights.feelingSlices[0];
  const totalFeel = insights.feelingSlices.reduce((s, x) => s + x.value, 0);
  const feelPct = totalFeel === 0 || !topFeel ? 0 : Math.round((topFeel.value / totalFeel) * 100);

  const cards: CardDef[] = [
    {
      id: 'top-insight',
      title: t('ins.topInsight'),
      leftAdornment: <Sparkles size={14} color="#D6791F" />,
      content: <PatternCard meals={allMeals} />,
    },
    {
      id: 'fasting',
      title: t('ins.fasting'),
      leftAdornment: <Clock size={14} color="#D6791F" />,
      content: <FastingCounter meals={allMeals} />,
    },
    {
      id: 'todays-experiment',
      title: t('ins.todaysExperiment'),
      variant: 'highlight',
      leftAdornment: <Lightbulb size={14} color="#D6791F" />,
      content: <TodaysExperiment meals={allMeals} />,
    },
    {
      id: 'last-12-weeks',
      title: t('ins.last12'),
      content: (
        <>
          <Text className="text-ink-soft text-xs mb-3">{t('ins.last12Hint')}</Text>
          <CalendarHeatmap meals={allMeals} />
        </>
      ),
    },
    {
      id: 'on-path',
      title: t('ins.onPathGoal'),
      content: (
        <>
          <Text className="text-ink text-3xl font-bold mb-3">
            {d(Math.round(insights.onPathPct))}%
          </Text>
          <ProgressBar pct={insights.onPathPct} />
        </>
      ),
    },
    {
      id: 'week-vs-week',
      title: t('ins.weekVsWeek'),
      content: <WeekDelta meals={allMeals} />,
    },
    {
      id: 'where',
      title: t('ins.where'),
      content: (
        <SplitBarCard
          emptyHint={t('ins.where')}
          extract={(m) => m.whereEat}
          meals={allMeals}
        />
      ),
    },
    {
      id: 'who',
      title: t('ins.who'),
      content: (
        <SplitBarCard
          emptyHint={t('ins.who')}
          extract={(m) => m.ateWith}
          meals={allMeals}
        />
      ),
    },
    {
      id: 'mood-source',
      title: t('ins.moodSource'),
      content: <MoodBySourceCard meals={allMeals} />,
    },
  ];

  if (insights.whyEatSlices.length > 0) {
    cards.push({
      id: 'why',
      title: t('ins.why'),
      content: (
        <View className="flex-row items-center">
          <View className="flex-1">
            {insights.whyEatSlices.map((s) => (
              <View key={s.label} className="flex-row items-center mb-2">
                <View
                  style={{ backgroundColor: s.color, width: 10, height: 10, borderRadius: 5 }}
                />
                <Text className="text-ink ml-2">{tv('opt', s.label)}</Text>
              </View>
            ))}
          </View>
          <DonutChart
            slices={insights.whyEatSlices}
            centerTopLabel={`${whyPct}%`}
            centerBottomLabel={topWhy ? tv('opt', topWhy.label) : undefined}
          />
        </View>
      ),
    });
  }

  if (insights.feelingSlices.length > 0) {
    cards.push({
      id: 'feeling',
      title: t('ins.feeling'),
      content: (
        <View className="flex-row items-center">
          <View className="flex-1">
            {insights.feelingSlices.map((s) => (
              <View key={s.label} className="flex-row items-center mb-2">
                <View
                  style={{ backgroundColor: s.color, width: 10, height: 10, borderRadius: 5 }}
                />
                <Text className="text-ink ml-2 text-lg">{s.label}</Text>
              </View>
            ))}
          </View>
          <DonutChart
            slices={insights.feelingSlices}
            centerTopLabel={`${feelPct}%`}
            centerBottomLabel={topFeel?.label}
            centerColor="#F25C8B"
          />
        </View>
      ),
    });
  }

  // Effective display order: the user's saved drag order when present (with any
  // cards missing from it — new/conditional ones — appended), otherwise the
  // natural pinned-first order.
  const naturalOrder = [
    ...pinned.map((pid) => cards.find((c) => c.id === pid)).filter((c): c is CardDef => Boolean(c)),
    ...cards.filter((c) => !pinned.includes(c.id)),
  ];
  const items: CardDef[] =
    savedOrder.length > 0
      ? [
          ...savedOrder.map((oid) => cards.find((c) => c.id === oid)).filter((c): c is CardDef => Boolean(c)),
          ...cards.filter((c) => !savedOrder.includes(c.id)),
        ]
      : naturalOrder;

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<CardDef>) => (
      <ScaleDecorator>
        <View className="px-4" style={{ opacity: isActive ? 0.9 : 1 }}>
          <CollapsibleCard
            id={item.id}
            title={item.title}
            variant={item.variant}
            leftAdornment={item.leftAdornment}
            onLongPress={drag}
          >
            {item.content}
          </CollapsibleCard>
        </View>
      </ScaleDecorator>
    ),
    [],
  );

  const Header = (
    <View className="items-center pt-8 pb-4 px-6">
      <Text className="text-ink-mute text-xs uppercase tracking-widest">{t('ins.myGoal')}</Text>
      <Text className="text-ink text-xl font-bold mt-1 text-center">{tv('focus', goal)}</Text>
      <Pressable
        onPress={() => router.push('/settings')}
        className="mt-4 px-6 py-2 rounded-full border border-bubble-active flex-row items-center justify-center"
        style={{ width: 240 }}
        accessibilityRole="button"
        accessibilityLabel={t('ins.tryExperiment')}
      >
        <Text className="text-bubble-active font-bold text-sm tracking-widest">
          {t('ins.tryExperiment')}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => router.push('/week-recap')}
        className="mt-3 px-6 py-2 rounded-full bg-bubble-active flex-row items-center justify-center"
        style={{ width: 240 }}
        accessibilityRole="button"
        accessibilityLabel={t('ins.weeklyRecap')}
      >
        <CalendarDays size={16} color="#FFFFFF" />
        <Text className="text-white font-bold text-sm tracking-widest ml-2">
          {t('ins.weeklyRecap')}
        </Text>
      </Pressable>
    </View>
  );

  const Footer =
    insights.weekMealCount === 0 ? (
      <View className="items-center py-12">
        <Text className="text-ink-soft text-center px-8">{t('ins.emptyPatterns')}</Text>
      </View>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onDragEnd={({ data }) => {
          setOrder(data.map((c) => c.id));
          if (isSupabaseConfigured) triggerSync();
        }}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </SafeAreaView>
  );
}
