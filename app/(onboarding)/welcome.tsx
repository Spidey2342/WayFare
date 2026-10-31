import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Logo, Screen } from '@/components/ui';
import { fontFamily, palette, spacing } from '@/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <View style={styles.body}>
        <Logo />
        <Text style={styles.tagline}>
          Study the Word.{'\n'}
          <Text style={styles.gold}>Enjoy the Journey.</Text>
        </Text>
        <Button label="Get started" variant="gold" onPress={() => router.push('/how-it-works')} />
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  tagline: {
    fontFamily: fontFamily.body,
    color: palette.white,
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  gold: { fontFamily: fontFamily.italic, color: palette.gold },
  dots: { flexDirection: 'row', gap: 8, marginTop: spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3A3D52' },
  dotOn: { backgroundColor: palette.gold, width: 18 },
});
