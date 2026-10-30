import type { TextStyle } from 'react-native';

export const fontFamily = {
  display: 'Poppins_800ExtraBold',
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
  headingMedium: 'Poppins_500Medium',
  italic: 'Poppins_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  scripture: 'Poppins_500Medium',
} as const;

export const typeScale = {
  display: {
    fontFamily: fontFamily.display,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.8,
  },
  h1: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  h3: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    lineHeight: 28,
  },
  bodyL: {
    fontFamily: fontFamily.body,
    fontSize: 18,
    lineHeight: 26,
  },
  bodyM: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyS: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  scripture: {
    fontFamily: fontFamily.scripture,
    fontSize: 18,
    lineHeight: 28,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeScaleName = keyof typeof typeScale;
