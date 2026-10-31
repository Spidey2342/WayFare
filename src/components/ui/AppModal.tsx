import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { fontFamily, radii, spacing, useTheme } from '@/theme';

import { Button } from './Button';

export function AppModal({
  visible,
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close dialog" onPress={onClose} style={styles.backdrop}>
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => event.stopPropagation()}
          style={[styles.card, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          {body ? <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text> : null}
          {children}
          <Button label={confirmLabel} variant="gold" onPress={onConfirm ?? onClose} />
          <Button label={cancelLabel} variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,28,46,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { fontFamily: fontFamily.heading, fontSize: 24 },
  body: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
});
