import Svg, { Path } from 'react-native-svg';

export function DoveIcon({
  color,
  size = 22,
  strokeWidth = 2,
}: {
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12c2-4 6-7 11-7 1 3-1 6-3 8 2 0 4-1 6-3-1 3-4 5-7 5-3 0-5-1-7-3z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 10c1.5-2 3.5-3 6-3"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}
