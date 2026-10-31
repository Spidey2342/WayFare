import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { fontFamily, minTapTarget, palette, radii, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost';

const faces: Record<ButtonVariant, { bg: string; edge: string; text: string }> = {
  primary: { bg: palette.midnight, edge: '#0C0E18', text: palette.white },
  gold: { bg: palette.gold, edge: palette.goldDeep, text: palette.midnight },
  secondary: { bg: palette.white, edge: palette.line, text: palette.midnight },
  ghost: { bg: 'transparent', edge: 'transparent', text: palette.midnight },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled = false,
  onPress,
  icon,
  accessibilityLabel,
}: {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  accessibilityLabel?: string;
}) {
  const face = faces[variant];
  const offset = useSharedValue(0);
  const [focused, setFocused] = useState(false);
  const blocked = disabled || loading;
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: blocked, busy: loading }}
      disabled={blocked}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPressIn={() => {
        // Shared values are written in place. The immutability lint does not model that.
        // eslint-disable-next-line react-hooks/immutability
        offset.value = withTiming(variant === 'ghost' || variant === 'secondary' ? 1 : 3, {
          duration: 80,
        });
      }}
      onPressOut={() => {
        // eslint-disable-next-line react-hooks/immutability
        offset.value = withTiming(0, { duration: 120 });
      }}
      style={[styles.hit, animated, blocked && styles.disabled, focused && styles.focused]}
    >
      <View
        style={[
          styles.face,
          { backgroundColor: face.bg, borderBottomColor: face.edge },
          variant === 'secondary' && styles.outline,
          variant === 'ghost' && styles.ghost,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={face.text} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text
              style={[
                styles.label,
                { color: face.text },
                (variant === 'primary' || variant === 'gold') && styles.upper,
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    minHeight: minTapTarget,
    borderRadius: radii.lg,
  },
  face: {
    minHeight: 56,
    borderRadius: radii.lg,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: palette.midnight,
    borderBottomWidth: 1.5,
  },
  ghost: {
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
    minHeight: minTapTarget,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    letterSpacing: 0.6,
  },
  upper: {
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.45,
  },
  focused: {
    borderWidth: 2,
    borderColor: palette.gold,
    borderRadius: radii.lg + 2,
  },
});
