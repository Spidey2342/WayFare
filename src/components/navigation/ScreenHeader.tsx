import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { goBackOr } from '@/navigation/goBackOr';
import { fontFamily, minTapTarget, palette, spacing, typeScale } from '@/theme';

type Variant = 'light' | 'dark';

type Props = {
  title?: string;
  fallback: Href;
  backLabel?: string;
  variant?: Variant;
  rightAction?: ReactNode;
  onBackPress?: () => void;
};

export function ScreenHeader({
  title,
  fallback,
  backLabel = 'Go back',
  variant = 'light',
  rightAction,
  onBackPress,
}: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = variant === 'dark';
  const textColor = isDark ? palette.white : palette.midnight;
  const iconBg = isDark ? 'rgba(255,255,255,0.12)' : palette.offWhite;
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : palette.line;

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    goBackOr(router, fallback);
  };

  return (
    <View
      style={[
        styles.wrap,
        { paddingTop: Math.max(insets.top, spacing.sm), borderBottomColor: borderColor },
        isDark && styles.wrapDark,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="screen-header-back"
        onPress={handleBack}
        style={[styles.backBtn, { backgroundColor: iconBg }]}
      >
        <ChevronLeft color={textColor} size={22} />
      </Pressable>
      <View style={styles.titleSlot}>
        {title ? (
          <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
            {title}
          </Text>
        ) : null}
      </View>
      <View style={styles.rightSlot}>{rightAction ?? <View style={styles.backBtn} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wrapDark: {
    borderBottomWidth: 0,
  },
  backBtn: {
    width: minTapTarget,
    height: minTapTarget,
    borderRadius: minTapTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSlot: { flex: 1, alignItems: 'center' },
  title: { ...typeScale.h3, fontFamily: fontFamily.headingSemi, textAlign: 'center' },
  rightSlot: { width: minTapTarget, alignItems: 'flex-end' },
});
