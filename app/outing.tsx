import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen } from '@/components/ui';
import { palette, spacing, typeScale } from '@/theme';

export default function OutingScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.kicker}>Coming later</Text>
        <Text style={styles.title}>Outing mode</Text>
        <Text style={styles.bodyText}>
          Mixed decks for trips and youth nights are planned, along with place ideas. This version
          keeps the door ready and does not pretend the mode is live.
        </Text>
        <Button label="Back to decks" onPress={() => router.replace('/decks')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, justifyContent: 'center', gap: spacing.md },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  title: { ...typeScale.h1, color: palette.midnight },
  bodyText: { ...typeScale.bodyL, color: palette.warmGray },
});
