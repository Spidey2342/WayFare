import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Confetti, Screen, StatTile } from '@/components/ui';
import { unityPercent } from '@/features/game/engine';
import { useSessionStore } from '@/features/game/sessionStore';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function CompleteScreen() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const [marked, setMarked] = useState(false);
  const cardsPlayed = session?.cardsPlayed.length ?? 0;
  const unity = session ? unityPercent(session) : 100;
  return (
    <Screen>
      <Confetti active />
      <View style={styles.body}>
        <Text style={styles.kicker}>Session complete</Text>
        <Text style={styles.title}>Amazing session!</Text>
        <View style={styles.stats}>
          <StatTile value={String(cardsPlayed)} label="Cards played" />
          <StatTile value={`${unity}%`} label="Team unity" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Closing prayer</Text>
          <Text style={styles.cardBody}>
            Lord, thank you for this circle. Keep our words kind and our courage gentle. Amen.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Weekly challenge · The Encouragers</Text>
          <Text style={styles.cardBody}>
            {marked ? '1/1 marked complete' : '0/1 · Encourage someone before the week ends.'}
          </Text>
          <Button
            label={marked ? 'Completed' : 'Mark complete'}
            variant="secondary"
            disabled={marked}
            onPress={() => setMarked(true)}
          />
        </View>
        <Button label="Share the moment" variant="gold" onPress={() => router.push('/share')} />
        <Button label="Back to home" variant="ghost" onPress={() => router.replace('/home')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, gap: spacing.md },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  title: { ...typeScale.h1, color: palette.midnight },
  stats: { flexDirection: 'row', gap: spacing.sm },
  card: {
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.midnight },
  cardBody: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22, color: palette.warmGray },
});
