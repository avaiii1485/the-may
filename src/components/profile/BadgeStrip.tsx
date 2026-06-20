import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { BadgeIcon } from './BadgeIcon';
import { useI18n } from '@/i18n';
import type { ResolvedBadge } from '@/lib/badges';
import { useThemeStore } from '@/stores/themeStore';

interface Props {
  badges: ResolvedBadge[];
}

export function BadgeStrip({ badges }: Props): JSX.Element {
  const { t, d } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const earnedCount = badges.filter((b) => b.progress.earned).length;
  // Order: earned first (newest by id position), then locked sorted by progress desc.
  const sorted = [...badges].sort((a, b) => {
    if (a.progress.earned !== b.progress.earned) return a.progress.earned ? -1 : 1;
    return b.progress.ratio - a.progress.ratio;
  });

  return (
    <Pressable
      onPress={() => router.push('/badges')}
      accessibilityRole="button"
      accessibilityLabel={t('badges.title')}
    >
      <View className="flex-row items-center justify-between px-5 pt-5 pb-2">
        <Text className="text-xs uppercase tracking-widest text-ink-mute">
          {t('profile.badges')}
        </Text>
        <View className="flex-row items-center">
          <Text className="text-ink-soft text-sm font-bold mr-1">
            {d(earnedCount)} {t('badges.of')} {d(badges.length)}
          </Text>
          <ChevronRight size={16} color={dark ? '#8A7860' : '#94A3B8'} />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 8, paddingBottom: 16 }}
      >
        {sorted.map((b) => (
          <View key={b.def.id} style={{ marginRight: 10 }}>
            <BadgeIcon
              emoji={b.def.emoji}
              color={b.def.color}
              earned={b.progress.earned}
              size={52}
            />
          </View>
        ))}
      </ScrollView>
    </Pressable>
  );
}
