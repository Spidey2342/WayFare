import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function NotFoundScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.kicker}>404</Text>
      <Text style={styles.title}>This path is not on the map.</Text>
      <Text style={styles.body}>The page you opened is not part of Wayfare.</Text>
      <Link href="/" style={styles.link}>
        Back to the start
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  title: { ...typeScale.h2, color: palette.midnight, textAlign: 'center' },
  body: { ...typeScale.bodyM, color: palette.warmGray, textAlign: 'center' },
  link: {
    marginTop: spacing.md,
    minHeight: 44,
    fontFamily: fontFamily.bodySemi,
    color: palette.midnight,
    fontSize: 16,
  },
});
