import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { FEELING_EMOJI, type FeelingLevel, type Meal } from '@/types/meal';

interface Props {
  meals: Meal[];
}

interface SourceStat {
  source: string;
  count: number;
  avgFeeling: number | null;
  topAfter: string | null;
  topAfterPct: number;
  topAfterIsPositive: boolean;
}

const POSITIVE_AFTER: ReadonlySet<string> = new Set(['Satisfied', 'Happy']);
const NEGATIVE_AFTER: ReadonlySet<string> = new Set([
  'Still hungry',
  'Stuffed',
  'Guilty',
  'Unsatisfied',
  'Sick',
]);

function classify(tag: string): 'positive' | 'negative' | 'neutral' {
  if (POSITIVE_AFTER.has(tag)) return 'positive';
  if (NEGATIVE_AFTER.has(tag)) return 'negative';
  return 'neutral';
}

function aggregate(meals: Meal[]): SourceStat[] {
  const groups = new Map<string, Meal[]>();
  for (const m of meals) {
    if (!m.howMade) continue;
    const arr = groups.get(m.howMade) ?? [];
    arr.push(m);
    groups.set(m.howMade, arr);
  }

  const out: SourceStat[] = [];
  for (const [source, arr] of groups) {
    const feelings = arr
      .map((m) => m.feeling)
      .filter((f): f is FeelingLevel => f !== null);
    const avgFeeling =
      feelings.length === 0 ? null : feelings.reduce((s, f) => s + f, 0) / feelings.length;

    const afterCounts = new Map<string, number>();
    for (const m of arr) {
      for (const f of m.madeMeFeel) afterCounts.set(f, (afterCounts.get(f) ?? 0) + 1);
    }
    let topAfter: string | null = null;
    let topAfterCount = 0;
    let totalAfter = 0;
    for (const [k, v] of afterCounts) {
      totalAfter += v;
      if (v > topAfterCount) {
        topAfter = k;
        topAfterCount = v;
      }
    }
    const topAfterPct = totalAfter === 0 ? 0 : Math.round((topAfterCount / totalAfter) * 100);
    const topAfterIsPositive = topAfter ? classify(topAfter) === 'positive' : false;

    out.push({
      source,
      count: arr.length,
      avgFeeling,
      topAfter,
      topAfterPct,
      topAfterIsPositive,
    });
  }
  return out.sort((a, b) => b.count - a.count);
}

function avgEmoji(avg: number): string {
  const idx = Math.max(0, Math.min(4, Math.round(avg))) as FeelingLevel;
  return FEELING_EMOJI[idx] ?? '🙂';
}

export function MoodBySourceCard({ meals }: Props): JSX.Element {
  const { t, tv, d } = useI18n();
  const stats = useMemo(() => aggregate(meals), [meals]);
  const maxCount = stats.reduce((m, s) => Math.max(m, s.count), 0);

  return (
    <View>
      <Text className="text-ink-soft text-xs mb-3">{t('ins.groupedByMade')}</Text>

      {stats.length === 0 ? (
        <Text className="text-ink-soft text-sm">{t('ins.moodSource')}</Text>
      ) : (
        stats.map((s) => {
          const widthPct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
          const afterColor = s.topAfter
            ? classify(s.topAfter) === 'positive'
              ? '#34C9A2'
              : classify(s.topAfter) === 'negative'
                ? '#F25C8B'
                : '#94A3B8'
            : '#94A3B8';
          return (
            <View key={s.source} className="mb-4">
              <View className="flex-row justify-between mb-1">
                <Text className="text-ink text-sm font-bold">{tv('opt', s.source)}</Text>
                <Text className="text-ink-mute text-xs">
                  {d(s.count)} {s.count === 1 ? t('path.meal') : t('path.meals')}
                </Text>
              </View>
              <View
                style={{
                  width: `${widthPct}%`,
                  minWidth: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#F39C3D',
                  marginBottom: 6,
                }}
              />
              <View className="flex-row items-center">
                {s.avgFeeling !== null ? (
                  <>
                    <Text className="text-xl mr-1">{avgEmoji(s.avgFeeling)}</Text>
                    <Text className="text-ink-soft text-xs mr-3">
                      {d(s.avgFeeling.toFixed(1))} {t('ins.avg')}
                    </Text>
                  </>
                ) : (
                  <Text className="text-ink-mute text-xs mr-3">{t('ins.noMoodData')}</Text>
                )}
                {s.topAfter ? (
                  <Text className="text-xs flex-1" numberOfLines={1}>
                    <Text className="text-ink-mute">{t('ins.after')} </Text>
                    <Text style={{ color: afterColor, fontWeight: '700' }}>
                      {tv('opt', s.topAfter)}
                    </Text>
                    <Text className="text-ink-mute"> ({d(s.topAfterPct)}%)</Text>
                  </Text>
                ) : (
                  <Text className="text-ink-mute text-xs">{t('ins.noAfterFeel')}</Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
