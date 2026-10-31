import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { BadgeIcon, badgeSoftColor, badgeTintColor, type BadgeColorToken } from './BadgeIcon';
import { fontFamily, palette, shadows, spacing } from '@/theme';

export function BadgeTile({
  name,
  earned,
  icon,
  color = 'gold',
  compact = false,
}: {
  name: string;
  earned: boolean;
  icon: string;
  color?: BadgeColorToken;
  compact?: boolean;
}) {
  const tint = earned ? badgeTintColor(color) : palette.warmGray;
  const soft = earned ? badgeSoftColor(color) : '#EEF0F4';

  return (
    <View
      accessibilityLabel={`${name}, ${earned ? 'earned' : 'locked'}`}
      style={[styles.tile, compact && styles.tileCompact, !earned && styles.lockedTile]}
    >
      <View style={[styles.iconRing, { backgroundColor: soft }]}>
        <BadgeIcon name={icon} color={tint} size={compact ? 18 : 22} strokeWidth={2.2} />
        {!earned ? (
          <View style={styles.lockBadge}>
            <Lock color={palette.warmGray} size={10} strokeWidth={2.4} />
          </View>
        ) : null}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '31%',
    minHeight: 112,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    ...shadows.card,
  },
  tileCompact: {
    width: 88,
    minHeight: 104,
    borderRadius: 16,
  },
  lockedTile: {
    opacity: 0.72,
  },
  iconRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
  },
  name: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: palette.ink,
  },
});
