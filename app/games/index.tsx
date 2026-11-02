import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Layers, MessageSquare } from 'lucide-react-native';

import { SignInToPlaySheet } from '@/components/auth/SignInToPlaySheet';
import { GameRulesSheet } from '@/components/game/GameRulesSheet';
import { PlayModeSheet } from '@/components/game/PlayModeSheet';
import { BackButton, Screen, ScreenScroll } from '@/components/ui';
import { rulesForGame } from '@/data/gameRules';
import { requiresAccountForPlayMode, type PlayMode } from '@/features/auth/routing';
import { useAuth } from '@/features/auth/AuthContext';
import { fontFamily, minTapTarget, palette, radii, shadows, spacing, typeScale } from '@/theme';
import { useAppStore } from '@/store';

const games = [
  {
    id: 'wayfare',
    title: 'Wayfare',
    body: 'Draw cards, answer prompts, and play solo, same phone, or online.',
    icon: Layers,
    tint: palette.tealSoft,
    iconColor: palette.teal,
  },
  {
    id: 'debate',
    title: 'Debate',
    body: 'Pick a side, talk it out, and let the leader call the verdict.',
    icon: MessageSquare,
    tint: palette.coralSoft,
    iconColor: palette.coral,
    href: '/debate' as const,
  },
] as const;

export default function GamesHubScreen() {
  const router = useRouter();
  const { session: authSession } = useAuth();
  const seenRules = useAppStore((state) => state.seenRules);
  const markRulesSeen = useAppStore((state) => state.markRulesSeen);
  const cardRules = rulesForGame('card-game');
  const [playSheet, setPlaySheet] = useState(false);
  const [signInSheet, setSignInSheet] = useState(false);
  const [helpSheet, setHelpSheet] = useState(false);
  const [pendingMode, setPendingMode] = useState<PlayMode | null>(null);

  const continueMode = (mode: PlayMode) => {
    if (mode === 'solo') {
      router.push({ pathname: '/setup', params: { deckId: 'identity', mode: 'solo' } });
      return;
    }
    if (mode === 'pass') {
      router.push({ pathname: '/setup', params: { deckId: 'identity', mode: 'pass' } });
      return;
    }
    router.push('/groups');
  };

  const pickMode = (mode: PlayMode) => {
    setPlaySheet(false);
    if (requiresAccountForPlayMode(mode) && !authSession) {
      setSignInSheet(true);
      return;
    }
    if (!seenRules['card-game']) {
      setPendingMode(mode);
      setHelpSheet(true);
      return;
    }
    continueMode(mode);
  };

  return (
    <>
      <Screen background={palette.offWhite} gutter={palette.offWhite}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <BackButton label="Back" fallback="/home" />
          <Text style={typeScale.h1}>Games</Text>
          <Text style={styles.sub}>Choose what you want to play.</Text>
          <View style={styles.tiles}>
            {games.map((game) => {
              const Icon = game.icon;
              return (
                <Pressable
                  key={game.id}
                  accessibilityRole="button"
                  onPress={() => {
                    if (game.id === 'debate' && 'href' in game) {
                      router.push(game.href);
                      return;
                    }
                    setPlaySheet(true);
                  }}
                  style={styles.tile}
                >
                  <View style={[styles.iconCircle, { backgroundColor: game.tint }]}>
                    <Icon color={game.iconColor} size={22} />
                  </View>
                  <View style={styles.tileText}>
                    <Text style={styles.tileTitle}>{game.title}</Text>
                    <Text style={styles.tileBody}>{game.body}</Text>
                  </View>
                  <ChevronRight color={palette.warmGray} size={20} />
                </Pressable>
              );
            })}
          </View>
        </ScreenScroll>
      </Screen>
      <PlayModeSheet open={playSheet} onClose={() => setPlaySheet(false)} onPick={pickMode} />
      <SignInToPlaySheet open={signInSheet} onClose={() => setSignInSheet(false)} />
      <GameRulesSheet
        open={helpSheet}
        onClose={() => {
          setHelpSheet(false);
          markRulesSeen('card-game');
          if (pendingMode) {
            continueMode(pendingMode);
            setPendingMode(null);
          }
        }}
        entry={cardRules}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  sub: { fontFamily: fontFamily.body, color: palette.warmGray, lineHeight: 22 },
  tiles: { gap: spacing.sm, marginTop: spacing.sm },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radii.card,
    padding: spacing.lg,
    minHeight: minTapTarget + 16,
    ...shadows.soft,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: { flex: 1, gap: 4 },
  tileTitle: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.midnight },
  tileBody: { fontFamily: fontFamily.body, fontSize: 14, color: palette.warmGray },
});
