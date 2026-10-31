import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';

import { BadgeIconView } from '@/features/learn/badgeIcons';
import { fontFamily, palette, radii, spacing, useTheme } from '@/theme';

export function BadgeTile({ name, earned, icon }: { name: string; earned: boolean; icon: string }) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityLabel={`${name}, ${earned ? 'earned' : 'locked'}`}
      style={[styles.tile, { backgroundColor: colors.surface }, !earned && styles.locked]}
    >
      <BadgeIconView
        name={icon}
        color={earned ? palette.goldDeep : palette.warmGray}
        size={22}
        strokeWidth={2.2}
      />
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
        {name}
      </Text>
      {!earned ? <Lock color={palette.warmGray} size={12} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '30%',
    minHeight: 96,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: 4,
  },
  locked: { opacity: 0.55 },
  name: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    textAlign: 'center',
  },
});
