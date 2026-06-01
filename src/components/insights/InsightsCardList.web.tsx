import { createElement, useState, type DragEvent } from 'react';
import { ScrollView, View } from 'react-native';
import { CollapsibleCard } from '@/components/common/CollapsibleCard';
import type { InsightsCardListProps } from './insightCard';

// Web: native HTML5 drag-and-drop (no reanimated — draggable-flatlist's animated
// scroll handler crashes under react-native-web). Press a card and drag it onto
// another to reorder; clicking still expands.
export function InsightsCardList({
  items,
  header,
  footer,
  onReorder,
}: InsightsCardListProps): JSX.Element {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const move = (from: number, to: number): void => {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    onReorder(next.map((c) => c.id));
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      {header}
      <View className="px-4">
        {items.map((item, idx) =>
          createElement(
            'div',
            {
              key: item.id,
              draggable: true,
              onDragStart: () => setDragIndex(idx),
              onDragOver: (e: DragEvent) => {
                e.preventDefault();
                if (overIndex !== idx) setOverIndex(idx);
              },
              onDrop: (e: DragEvent) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, idx);
                setDragIndex(null);
                setOverIndex(null);
              },
              onDragEnd: () => {
                setDragIndex(null);
                setOverIndex(null);
              },
              style: {
                cursor: 'grab',
                opacity: dragIndex === idx ? 0.5 : 1,
                outline: overIndex === idx && dragIndex !== idx ? '2px dashed #F39C3D' : 'none',
                outlineOffset: 2,
                borderRadius: 16,
              },
            },
            <CollapsibleCard
              id={item.id}
              title={item.title}
              variant={item.variant}
              leftAdornment={item.leftAdornment}
            >
              {item.content}
            </CollapsibleCard>,
          ),
        )}
      </View>
      {footer}
    </ScrollView>
  );
}
