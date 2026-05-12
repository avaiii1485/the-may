import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface Props {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTopLabel?: string;
  centerBottomLabel?: string;
  centerColor?: string;
}

export function DonutChart({
  slices,
  size = 180,
  thickness = 22,
  centerTopLabel,
  centerBottomLabel,
  centerColor = '#1FB6E5',
}: Props): JSX.Element {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  let offset = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {slices.map((s) => {
            const len = (s.value / total) * circumference;
            const dash = `${len} ${circumference - len}`;
            const node = (
              <Circle
                key={s.label}
                cx={cx}
                cy={cy}
                r={radius}
                stroke={s.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return node;
          })}
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {centerTopLabel ? (
          <Text style={{ color: centerColor, fontSize: 28, fontWeight: '800' }}>
            {centerTopLabel}
          </Text>
        ) : null}
        {centerBottomLabel ? (
          <Text style={{ color: centerColor, fontSize: 14 }}>{centerBottomLabel}</Text>
        ) : null}
      </View>
    </View>
  );
}
