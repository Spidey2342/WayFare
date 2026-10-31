import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { fontFamily, minTapTarget, palette, spacing, useTheme } from '@/theme';

export function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  danger = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={styles.row}
    >
      <View style={[styles.icon, danger && { backgroundColor: palette.coralSoft }]}>{icon}</View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: danger ? palette.coral : colors.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <ChevronRight color={colors.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTapTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F1F2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  title: { fontFamily: fontFamily.bodySemi, fontSize: 16 },
  subtitle: { fontFamily: fontFamily.body, fontSize: 13, marginTop: 2 },
});
