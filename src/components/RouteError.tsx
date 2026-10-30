import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fontFamily, palette, radii, spacing } from '@/theme';

export function RouteError({ error, retry }: { error: Error; retry: () => void | Promise<void> }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.kicker}>WAYFARE</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.body}>{error.message}</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={styles.button}>
        <Text style={styles.buttonText}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: palette.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1.4,
    color: palette.goldDeep,
    fontSize: 12,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: palette.midnight,
    textAlign: 'center',
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    color: palette.warmGray,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    minHeight: 44,
    minWidth: 160,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: palette.midnight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: fontFamily.bodySemi,
    color: palette.white,
    fontSize: 16,
  },
});
