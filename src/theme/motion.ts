import { Easing } from 'react-native-reanimated';

export const duration = {
  fast: 160,
  normal: 280,
  slow: 480,
  timer: 1000,
} as const;

export const easing = {
  standard: Easing.bezier(0.2, 0.8, 0.2, 1),
  enter: Easing.out(Easing.cubic),
  exit: Easing.in(Easing.cubic),
};

export const spring = {
  gentle: { damping: 18, stiffness: 180, mass: 0.8 },
  snappy: { damping: 16, stiffness: 260, mass: 0.6 },
  dice: { damping: 12, stiffness: 140, mass: 0.9 },
} as const;
