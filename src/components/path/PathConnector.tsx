import { View } from 'react-native';
import Svg, { Defs, Marker, Path, Polygon } from 'react-native-svg';

interface ConnectorProps {
  fromOnPath: boolean;
  toOnPath: boolean;
  height?: number;
}

const ORANGE = '#F39C3D';

// A small connector segment between two meals on the timeline.
export function PathConnector({ fromOnPath, toOnPath, height = 64 }: ConnectorProps): JSX.Element {
  // X positions: 0.5 = center, 0.2 = left (off-path)
  const fromX = fromOnPath ? 50 : 22;
  const toX = toOnPath ? 50 : 22;
  return (
    <View style={{ width: '100%', height, alignItems: 'center' }} pointerEvents="none">
      <Svg width="100%" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
        <Path
          d={`M ${fromX} 0 C ${fromX} ${height / 2}, ${toX} ${height / 2}, ${toX} ${height}`}
          stroke={ORANGE}
          strokeWidth={2.5}
          fill="none"
        />
      </Svg>
    </View>
  );
}

interface ArrowEndProps {
  onPath: boolean;
}

// Final arrow head pointing down at the bottom of the timeline.
export function PathArrowEnd({ onPath }: ArrowEndProps): JSX.Element {
  const x = onPath ? 50 : 22;
  return (
    <View style={{ width: '100%', height: 48, alignItems: 'center' }} pointerEvents="none">
      <Svg width="100%" height={48} viewBox="0 0 100 48" preserveAspectRatio="none">
        <Defs>
          <Marker id="ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <Polygon points="0,0 10,5 0,10" fill={ORANGE} />
          </Marker>
        </Defs>
        <Path
          d={`M ${x} 0 L ${x} 36`}
          stroke={ORANGE}
          strokeWidth={2.5}
          fill="none"
          markerEnd="url(#ah)"
        />
      </Svg>
    </View>
  );
}
