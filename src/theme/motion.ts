import { Platform } from 'react-native';

export const duration = {
  screen: 220,
  sheet: 280,
  stagger: 40,
  pressIn: 80,
  pressOut: 120,
} as const;

export const easing = {
  standard: 'ease-out' as const,
};

export const spring = {
  press: { damping: 18, stiffness: 320, mass: 0.8 },
  sheet: { damping: 22, stiffness: 280, mass: 0.9 },
  flip: { damping: 16, stiffness: 260, mass: 1 },
} as const;

export const motion = {
  duration,
  easing,
  spring,
  scale: {
    pressed: 0.97,
  },
} as const;

export function lightTap() {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(8);
  }
}
