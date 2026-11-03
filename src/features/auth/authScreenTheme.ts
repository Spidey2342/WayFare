import { palette } from '@/theme';

/** AUTH_LOOK from Debate V2 prompt — dark account chrome. */
export const AUTH_LOOK = 'dark' as const;

export const authScreen = {
  bg: palette.midnightDeep,
  card: palette.midnightRaised,
  border: '#2E3348',
  text: palette.white,
  muted: '#9CA3AF',
  gold: palette.gold,
  error: palette.coral,
  inputBg: '#141824',
} as const;
