import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  CENTER_X_PCT,
  GHOST_GRAY,
  LEFT_SPACER,
  OFF_PATH_X_PCT,
  ORANGE,
  SEGMENT_HEIGHT,
  TIME_COL_WIDTH,
} from './pathConstants';

interface Props {
  fromOnPath: boolean;
  toOnPath: boolean;
}

export function ConnectorRow({ fromOnPath, toOnPath }: Props): JSX.Element {
  const fromX = fromOnPath ? CENTER_X_PCT : OFF_PATH_X_PCT;
  const toX = toOnPath ? CENTER_X_PCT : OFF_PATH_X_PCT;
  const h = SEGMENT_HEIGHT;

  return (
    <View style={{ flexDirection: 'row', direction: 'ltr' }}>
      <View style={{ width: LEFT_SPACER }} />
      <View style={{ flex: 1 }}>
        <Svg
          width="100%"
          height={h}
          viewBox={`0 0 100 ${h}`}
          preserveAspectRatio="none"
        >
          {/* Gray ghost line straight down through the center */}
          <Path
            d={`M ${CENTER_X_PCT} 0 L ${CENTER_X_PCT} ${h}`}
            stroke={GHOST_GRAY}
            strokeWidth={1.5}
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
          {/* Orange actual route — curve between the two anchor x positions */}
          <Path
            d={`M ${fromX} 0 C ${fromX} ${h / 2}, ${toX} ${h / 2}, ${toX} ${h}`}
            stroke={ORANGE}
            strokeWidth={2}
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </Svg>
      </View>
      <View style={{ width: TIME_COL_WIDTH }} />
    </View>
  );
}
