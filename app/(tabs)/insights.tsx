import { router } from 'expo-router';
import { CalendarDays, Clock, Lightbulb, Sparkles } from 'lucide-react-native';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
import { useInsights } from '@/hooks/useInsights';
import { useGoal } from '@/hooks/useProfile';
import { usePinnedInsightsStore } from '@/stores/pinnedInsightsStore';

interface CardDef {
  id: string;
  title: string;
  variant?: 'default' | 'highlight';
  leftAdornment?: ReactNode;
  content: ReactNode;
}

export default function InsightsScreen(): JSX.Element {
  const insights = useInsights();
  const { goal } = useGoal();
  const { data: allMeals } = useMeals();
  const pinned = usePinnedInsightsStore((s) => s.pinned);

  const topWhy = insights.whyEatSlices[0];
  const totalWhy = insights.whyEatSlices.reduce((s, x) => s + x.value, 0);
  const whyPct = totalWhy === 0 || !topWhy ? 0 : Math.round((topWhy.value / totalWhy) * 100);

  const topFeel = insights.feelingSlices[0];
  const totalFeel = insights.feelingSlices.reduce((s, x) => s + x.value, 0);
  const feelPct = totalFeel === 0 || !topFeel ? 0 : Math.round((topFeel.value / totalFeel) * 100);

  const cards: CardDef[] = [
    {
      id: 'top-insight',
      title: 'Your top insight',
      leftAdornment: <Sparkles size={14} color="#D6791F" />,
      content: <PatternCard meals={allMeals} />,
    },
    {
      id: 'fasting',
      title: 'Time since last meal',
      leftAdornment: <Clock size={14} color="#D6791F" />,
      content: <FastingCounter meals={allMeals} />,
    },
    {
      id: 'todays-experiment',
      title: "Today's experiment",
      variant: 'highlight',
      leftAdornment: <Lightbulb size={14} color="#D6791F" />,
      content: <TodaysExperiment meals={allMeals} />,
    },
    {
      id: 'last-12-weeks',
      title: 'Last 12 weeks',
      content: (
        <>
          <Text className="text-ink-soft text-xs mb-3">
            Each square is a day, coloured by how on-path you were. Tap a day to open its recap.
          </Text>
          <CalendarHeatmap meals={allMeals} />
        </>
      ),
    },
    {
      id: 'on-path',
      title: 'On-path towards my goal',
      content: (
        <>
          <Text className="text-ink text-3xl font-bold mb-3">
            {Math.round(insights.onPathPct)}%
          </Text>
          <ProgressBar pct={insights.onPathPct} />
        </>
      ),
    },
    {
      id: 'week-vs-week',
      title: 'This week vs last week',
      content: <WeekDelta meals={allMeals} />,
    },
    {
      id: 'where',
      title: 'Where you eat',
      content: (
        <SplitBarCard
          title="Where you eat"
          emptyHint="Tell Capture where you ate and your places will show here."
          extract={(m) => m.whereEat}
          meals={allMeals}
        />
      ),
    },
    {
      id: 'who',
      title: 'Who you eat with',
      content: (
        <SplitBarCard
          title="Who you eat with"
          emptyHint="Pick who you were with on Capture to see your meal company patterns."
          extract={(m) => m.ateWith}
          meals={allMeals}
        />
      ),
    },
    {
      id: 'mood-source',
      title: 'How meals make you feel',
      content: <MoodBySourceCard meals={allMeals} />,
    },
  ];

  if (insights.whyEatSlices.length > 0) {
    cards.push({
      id: 'why',
      title: 'Why did I eat?',
      content: (
        <View className="flex-row items-center">
          <View className="flex-1">
            {insights.whyEatSlices.map((s) => (
              <View key={s.label} className="flex-row items-center mb-2">
                <View
                  style={{ backgroundColor: s.color, width: 10, height: 10, borderRadius: 5 }}
                />
                <Text className="text-ink ml-2">{s.label}</Text>
              </View>
            ))}
          </View>
          <DonutChart
            slices={insights.whyEatSlices}
            centerTopLabel={`${whyPct}%`}
            centerBottomLabel={topWhy?.label}
          />
        </View>
      ),
    });
  }

  if (insights.feelingSlices.length > 0) {
    cards.push({
      id: 'feeling',
      title: 'How am I feeling?',
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

  // Pinned first (in pin order — most recently pinned at the very top),
  // then everything else in its natural order.
  const pinnedCards = pinned
    .map((pid) => cards.find((c) => c.id === pid))
    .filter((c): c is CardDef => Boolean(c));
  const restCards = cards.filter((c) => !pinned.includes(c.id));
  const ordered = [...pinnedCards, ...restCards];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center pt-8 pb-4 px-6">
          <Text className="text-ink-mute text-xs uppercase tracking-widest">My lifestyle goal</Text>
          <Text className="text-ink text-xl font-bold mt-1 text-center">{goal}</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            className="mt-4 px-6 py-2 rounded-full border border-bubble-active flex-row items-center justify-center"
            style={{ width: 240 }}
            accessibilityRole="button"
            accessibilityLabel="Try an experiment — choose a focus"
          >
            <Text className="text-bubble-active font-bold text-sm tracking-widest">
              TRY AN EXPERIMENT
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/week-recap')}
            className="mt-3 px-6 py-2 rounded-full bg-bubble-active flex-row items-center justify-center"
            style={{ width: 240 }}
            accessibilityRole="button"
            accessibilityLabel="Open weekly recap"
          >
            <CalendarDays size={16} color="#FFFFFF" />
            <Text className="text-white font-bold text-sm tracking-widest ml-2">WEEKLY RECAP</Text>
          </Pressable>
        </View>

        <View className="px-4">
          {ordered.map((c) => (
            <CollapsibleCard
              key={c.id}
              id={c.id}
              title={c.title}
              variant={c.variant}
              leftAdornment={c.leftAdornment}
            >
              {c.content}
            </CollapsibleCard>
          ))}

          {insights.weekMealCount === 0 ? (
            <View className="items-center py-12">
              <Text className="text-ink-soft text-center px-8">
                Log a few meals from the Capture tab to see your patterns here.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
