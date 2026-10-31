import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { fontFamily, palette, radii, spacing } from '@/theme';

export function DeckCover({
  title,
  series,
  colors,
  icon,
  tall = false,
}: {
  title: string;
  series?: string;
  colors: readonly [string, string, ...string[]];
  icon?: ReactNode;
  tall?: boolean;
}) {
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cover, tall && styles.tall]}
    >
      <View style={styles.glass}>{icon}</View>
      {series ? <Text style={styles.series}>{series}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radii.card,
    minHeight: 140,
    padding: spacing.md,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  tall: { minHeight: 280 },
  glass: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  series: {
    fontFamily: fontFamily.bodySemi,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fontFamily.heading,
    color: palette.white,
    fontSize: 22,
  },
});
