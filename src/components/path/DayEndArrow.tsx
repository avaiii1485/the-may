import { View } from 'react-native';
import Svg, { Defs, Marker, Path, Polygon } from 'react-native-svg';
import { CENTER_X_PCT, LEFT_SPACER, ORANGE, TIME_COL_WIDTH } from './pathConstants';

interface Props {
  fromOnPath: boolean;
}

const HEIGHT = 56;

// Final arrow head pointing down at the bottom of the day's path.
export function DayEndArrow({ fromOnPath }: Props): JSX.Element {
  const startX = fromOnPath ? CENTER_X_PCT : 22;
  return (
    <View style={{ flexDirection: 'row', direction: 'ltr' }}>
      <View style={{ width: LEFT_SPACER }} />
      <View style={{ flex: 1 }}>
        <Svg width="100%" height={HEIGHT} viewBox={`0 0 100 ${HEIGHT}`} preserveAspectRatio="none">
          <Defs>
            <Marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <Polygon points="0,0 10,5 0,10" fill={ORANGE} />
            </Marker>
          </Defs>
          {/* Curve back toward center if leaving off-path, else straight down */}
          <Path
            d={`M ${startX} 0 C ${startX} ${HEIGHT * 0.45}, ${CENTER_X_PCT} ${HEIGHT * 0.55}, ${CENTER_X_PCT} ${HEIGHT - 8}`}
            stroke={ORANGE}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
            markerEnd="url(#arrow)"
          />
        </Svg>
      </View>
      <View style={{ width: TIME_COL_WIDTH }} />
    </View>
  );
}
