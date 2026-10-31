import Svg, { Circle, Path } from 'react-native-svg';

import { palette } from '@/theme';

export type ReactionGlyphName = 'Praying' | 'Praise' | 'Encouraged' | 'Amen';

export function ReactionIcon({ name, size = 16 }: { name: ReactionGlyphName; size?: number }) {
  const color = palette.midnight;
  switch (name) {
    case 'Praying':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M8 10V6a2 2 0 1 1 4 0v4M6 12h12v2a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-2z"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'Praise':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3v4M8 7l-2-2M16 7l2-2M6 13l-3 1M18 13l3 1M12 21V11"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
          />
          <Circle cx={12} cy={11} r={3} stroke={color} strokeWidth={1.8} />
        </Svg>
      );
    case 'Encouraged':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 12h4l2 5 4-14 2 6h4"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'Amen':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 8c0-2 2-3 5-3s5 1 5 3-2 3-5 3H9v6"
            stroke={color}
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}
