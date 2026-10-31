import { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, CardFace, FlipCard, Screen, TimerRing } from '@/components/ui';
import { palette, spacing, typeScale } from '@/theme';

const cards = [
  {
    type: 'word' as const,
    title: 'Fearfully & Wonderfully Made',
    body: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
    prompt: 'Explain the verse in your own words. The other team may say if it was clear.',
    reference: 'Psalm 139:14',
  },
  {
    type: 'question' as const,
    title: 'Known',
    prompt: 'When do you feel most sure that God knows you? One sentence is enough. You can skip.',
    reference: 'Psalm 139:1',
  },
  {
    type: 'dare' as const,
    title: 'A kind word',
    prompt: 'Give a sincere compliment to the person on your right.',
  },
];

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId: string }>();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [seconds, setSeconds] = useState(45);
  const [paused, setPaused] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const card = cards[index] ?? cards[0];

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setPaused(state !== 'active'));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (paused || !flipped || seconds <= 0) return;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [flipped, paused, seconds]);

  if (!card) return null;

  const finishCard = () => {
    if (index >= cards.length - 1) {
      router.push('/game/leaderboard');
      return;
    }
    setIndex((value) => value + 1);
    setFlipped(false);
    setSeconds(45);
    setSkipped(false);
  };

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <View style={styles.body}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Current turn</Text>
            <Text style={styles.player}>Kofi</Text>
          </View>
          <View>
            <Text style={styles.kicker}>Score</Text>
            <Text style={styles.player}>{params.sessionId === 'preview' ? '—' : '2'}</Text>
          </View>
          <TimerRing secondsLeft={seconds} />
        </View>
        <FlipCard
          flipped={flipped}
          front={
            <CardFace
              type="word"
              title="Wayfare"
              prompt="Tap the card to draw. Take your time. Skip is always allowed."
            />
          }
          back={
            <CardFace
              type={card.type}
              title={card.title}
              body={'body' in card ? card.body : undefined}
              prompt={card.prompt}
              reference={'reference' in card ? card.reference : undefined}
            />
          }
        />
        {!flipped ? (
          <Button label="Draw card" variant="gold" onPress={() => setFlipped(true)} />
        ) : null}
        {flipped ? (
          <View style={styles.actions}>
            <Button
              label={skipped ? 'Skip used' : 'Skip once'}
              variant="secondary"
              disabled={skipped}
              onPress={() => setSkipped(true)}
            />
            <Button label="Done" variant="gold" onPress={finishCard} />
          </View>
        ) : null}
        <Button
          label="Roll the dice"
          variant="secondary"
          onPress={() => router.push('/game/dice')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { ...typeScale.caption, color: '#C9CDD6' },
  player: { fontFamily: typeScale.h3.fontFamily, color: palette.white, fontSize: 18 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
