import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, palette, radii, shadows, spacing, useTheme } from '@/theme';

export function StatTile({
  value,
  label,
  surface = 'theme',
}: {
  value: string;
  label: string;
  surface?: 'theme' | 'light';
}) {
  const { colors } = useTheme();
  const light = surface === 'light';

  return (
    <View
      style={[
        styles.tile,
        light
          ? { backgroundColor: palette.white, ...shadows.soft }
          : { backgroundColor: colors.surface },
      ]}
    >
      <Text style={[styles.value, { color: light ? palette.ink : colors.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.label, { color: light ? palette.warmGray : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
    minWidth: 90,
  },
  value: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
  },
  label: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    textAlign: 'center',
  },
});
