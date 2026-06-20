import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

interface Props {
  on: boolean; // false = knob left, true = knob right
  onToggle: () => void;
  width?: number;
  height?: number;
  trackColor?: string;
  knobColor?: string;
  /** Rendered inside the sliding knob (e.g. a check, or a sun/moon icon). */
  knobContent?: React.ReactNode;
  /** Rendered on the side opposite the knob (e.g. the current value's label). */
  sideContent?: React.ReactNode;
  accessibilityLabel?: string;
}

const PAD = 4;

// A binary slide switch: tapping flips it, the knob animates to the active side,
// and `sideContent` is shown on the opposite side (so "what you're on" reads in
// the empty half). Uses physical left/translateX so it doesn't mirror in RTL.
export function SlideToggle({
  on,
  onToggle,
  width = 132,
  height = 44,
  trackColor = '#E7DCCB',
  knobColor = '#7FA37B',
  knobContent,
  sideContent,
  accessibilityLabel,
}: Props): JSX.Element {
  const knobSize = height - PAD * 2;
  const travel = width - knobSize - PAD * 2;
  const x = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(x, { toValue: on ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [on, x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [PAD, PAD + travel] });

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={accessibilityLabel}
      style={{ width, height, borderRadius: height / 2, backgroundColor: trackColor }}
    >
      {/* Current value sits in the half opposite the knob. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: on ? PAD : knobSize + PAD,
          right: on ? knobSize + PAD : PAD,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {sideContent}
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          top: PAD,
          left: 0,
          width: knobSize,
          height: knobSize,
          borderRadius: knobSize / 2,
          backgroundColor: knobColor,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ translateX }],
          shadowColor: '#0F172A',
          shadowOpacity: 0.18,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 2,
        }}
      >
        {knobContent}
      </Animated.View>
    </Pressable>
  );
}
