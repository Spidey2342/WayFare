import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, CardFace, EmptyState, FlipCard, Screen, TimerRing } from '@/components/ui';
import { canSkip, currentCard, currentPlayer } from '@/features/game/engine';
import { useSessionStore } from '@/features/game/sessionStore';
import { palette, spacing, typeScale } from '@/theme';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const session = useSessionStore((state) => state.session);
  const lastDice = useSessionStore((state) => state.lastDice);
  const lastError = useSessionStore((state) => state.lastError);
  const draw = useSessionStore((state) => state.draw);
  const skip = useSessionStore((state) => state.skip);
  const finish = useSessionStore((state) => state.finish);
  const bless = useSessionStore((state) => state.bless);
  const [hydrated, setHydrated] = useState(() => useSessionStore.persist.hasHydrated());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    return useSessionStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setPaused(state !== 'active'));
    return () => sub.remove();
  }, []);

  const cardId = session?.currentCardId ?? null;

  useEffect(() => {
    if (session?.status === 'complete') router.replace('/game/leaderboard');
  }, [router, session?.status]);

  if (!hydrated) {
    return (
      <Screen background={palette.midnight} gutter={palette.midnight}>
        <Text style={styles.kicker}>Resuming your game</Text>
      </Screen>
    );
  }

  if (!session || session.id !== params.sessionId || session.status !== 'active') {
    return (
      <Screen>
        <EmptyState
          title="No game in progress"
          body="Start a round from setup. A game on this device resumes after a refresh."
          actionLabel="Setup game"
          onAction={() => router.replace('/setup')}
        />
      </Screen>
    );
  }

  const player = currentPlayer(session);
  const card = currentCard(session);
  const score =
    session.mode === 'team'
      ? (session.scores[player.teamId ?? ''] ?? 0)
      : Object.values(session.participation).reduce((sum, count) => sum + count, 0);
  const waitingBless = lastDice === 'bless' && !card;

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Current turn</Text>
            <Text style={styles.player}>{player.name}</Text>
          </View>
          <View>
            <Text style={styles.kicker}>{session.mode === 'team' ? 'Score' : 'Together'}</Text>
            <Text style={styles.player}>{score}</Text>
          </View>
          <TurnTimer key={cardId ?? 'idle'} cardId={cardId} paused={paused} />
        </View>
        <Text style={styles.round}>
          Round {session.currentRound} of {session.roundsTotal}
        </Text>
        {waitingBless ? (
          <CardFace
            type="testimony"
            title="Bless"
            prompt="Encourage someone in the circle with a sincere word or a short prayer. This counts as an act of service."
          />
        ) : (
          <FlipCard
            flipped={Boolean(card)}
            front={
              <CardFace
                type="word"
                title="Wayfare"
                prompt="Tap draw. Take your time. Skip is always allowed, once each round."
              />
            }
            back={
              card ? (
                <CardFace
                  type={card.type}
                  title={card.title}
                  body={card.body}
                  prompt={card.prompt}
                  reference={card.reference}
                />
              ) : (
                <CardFace type="word" title="Wayfare" prompt="Drawing the next card." />
              )
            }
          />
        )}
        {lastError ? <Text style={styles.error}>{lastError}</Text> : null}
        {waitingBless ? (
          <Button label="I encouraged someone" variant="gold" onPress={bless} />
        ) : null}
        {!card && !waitingBless ? <Button label="Draw card" variant="gold" onPress={draw} /> : null}
        {card ? (
          <View style={styles.actions}>
            <Button
              label={canSkip(session, player.id) ? 'Skip once' : 'Skip used'}
              variant="secondary"
              disabled={!canSkip(session, player.id)}
              onPress={skip}
            />
            {session.mode === 'team' && card.type === 'word' ? (
              <>
                <Button
                  label="They understood"
                  variant="gold"
                  onPress={() => finish({ kind: 'word', accepted: true })}
                />
                <Button
                  label="Not yet"
                  variant="secondary"
                  onPress={() => finish({ kind: 'word', accepted: false })}
                />
              </>
            ) : null}
            {session.mode === 'team' && card.type === 'challenge'
              ? session.teams.map((team) => (
                  <Button
                    key={team.id}
                    label={`${team.name} wins`}
                    variant="gold"
                    onPress={() => finish({ kind: 'challenge', winnerTeamId: team.id })}
                  />
                ))
              : null}
            {session.mode !== 'team' || (card.type !== 'word' && card.type !== 'challenge') ? (
              <Button label="Done" variant="gold" onPress={() => finish({ kind: 'standard' })} />
            ) : null}
          </View>
        ) : null}
        {!card ? (
          <Button
            label="Roll the dice"
            variant="secondary"
            onPress={() => router.push('/game/dice')}
          />
        ) : null}
      </View>
    </Screen>
  );
}

function TurnTimer({ cardId, paused }: { cardId: string | null; paused: boolean }) {
  const [seconds, setSeconds] = useState(45);

  useEffect(() => {
    if (paused || !cardId || seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cardId, paused, seconds]);

  return <TimerRing secondsLeft={cardId ? seconds : 45} />;
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { ...typeScale.caption, color: '#C9CDD6' },
  player: { fontFamily: typeScale.h3.fontFamily, color: palette.white, fontSize: 18 },
  round: { ...typeScale.caption, color: palette.gold },
  actions: { gap: spacing.sm },
  error: { color: palette.coral, fontSize: 14 },
});
