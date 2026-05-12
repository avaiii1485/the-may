import { Image, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

interface Props {
  uri?: string | null;
  /** kept for API compatibility; ignored now that the fallback is a silhouette */
  name?: string;
  handle?: string;
  size?: number;
  bg?: string;
  fg?: string;
}

export function Avatar({
  uri,
  size = 40,
  bg = '#F39C3D',
  fg = '#FFFFFF',
}: Props): JSX.Element {
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }
  // No avatar: render a white "shadow figure" silhouette on the orange background.
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {/* Head */}
        <Circle cx={50} cy={38} r={17} fill={fg} />
        {/* Shoulders — wide ellipse anchored below the circle so its top edge
            looks like rounded shoulders inside the avatar circle. */}
        <Ellipse cx={50} cy={104} rx={34} ry={26} fill={fg} />
      </Svg>
    </View>
  );
}
