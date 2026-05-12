import { Text, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

export interface BarDatum {
  label: string;
  value: number;
}

interface Props {
  data: BarDatum[];
  highlightIndex?: number;
  maxY: number;
  unit: string;
  color?: string;
  highlightColor?: string;
  height?: number;
}

export function BarChart({
  data,
  highlightIndex,
  maxY,
  unit,
  color = '#7DD3FC',
  highlightColor = '#0EA5E9',
  height = 160,
}: Props): JSX.Element {
  const w = 320;
  const padTop = 16;
  const padBottom = 24;
  const innerH = height - padTop - padBottom;
  const slot = w / data.length;
  const barW = slot * 0.45;

  return (
    <View>
      <View className="flex-row justify-between pl-2 pr-2 mb-1">
        <View>
          <Text className="text-xs text-ink-mute">{maxY} {unit}</Text>
          <Text className="text-xs text-ink-mute mt-2">{Math.round(maxY / 2)} {unit}</Text>
          <Text className="text-xs text-ink-mute mt-2">0 {unit}</Text>
        </View>
        <Svg width={w} height={height}>
          {data.map((d, i) => {
            const h = (Math.min(d.value, maxY) / maxY) * innerH;
            const x = i * slot + slot / 2 - barW / 2;
            const y = padTop + (innerH - h);
            const fill = highlightIndex === i ? highlightColor : color;
            return (
              <Rect
                key={d.label}
                x={x}
                y={y}
                width={barW}
                height={h}
                fill={fill}
                rx={4}
              />
            );
          })}
        </Svg>
      </View>
      <View className="flex-row" style={{ paddingLeft: 64 }}>
        {data.map((d, i) => (
          <View key={d.label} style={{ width: w / data.length }} className="items-center">
            <Text
              className={`text-xs ${
                highlightIndex === i ? 'text-bubble-active font-bold' : 'text-ink-mute'
              }`}
            >
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
