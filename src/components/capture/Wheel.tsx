import { useEffect, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

export const ITEM_H = 40;
export const VISIBLE = 5;
const PAD = ITEM_H * Math.floor(VISIBLE / 2);
const LOOP_COPIES = 3; // rendered copies for the wrap-around illusion
const MID = Math.floor(LOOP_COPIES / 2);

// Haptic on each value change. Web uses navigator.vibrate; native uses
// expo-haptics, lazily required + guarded so the OTA bundle never crashes on a
// build that doesn't yet include the native module (haptics activate after the
// next rebuild).
function haptic(): void {
  if (Platform.OS === 'web') {
    try {
      (navigator as unknown as { vibrate?: (n: number) => void }).vibrate?.(4);
    } catch {
      /* no-op */
    }
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const H = require('expo-haptics');
    H.selectionAsync?.();
  } catch {
    /* native module not present yet */
  }
}

interface Props {
  data: string[];
  index: number;
  onIndexChange: (i: number) => void;
  loop?: boolean;
  width?: number;
  /** When set, tapping the column opens a numeric input; returns the new index. */
  parseInput?: (text: string) => number | null;
}

export function Wheel({ data, index, onIndexChange, loop = false, width = 64, parseInput }: Props): JSX.Element {
  const scrollRef = useRef<ScrollView>(null);
  const dragging = useRef(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTick = useRef(index);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const copies = loop ? LOOP_COPIES : 1;
  const base = loop ? MID * data.length : 0;
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
  }, [index, data.length]);

  const logicalAt = (y: number): number => {
    const raw = Math.round(y / ITEM_H);
    return ((raw % data.length) + data.length) % data.length;
  };

  const settle = (y: number) => {
    dragging.current = false;
    const logical = logicalAt(y);
    onIndexChange(logical);
    scrollToLogical(logical, false); // snap + recenter to the middle copy
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const logical = logicalAt(y);
    if (logical !== lastTick.current) {
      lastTick.current = logical;
      haptic();
    }
    // Cross-platform "scroll stopped" detection (web has no momentum event).
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => settle(y), 140);
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (stopTimer.current) clearTimeout(stopTimer.current);
    settle(e.nativeEvent.contentOffset.y);
  };

  const startEdit = () => {
    if (!parseInput) return;
    setText(data[index] ?? '');
    setEditing(true);
  };
  const commitEdit = () => {
    if (parseInput) {
      const next = parseInput(text);
      if (next !== null) onIndexChange(next);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <View style={{ width, height: VISIBLE * ITEM_H, justifyContent: 'center' }}>
        <TextInput
          autoFocus
          keyboardType="number-pad"
          value={text}
          onChangeText={setText}
          onBlur={commitEdit}
          onSubmitEditing={commitEdit}
          style={{ textAlign: 'center', fontSize: 24, fontWeight: '700', color: '#0F172A' }}
        />
      </View>
    );
  }

  return (
    <View style={{ width, height: VISIBLE * ITEM_H }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={Platform.OS === 'web' ? undefined : ITEM_H}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onScrollBeginDrag={() => {
          dragging.current = true;
        }}
        onMomentumScrollEnd={onMomentumEnd}
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {display.map((label, i) => {
          const logical = i % data.length;
          const selected = logical === index;
          return (
            <Pressable
              key={i}
              onPress={startEdit}
              style={{ height: ITEM_H, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text
                style={{
                  fontSize: selected ? 24 : 20,
                  fontWeight: selected ? '700' : '400',
                  color: selected ? '#0F172A' : '#94A3B8',
                }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
