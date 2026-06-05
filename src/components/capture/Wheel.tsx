import { useEffect, useRef } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';

export const ITEM_H = 30;
export const VISIBLE = 5;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);
const LOOP_COPIES = 5; // repeated copies create the wrap-around illusion
const MID = Math.floor(LOOP_COPIES / 2);

interface Props {
  data: string[];
  index: number;
  onIndexChange: (i: number) => void;
  loop?: boolean;
  width?: number;
}

// Pure-JS wheel/drum column built on a snapping ScrollView. `nestedScrollEnabled`
// lets it scroll inside the form's outer ScrollView. Value commits only when
// scrolling fully stops (never mid-drag), so the displayed value can't glitch.
export function Wheel({ data, index, onIndexChange, loop = false, width = 56 }: Props): JSX.Element {
  const scrollRef = useRef<ScrollView>(null);
  const dragging = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const n = data.length;
  const copies = loop ? LOOP_COPIES : 1;
  const base = loop ? MID * n : 0;
  const display: string[] = [];
  for (let c = 0; c < copies; c++) display.push(...data);

  const scrollToLogical = (logical: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ y: (base + logical) * ITEM_H, animated });
  };

  // Position on mount and when the value changes from outside (not mid-drag).
  useEffect(() => {
    if (dragging.current) return;
    const id = setTimeout(() => scrollToLogical(index, false), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, n]);

  const logicalAt = (y: number): number => {
    const raw = Math.round(y / ITEM_H);
    return ((raw % n) + n) % n;
  };

  const settle = (y: number) => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current);
      stopTimer.current = null;
    }
    const logical = logicalAt(y);
    onIndexChange(logical);
    scrollToLogical(logical, false); // snap + recenter to the middle copy
  };

  // Settle once scrolling has fully stopped — and never while a finger is down.
  const scheduleSettle = (y: number) => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      if (!dragging.current) settle(y);
    }, 160);
  };

  return (
    <View style={{ width, height: VISIBLE * ITEM_H }}>
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={Platform.OS === 'web' ? undefined : ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
          scheduleSettle(e.nativeEvent.contentOffset.y)
        }
        onScrollBeginDrag={() => {
          dragging.current = true;
          if (stopTimer.current) clearTimeout(stopTimer.current);
        }}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          dragging.current = false;
          scheduleSettle(e.nativeEvent.contentOffset.y);
        }}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
          settle(e.nativeEvent.contentOffset.y)
        }
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {display.map((label, i) => {
          const selected = i % n === index;
          return (
            <View
              key={i}
              style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text
                style={{
                  fontSize: selected ? 17 : 14,
                  fontWeight: selected ? '700' : '400',
                  color: selected ? '#0F172A' : '#94A3B8',
                }}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
