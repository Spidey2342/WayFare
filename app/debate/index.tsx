import { useEffect } from 'react';

import { hydrateDebateTopics } from '@/features/debate/localSession';
import { syncTopicsSince } from '@/features/debate/topicCache';
import { ensureOutboxFlushOnReconnect } from '@/features/debate/outbox';
import { syncMyStats } from '@/features/debate/statsCache';
import { useAuth } from '@/features/auth/AuthContext';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ChevronRight, Smartphone, User, Users } from 'lucide-react-native';

import { Screen, ScreenScroll } from '@/components/ui';
import { GameRulesSheet } from '@/components/game/GameRulesSheet';
import { DebateModeHeader, debateUi } from '@/features/debate/components/debateV2Ui';
import { useGameRules } from '@/features/game/useGameRules';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

const tiles = [
  {
    id: 'solo' as const,
    title: 'Solo Mode',
    body: 'Daily challenge. Pick a stance and make your case.',
    href: '/debate/solo' as const,
    icon: User,
    tint: debateUi.agree,
  },
  {
    id: 'pass' as const,
    title: 'Same Phone',
    body: 'Pass the device — pick sides in person.',
    href: '/debate/pass/setup' as const,
    icon: Smartphone,
    tint: debateUi.disagree,
  },
  {
    id: 'online' as const,
    title: 'Group Online',
    body: 'Debate Mode with your group room.',
    href: '/debate/join' as const,
    icon: Users,
    tint: debateUi.gold,
  },
];

export default function DebateHubScreen() {
  const router = useRouter();
  const { user, isGuest } = useAuth();
  const { entry, open, openRules, openIfFirstTime, closeRules } = useGameRules('debate');

  useEffect(() => {
    openIfFirstTime();
    ensureOutboxFlushOnReconnect();
    void syncTopicsSince().then(() => hydrateDebateTopics());
    if (user && !isGuest) void syncMyStats();
  }, [openIfFirstTime, user, isGuest]);

  return (
    <>
      <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <DebateModeHeader
            title="DEBATE"
            onBack={() => router.replace('/games' as Href)}
            onInfo={openRules}
          />
          <Text style={styles.lead}>Choose how you want to play.</Text>
          <View style={styles.tiles}>
            {tiles.map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.id}
                  accessibilityRole="button"
                  onPress={() => router.push(tile.href)}
                  style={styles.tile}
                >
                  <View style={[styles.iconCircle, { borderColor: tile.tint }]}>
                    <Icon color={tile.tint} size={22} />
                  </View>
                  <View style={styles.tileText}>
                    <Text style={styles.tileTitle}>{tile.title}</Text>
                    <Text style={styles.tileBody}>{tile.body}</Text>
                  </View>
                  <ChevronRight color={debateUi.muted} size={20} />
                </Pressable>
              );
            })}
          </View>
        </ScreenScroll>
      </Screen>
      <GameRulesSheet open={open} onClose={closeRules} entry={entry} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  lead: { ...typeScale.bodyM, color: debateUi.muted },
  tiles: { gap: spacing.sm, marginTop: spacing.sm },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.lg,
    minHeight: minTapTarget + 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141824',
  },
  tileText: { flex: 1, gap: 4 },
  tileTitle: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.white },
  tileBody: { fontFamily: fontFamily.body, fontSize: 14, color: debateUi.muted },
});
