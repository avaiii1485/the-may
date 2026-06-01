import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export function OnPathArrow({ size = 28, color = '#FFFFFF' }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20 L12 5 M6 11 L12 5 L18 11"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function OffPathArrow({ size = 28, color = '#FFFFFF' }: Props): JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* A detour sweeping up and to the left, with a defined chevron head. */}
      <Path
        d="M18 20 C 16 12, 12 9, 6 5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M6 12 L6 5 L13 5"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
