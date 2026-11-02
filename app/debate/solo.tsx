import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { debateStatementsForDeck } from '@/features/debate/cards';
import {
  advanceDebateRound,
  castDebateVote,
  createDebateSession,
  currentDebateRound,
  tallyVotes,
} from '@/features/debate/debateEngine';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

export default function SoloDebateScreen() {
  const router = useRouter();
  const name = useAppStore((state) => state.profile.name);
  const [session] = useState(() => {
    const statements = debateStatementsForDeck('identity', 5);
    return createDebateSession(`solo_${Date.now()}`, statements, ['solo']);
  });
  const [state, setState] = useState(session);
  const round = currentDebateRound(state);
  const tally = round ? tallyVotes(round) : null;

  const prompt = round?.prompt ?? '';

  const vote = (choice: 'agree' | 'disagree') => {
    if (!round) return;
    let next = castDebateVote(state, 'solo', choice);
    next = advanceDebateRound(next);
    setState(next);
    if (next.status === 'complete') {
      router.replace('/home');
    }
  };

  const headline = useMemo(() => `Debate · ${name}`, [name]);

  if (!round) {
    return (
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Text style={typeScale.h2}>Debate complete</Text>
          <Button label="Back home" variant="primary" onPress={() => router.replace('/home')} />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Exit" fallback="/home" />
        <Text style={styles.kicker}>{headline}</Text>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Statement</Text>
          <Text style={styles.prompt}>{prompt}</Text>
        </View>
        {tally ? (
          <Text style={styles.meta}>
            Round {state.roundIndex + 1} of {state.rounds.length}
          </Text>
        ) : null}
        <Button label="Agree" variant="gold" onPress={() => vote('agree')} />
        <Button label="Disagree" variant="secondary" onPress={() => vote('disagree')} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  kicker: { ...typeScale.caption, color: palette.goldDeep },
  card: {
    backgroundColor: palette.coral,
    borderRadius: radii.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  cardLabel: { ...typeScale.caption, color: palette.white, opacity: 0.85 },
  prompt: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    color: palette.white,
    lineHeight: 30,
  },
  meta: { color: palette.warmGray, fontFamily: fontFamily.body, textAlign: 'center' },
});
