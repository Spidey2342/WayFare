import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, radii, spacing, useTheme } from '@/theme';

export function StatTile({ value, label }: { value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: colors.surface }]}>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
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
