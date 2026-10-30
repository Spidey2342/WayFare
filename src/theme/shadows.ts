import type { ViewStyle } from 'react-native';

export const shadows = {
  card: {
    shadowColor: '#1A1C2E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  soft: {
    shadowColor: '#1A1C2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  float: {
    shadowColor: '#1A1C2E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;
