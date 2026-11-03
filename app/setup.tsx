import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import {
  Button,
  PlayerRow,
  RoundSlider,
  Screen,
  ScreenScroll,
  type RoundMinutes,
} from '@/components/ui';
import { findDeck } from '@/data/catalog';
import { useSessionStore } from '@/features/game/sessionStore';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

interface DraftPlayer {
  id: string;
  name: string;
  color: string;
}

export default function SetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ deckId?: string; mode?: string }>();
  const deckId = typeof params.deckId === 'string' ? params.deckId : 'identity';
  const soloMode = params.mode === 'solo';
  const deck = findDeck(deckId);
  const preferred = useAppStore((state) => state.preferredMode) ?? 'pass';
  const [mode, setMode] = useState<'pass' | 'team'>(preferred === 'team' ? 'team' : 'pass');
  const [minutes, setMinutes] = useState<RoundMinutes>(10);
  const [players, setPlayers] = useState<DraftPlayer[]>([
    { id: 'p1', name: 'Player 1', color: '#FFB800' },
    { id: 'p2', name: 'Player 2', color: '#4ECDC4' },
  ]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (players.some((player) => player.name.toLowerCase() === name.toLowerCase())) {
      setError('Each player needs a unique name.');
      return;
    }
    if (players.length >= 12) {
      setError('Twelve players is the limit for one phone.');
      return;
    }
    setPlayers((current) => [...current, { id: `p${current.length + 1}`, name, color: '#4D98FF' }]);
    setDraft('');
    setError(null);
  };

  const start = () => {
    if (!soloMode && players.length < 2) {
      setError('Add at least two players.');
      return;
    }
    if (soloMode && players.length < 1) {
      setError('Add your name to start.');
      return;
    }
    const teams =
      mode === 'team'
        ? [
            {
              id: 'a',
              name: `${players[0]?.name ?? 'Gold'}'s team`,
              playerIds: players.filter((_, index) => index % 2 === 0).map((player) => player.id),
            },
            {
              id: 'b',
              name: `${players[1]?.name ?? 'Teal'}'s team`,
              playerIds: players.filter((_, index) => index % 2 === 1).map((player) => player.id),
            },
          ]
        : [];
    try {
      const id = useSessionStore.getState().start({
        deckId,
        mode: soloMode ? 'solo' : mode,
        minutes,
        players: players.map((player, index) => ({
          id: player.id,
          name: player.name.trim(),
          teamId: mode === 'team' ? (index % 2 === 0 ? 'a' : 'b') : undefined,
        })),
        teams,
      });
      router.push({ pathname: '/game/[sessionId]', params: { sessionId: id } });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not start the game.');
    }
  };

  return (
    <Screen>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
        >
          <Text style={styles.back}>BACK</Text>
        </Pressable>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Setup game</Text>
        <Text style={{ color: colors.textSecondary }}>{deck?.name ?? 'Identity'}</Text>
        <Text style={styles.label}>Select mode</Text>
        <View style={styles.modes}>
          {(['pass', 'team'] as const).map((item) => (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: mode === item }}
              onPress={() => setMode(item)}
              style={[styles.mode, mode === item && styles.modeOn]}
            >
              <Text style={[styles.modeText, mode === item && styles.modeTextOn]}>
                {item === 'pass' ? 'Pass Phone' : 'Team Mode'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Players</Text>
        {players.map((player) => (
          <PlayerRow
            key={player.id}
            name={player.name}
            color={player.color}
            onColorChange={(color) =>
              setPlayers((current) =>
                current.map((item) => (item.id === player.id ? { ...item, color } : item)),
              )
            }
            onRemove={
              players.length > 2
                ? () => setPlayers((current) => current.filter((item) => item.id !== player.id))
                : undefined
            }
          />
        ))}
        <View style={styles.addRow}>
          <TextInput
            accessibilityLabel="New player name"
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a name"
            style={styles.input}
          />
          <Button label="Add" variant="secondary" onPress={add} />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>Round length</Text>
        <RoundSlider value={minutes} onChange={setMinutes} />
        <Button label="Start game" variant="gold" onPress={start} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  back: {
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1,
    color: palette.warmGray,
    minHeight: 44,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    letterSpacing: 1,
    color: palette.warmGray,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  modes: { flexDirection: 'row', gap: spacing.sm },
  mode: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeOn: { backgroundColor: palette.midnight, borderColor: palette.midnight },
  modeText: { fontFamily: fontFamily.bodySemi, color: palette.midnight },
  modeTextOn: { color: palette.white },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.white,
  },
  error: { color: palette.coral, fontFamily: fontFamily.bodyMedium },
});
