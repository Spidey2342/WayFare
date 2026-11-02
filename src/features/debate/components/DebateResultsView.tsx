import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Crown } from 'lucide-react-native';

import { Avatar, Button } from '@/components/ui';
import type { DebatePlayer, DebateResults, PlayerScoreLine } from '@/features/debate/types';
import { avatarColorForKey } from '@/data/avatarPresets';
import { motion } from '@/theme/motion';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

type Props = {
  results: DebateResults;
  players: DebatePlayer[];
  scores: Record<string, PlayerScoreLine>;
  xpEarned?: number;
  onPlayAgain?: () => void;
  onBack?: () => void;
  dark?: boolean;
};

export function DebateResultsView({
  results,
  players,
  scores,
  xpEarned = 0,
  onPlayAgain,
  onBack,
  dark = true,
}: Props) {
  const forBar = useSharedValue(0);
  const againstBar = useSharedValue(0);
  const totalVotes = Math.max(1, results.sideTotals.agree + results.sideTotals.disagree);
  const mvpId = results.mvpIds[0];
  const mvp = players.find((player) => player.id === mvpId);

  useEffect(() => {
    let reduce = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reduce = enabled;
      const forRatio = results.sideTotals.agree / totalVotes;
      const againstRatio = results.sideTotals.disagree / totalVotes;
      if (reduce) {
        forBar.value = forRatio;
        againstBar.value = againstRatio;
        return;
      }
      forBar.value = withSpring(forRatio, motion.spring.sheet);
      againstBar.value = withSpring(againstRatio, motion.spring.sheet);
    });
  }, [againstBar, forBar, results.sideTotals.disagree, results.sideTotals.agree, totalVotes]);

  const forStyle = useAnimatedStyle(() => ({ flex: forBar.value }));
  const againstStyle = useAnimatedStyle(() => ({ flex: againstBar.value }));

  const surface = dark ? palette.midnightRaised : palette.white;
  const textPrimary = dark ? palette.white : palette.midnight;
  const textSecondary = dark ? palette.warmGray : palette.warmGray;

  const winnerLabel = results.sideTie
    ? 'Side tie'
    : results.winningSides.map((side) => side.toUpperCase()).join(' wins');

  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: surface }]}>
        <Text style={[styles.bannerKicker, { color: palette.gold }]}>Winner</Text>
        <Text style={[styles.bannerTitle, { color: textPrimary }]}>{winnerLabel}</Text>
      </View>

      <View style={styles.bars}>
        <View style={styles.barRow}>
          <Text style={[styles.barLabel, { color: palette.coral }]}>AGREE</Text>
          <View style={styles.barTrack}>
            <Animated.View style={[styles.barFill, { backgroundColor: palette.coral }, forStyle]} />
          </View>
          <Text style={[styles.barCount, { color: textPrimary }]}>{results.sideTotals.agree}</Text>
        </View>
        <View style={styles.barRow}>
          <Text style={[styles.barLabel, { color: palette.teal }]}>DISAGREE</Text>
          <View style={styles.barTrack}>
            <Animated.View
              style={[styles.barFill, { backgroundColor: palette.teal }, againstStyle]}
            />
          </View>
          <Text style={[styles.barCount, { color: textPrimary }]}>
            {results.sideTotals.disagree}
          </Text>
        </View>
      </View>

      {mvp ? (
        <View style={[styles.mvpCard, { backgroundColor: surface }]}>
          <View style={styles.mvpRing}>
            <Avatar
              name={mvp.displayName}
              color={avatarColorForKey(mvp.avatarKey ?? mvp.id)}
              size={72}
              ring
            />
            <View style={styles.crown}>
              <Crown color={palette.gold} size={20} />
            </View>
          </View>
          <Text style={[styles.mvpTitle, { color: textPrimary }]}>MVP</Text>
          <Text style={[styles.mvpName, { color: textSecondary }]}>{mvp.displayName}</Text>
        </View>
      ) : null}

      <View style={styles.stats}>
        <StatTile label="Points" value={String(Object.values(scores)[0]?.total ?? 0)} dark={dark} />
        <StatTile label="XP" value={`+${xpEarned}`} dark={dark} />
      </View>

      <View style={styles.actions}>
        {onPlayAgain ? <Button label="Play again" variant="gold" onPress={onPlayAgain} /> : null}
        {onBack ? <Button label="Back" variant="secondary" onPress={onBack} /> : null}
      </View>
    </View>
  );
}

function StatTile({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: dark ? palette.midnightRaised : palette.offWhite },
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: dark ? palette.white : palette.midnight }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  banner: {
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  bannerKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bannerTitle: { ...typeScale.h2, textAlign: 'center' },
  bars: { gap: spacing.md },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 72, fontFamily: fontFamily.bodySemi, fontSize: 13 },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 6 },
  barCount: { width: 28, fontFamily: fontFamily.headingSemi, fontSize: 16, textAlign: 'right' },
  mvpCard: {
    borderRadius: radii.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  mvpRing: { position: 'relative' },
  crown: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: palette.midnight,
    borderRadius: 12,
    padding: 4,
  },
  mvpTitle: { fontFamily: fontFamily.headingSemi, fontSize: 18 },
  mvpName: { fontFamily: fontFamily.body, fontSize: 15 },
  stats: { flexDirection: 'row', gap: spacing.md },
  statTile: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing.md,
    gap: 4,
  },
  statLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    letterSpacing: 0.8,
    color: palette.warmGray,
    textTransform: 'uppercase',
  },
  statValue: { fontFamily: fontFamily.heading, fontSize: 24 },
  actions: { gap: spacing.sm },
});
