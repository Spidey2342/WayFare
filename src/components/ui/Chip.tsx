import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, palette, radii, spacing } from '@/theme';

const tones = {
  gold: { bg: '#FFF4D2', text: '#8A6500' },
  coral: { bg: palette.coralSoft, text: '#C23B3B' },
  teal: { bg: palette.tealSoft, text: '#1F8F88' },
  purple: { bg: palette.purpleSoft, text: '#5C54C7' },
  blue: { bg: palette.blueSoft, text: '#2B6ED6' },
  muted: { bg: '#EEF0F3', text: palette.warmGray },
  dark: { bg: 'rgba(255,255,255,0.12)', text: palette.white },
  solidGold: { bg: palette.gold, text: palette.midnight },
} as const;

export type ChipTone = keyof typeof tones;

export function Chip({ label, tone = 'gold' }: { label: string; tone?: ChipTone }) {
  const colors = tones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: colors.bg }]}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minHeight: 28,
    justifyContent: 'center',
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
