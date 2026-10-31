import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, EmptyState, Screen, ScreenScroll } from '@/components/ui';
import { unityPercent } from '@/features/game/engine';
import { useSessionStore } from '@/features/game/sessionStore';
import type { SessionAward } from '@/features/journey/progress';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function LeaderboardScreen() {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const applySessionAward = useAppStore((state) => state.applySessionAward);

  if (!session) {
    return (
      <Screen>
        <EmptyState
          title="No round to show"
          body="Finish a game on this device and the circle will appear here."
          actionLabel="Setup game"
          onAction={() => router.replace('/setup')}
        />
      </Screen>
    );
  }

  const competitive = session.mode === 'team';
  const rows = competitive
    ? [...session.teams]
        .map((team) => ({ id: team.id, name: team.name, points: session.scores[team.id] ?? 0 }))
        .sort((left, right) => right.points - left.points)
    : session.players.map((player) => ({
        id: player.id,
        name: player.name,
        points: session.participation[player.id] ?? 0,
      }));

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>
          Round {session.currentRound} of {session.roundsTotal}
        </Text>
        <Text style={styles.title}>{competitive ? 'Leaderboard' : 'The circle'}</Text>
        <Text style={styles.note}>
          {competitive
            ? 'Points stay with the team. A hot start means someone already scored.'
            : 'Pass-the-phone keeps this friendly. The numbers are moments shared, not a contest.'}
        </Text>
        {rows.map((row, index) => (
          <View key={row.id} style={[styles.row, index === 0 && styles.first]}>
            <Text style={styles.rank}>{index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, index === 0 && styles.nameOn]}>{row.name}</Text>
              <Text style={styles.meta}>
                {index === 0 && row.points > 0 ? 'Hot start' : 'In the circle'}
              </Text>
            </View>
            <Text style={[styles.points, index === 0 && styles.nameOn]}>
              {competitive ? row.points : `${row.points} shared`}
            </Text>
          </View>
        ))}
        <Button
          label="Finish session"
          variant="gold"
          onPress={() => {
            const cardTypes: SessionAward['cardTypes'] = [];
            for (const cardId of session.cardsPlayed) {
              const card = session.cardsById[cardId];
              if (card) cardTypes.push(card.type);
            }
            applySessionAward({
              id: session.id,
              mode: session.mode,
              cardsPlayed: session.cardsPlayed.length,
              cardTypes,
              unity: unityPercent(session),
              actsOfService: session.actsOfService,
            });
            router.push('/game/complete');
          }}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.xl, gap: spacing.md, paddingBottom: 48 },
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
