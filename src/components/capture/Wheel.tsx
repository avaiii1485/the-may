import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';

export const ITEM_H = 30;
export const VISIBLE = 5;
const BUFFER = VISIBLE; // extra slots above/below for seamless recycling
const MOMENTUM = 6; // items glided per unit of release velocity

function mod(a: number, n: number): number {
  return ((a % n) + n) % n;
}

interface Props {
  data: string[];
  index: number;
  onIndexChange: (i: number) => void;
  loop?: boolean;
  width?: number;
}

// Gesture-driven wheel/drum. Uses PanResponder (NOT a ScrollView) so it claims
// the vertical drag itself — fixing the root problem that a ScrollView nested in
// the form's ScrollView couldn't scroll on Android. Pure JS → OTA-safe.
export function Wheel({ data, index, onIndexChange, loop = false, width = 56 }: Props): JSX.Element {
  const n = data.length;
  const pos = useRef(new Animated.Value(index)).current; // continuous position (in items)
  const posVal = useRef(index); // latest numeric pos
  const startPos = useRef(index); // pos at gesture start
  const gesturing = useRef(false);
  const animating = useRef(false);
  const [center, setCenter] = useState(Math.round(index));

  // Keep posVal + the rendered center in sync as pos changes.
  useEffect(() => {
    const id = pos.addListener(({ value }) => {
      posVal.current = value;
      const c = Math.round(value);
      setCenter((prev) => (prev === c ? prev : c));
    });
    return () => pos.removeListener(id);
  }, [pos]);

  // External value change → move the wheel (only when idle).
  useEffect(() => {
    if (gesturing.current || animating.current) return;
    if (Math.abs(posVal.current - index) < 0.001) return;
    pos.setValue(index);
    setCenter(Math.round(index));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const clampPos = (p: number): number => (loop ? p : Math.max(0, Math.min(n - 1, p)));

  const commit = (target: number) => {
    const t = clampPos(target);
    animating.current = true;
    Animated.timing(pos, { toValue: t, duration: 160, useNativeDriver: false }).start(() => {
      animating.current = false;
      const logical = mod(Math.round(t), n);
      if (loop) {
        pos.setValue(logical); // normalize so the numbers stay small (no visual jump)
        setCenter(logical);
      }
      onIndexChange(logical);
    });
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      // Claim the gesture on a vertical drag so the parent ScrollView can't take it.
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dy) > 2 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        gesturing.current = true;
        startPos.current = posVal.current;
        pos.stopAnimation((v) => {
          startPos.current = v;
        });
      },
      onPanResponderMove: (_e, g) => {
        pos.setValue(clampPos(startPos.current - g.dy / ITEM_H));
      },
      onPanResponderRelease: (_e, g) => {
        gesturing.current = false;
        const raw = startPos.current - g.dy / ITEM_H - g.vy * MOMENTUM;
        commit(Math.round(raw));
      },
      onPanResponderTerminate: () => {
        gesturing.current = false;
        commit(Math.round(posVal.current));
      },
    }),
  ).current;

  const centerTop = (VISIBLE * ITEM_H) / 2 - ITEM_H / 2;
  const slots: JSX.Element[] = [];
  for (let off = -BUFFER; off <= BUFFER; off++) {
    const k = center + off;
    const label = loop ? data[mod(k, n)] : k >= 0 && k < n ? data[k] : null;
    if (label == null) continue;
    const selected = k === center;
    const translateY = Animated.multiply(Animated.subtract(k, pos), ITEM_H);
    slots.push(
      <Animated.View
        key={k}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: centerTop,
          left: 0,
          right: 0,
          height: ITEM_H,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateY }],
        }}
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
      </Animated.View>,
    );
  }

  return (
    <View
      style={{ width, height: VISIBLE * ITEM_H, overflow: 'hidden' }}
      {...responder.panHandlers}
    >
      {slots}
    </View>
  );
}
