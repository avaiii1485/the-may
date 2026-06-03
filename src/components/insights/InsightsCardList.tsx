import { ScrollView, View } from 'react-native';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import type { InsightsCardListProps } from './insightCard';

// Native: a plain ordered list. We intentionally do NOT use
// react-native-draggable-flatlist here — it relies on Reanimated worklets, and
// this project builds with the Reanimated babel plugin disabled
// (babel.config.js `reanimated: false`), which made worklets crash the app when
// the Insights tab opened. Cards still render in the user's saved order (set via
// drag on web). Restoring native drag would require enabling Reanimated + an
// APK rebuild.
export function InsightsCardList({ items, header, footer }: InsightsCardListProps): JSX.Element {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {header}
      <View className="px-4">
        {items.map((item) => (
          <CollapsibleCard
            key={item.id}
            id={item.id}
            title={item.title}
            variant={item.variant}
            leftAdornment={item.leftAdornment}
          >
            {item.content}
          </CollapsibleCard>
        ))}
      </View>
      {footer}
    </ScrollView>
  );
}
