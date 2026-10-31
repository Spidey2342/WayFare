import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, spacing, useTheme } from '@/theme';

import { Button } from './Button';

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  icon,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {icon}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="primary" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { fontFamily: fontFamily.heading, fontSize: 22, textAlign: 'center' },
  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
