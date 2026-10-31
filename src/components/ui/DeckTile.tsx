import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { fontFamily, minTapTarget, palette, radii, shadows, spacing, useTheme } from '@/theme';

import { DeckCover } from './DeckCover';

export function DeckTile({
  title,
  tagline,
  count,
  colors,
  icon,
  locked = false,
  onPress,
}: {
  title: string;
  tagline: string;
  count: number;
  colors: readonly [string, string, ...string[]];
  icon?: ReactNode;
  locked?: boolean;
  onPress?: () => void;
}) {
  const { colors: theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${tagline}. ${count} cards. ${locked ? 'Locked' : 'Unlocked'}`}
      accessibilityState={{ disabled: locked }}
      onPress={onPress}
      style={[styles.tile, { backgroundColor: theme.surface }, shadows.soft]}
    >
      <DeckCover title="" colors={colors} icon={icon} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>
        {tagline}
      </Text>
      <View style={styles.row}>
        <Text style={styles.count}>{count} cards</Text>
        {locked ? <Lock color={palette.warmGray} size={14} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radii.xl,
    padding: spacing.sm,
    gap: 6,
    minHeight: minTapTarget,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    marginTop: 4,
  },
  tagline: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  count: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    color: palette.warmGray,
  },
});
