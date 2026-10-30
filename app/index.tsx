import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function FoundationScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.mark}>
        <Text style={styles.markText}>W</Text>
      </View>
      <Text style={styles.wordmark}>WAYFARE</Text>
      <View style={styles.rule} />
      <Text style={styles.tagline}>
        Study the Word.{'\n'}
        <Text style={styles.taglineGold}>Enjoy the Journey.</Text>
      </Text>
      <Link href="/dev/kit" style={styles.link}>
        Open the design kit
      </Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.midnight,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontFamily: fontFamily.display,
    fontSize: 36,
    color: palette.midnight,
  },
  wordmark: {
    ...typeScale.h1,
    color: palette.white,
    letterSpacing: 4,
  },
  rule: {
    width: 72,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.gold,
  },
  tagline: {
    ...typeScale.bodyL,
    color: palette.white,
    textAlign: 'center',
  },
  taglineGold: {
    fontFamily: fontFamily.italic,
    color: palette.gold,
  },
  link: {
    marginTop: spacing.lg,
    minHeight: 44,
    color: palette.gold,
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
