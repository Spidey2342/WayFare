import { palette } from './palette';

export type ThemeMode = 'light' | 'dark';
export type ThemePreference = ThemeMode | 'system';

export interface SemanticColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceDark: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  textMuted: string;
  border: string;
  accent: string;
  accentDark: string;
  primary: string;
  primaryText: string;
  overlay: string;
  nav: string;
  shadow: string;
  danger: string;
  success: string;
}

export const lightColors: SemanticColors = {
  background: palette.canvas,
  surface: palette.white,
  surfaceAlt: palette.offWhite,
  surfaceDark: palette.midnight,
  textPrimary: palette.ink,
  textSecondary: palette.warmGray,
  textInverse: palette.white,
  textMuted: '#8B909A',
  border: palette.line,
  accent: palette.gold,
  accentDark: palette.goldDark,
  primary: palette.midnight,
  primaryText: palette.white,
  overlay: 'rgba(26, 28, 46, 0.45)',
  nav: palette.midnight,
  shadow: 'rgba(26, 28, 46, 0.08)',
  danger: palette.coral,
  success: palette.success,
};

export const darkColors: SemanticColors = {
  background: '#10121C',
  surface: palette.midnight,
  surfaceAlt: palette.midnightRaised,
  surfaceDark: '#0B0C14',
  textPrimary: palette.offWhite,
  textSecondary: '#B7BCC6',
  textInverse: palette.midnight,
  textMuted: '#8E93A3',
  border: '#2E3148',
  accent: palette.gold,
  accentDark: palette.goldDark,
  primary: palette.gold,
  primaryText: palette.midnight,
  overlay: 'rgba(0, 0, 0, 0.55)',
  nav: '#0E101A',
  shadow: 'rgba(0, 0, 0, 0.35)',
  danger: palette.coral,
  success: palette.success,
};

export const cardTypeColors = {
  word: { base: palette.gold, dark: palette.goldDark, soft: '#FFF4D2', ink: palette.midnight },
  question: {
    base: palette.teal,
    dark: palette.tealDark,
    soft: palette.tealSoft,
    ink: palette.midnight,
  },
  dare: {
    base: palette.coral,
    dark: palette.coralDark,
    soft: palette.coralSoft,
    ink: palette.white,
  },
  challenge: {
    base: palette.blue,
    dark: palette.blueDark,
    soft: palette.blueSoft,
    ink: palette.white,
  },
  testimony: {
    base: palette.purple,
    dark: palette.purpleDark,
    soft: palette.purpleSoft,
    ink: palette.midnight,
  },
} as const;

export type CardTypeColorKey = keyof typeof cardTypeColors;
