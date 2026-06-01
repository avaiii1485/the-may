import { useCallback } from 'react';
import { View } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import type { InsightCard, InsightsCardListProps } from './insightCard';

// Native (iOS/Android): long-press a card title to drag-reorder; tap still
// expands. Web uses a separate HTML5 implementation (.web.tsx) because
// draggable-flatlist's reanimated scroll handler crashes under react-native-web.
export function InsightsCardList({
  items,
  header,
  footer,
  onReorder,
}: InsightsCardListProps): JSX.Element {
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<InsightCard>) => (
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

  return (
    <DraggableFlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      onDragEnd={({ data }) => onReorder(data.map((c) => c.id))}
      ListHeaderComponent={header as React.ComponentProps<typeof DraggableFlatList>['ListHeaderComponent']}
      ListFooterComponent={footer as React.ComponentProps<typeof DraggableFlatList>['ListFooterComponent']}
      contentContainerStyle={{ paddingBottom: 40 }}
    />
  );
}
