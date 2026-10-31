import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { palette, radii, spacing, useTheme } from '@/theme';

export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const { colors } = useTheme();
  const offset = useSharedValue(400);

  useEffect(() => {
    offset.value = withTiming(visible ? 0 : 420, { duration: reduced ? 1 : 280 });
  }, [offset, reduced, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close sheet" onPress={onClose} style={styles.backdrop} />
      <Animated.View style={[styles.sheet, { backgroundColor: colors.surface }, sheetStyle]}>
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: palette.midnight,
    opacity: 0.45,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5D8E0',
  },
});
