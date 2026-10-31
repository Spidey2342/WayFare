import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen } from '@/components/ui';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

const rows = [
  { name: "Kofi's team", points: 'Moments shared', hot: true },
  { name: "Ama's team", points: 'Still in the circle', hot: false },
];

export default function LeaderboardScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.kicker}>Round 1 of 2</Text>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.note}>
          Pass-the-phone keeps this friendly. Team mode will show points after the engine lands.
        </Text>
        {rows.map((row, index) => (
          <View key={row.name} style={[styles.row, index === 0 && styles.first]}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, index === 0 && styles.nameOn]}>{row.name}</Text>
              <Text style={styles.meta}>{row.hot ? 'Hot start' : 'Climbing'}</Text>
            </View>
            <Text style={[styles.points, index === 0 && styles.nameOn]}>{row.points}</Text>
          </View>
        ))}
        <Button
          label="Finish session"
          variant="gold"
          onPress={() => router.push('/game/complete')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, gap: spacing.md },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  title: { ...typeScale.h1, color: palette.midnight },
  note: { ...typeScale.bodyS, color: palette.warmGray },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: palette.white,
  },
  first: { backgroundColor: palette.midnight },
  rank: { fontFamily: fontFamily.heading, color: palette.gold, fontSize: 20 },
  name: { fontFamily: fontFamily.headingSemi, color: palette.midnight, fontSize: 16 },
  nameOn: { color: palette.white },
  meta: { fontFamily: fontFamily.body, color: palette.gold, fontSize: 12 },
  points: { fontFamily: fontFamily.bodySemi, color: palette.midnight, fontSize: 13 },
});
