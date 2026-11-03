import { useEffect } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Crown, Trophy } from 'lucide-react-native';

import { Avatar } from '@/components/ui';
import {
  DebateGoldButton,
  DebateOutlineButton,
  debateUi,
} from '@/features/debate/components/debateV2Ui';
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
  backLabel?: string;
  dark?: boolean;
  variant?: 'default' | 'v2';
  /** D8 leader vs D9 player/spectator (spec screen map). */
  resultsAudience?: 'leader' | 'player' | 'spectator';
  viewerScore?: PlayerScoreLine;
  showChangeVerdict?: boolean;
  onChangeVerdict?: () => void;
};

export function DebateResultsView(props: Props) {
  const {
    results,
    players,
    scores,
    xpEarned = 0,
    onPlayAgain,
    onBack,
    backLabel = 'Back',
    dark = true,
    variant = 'default',
    resultsAudience = 'leader',
    viewerScore,
    showChangeVerdict,
    onChangeVerdict,
  } = props;

  const forBar = useSharedValue(0);
  const againstBar = useSharedValue(0);
  const totalVotes = Math.max(1, results.sideTotals.agree + results.sideTotals.disagree);

  useEffect(() => {
    if (variant === 'v2' && dark) return;
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
  }, [
    againstBar,
    dark,
    forBar,
    results.sideTotals.disagree,
    results.sideTotals.agree,
    totalVotes,
    variant,
  ]);

  const forStyle = useAnimatedStyle(() => ({ flex: forBar.value }));
  const againstStyle = useAnimatedStyle(() => ({ flex: againstBar.value }));

  const mvpId = results.mvpIds[0];
  const mvp = players.find((player) => player.id === mvpId);
  const winningSide = results.sideTie ? null : results.winningSides[0];
  const winners = winningSide
    ? players.filter((player) => player.side === winningSide)
    : players.slice(0, 3);
  const myScore = viewerScore ?? Object.values(scores)[0];
  const matchPoints = myScore?.sideWin ?? 3;
  const mvpBonus = myScore?.mvp ?? 0;
  const participation = myScore?.participation ?? 1;
  const headerKicker = resultsAudience === 'player' ? 'YOUR RESULTS' : 'RESULTS';
  const winSub = resultsAudience === 'player' ? 'VICTORY ACHIEVED' : 'THE STRONGER ARGUMENT';

  if (variant === 'v2' && dark) {
    const winTint = winningSide === 'disagree' ? debateUi.disagree : debateUi.agree;
    const winLabel = results.sideTie ? 'DRAW' : `${(winningSide ?? 'agree').toUpperCase()} WINS`;
    return (
      <View style={styles.v2Wrap}>
        <Text style={styles.resultsKicker}>{headerKicker}</Text>
        <View style={[styles.winCard, { borderColor: winTint, shadowColor: winTint }]}>
          <View style={[styles.trophyCircle, { backgroundColor: winTint }]}>
            <Trophy color={palette.white} size={28} />
          </View>
          <Text style={[styles.winTitle, { color: winTint }]}>{winLabel}</Text>
          <Text style={styles.winSub}>{winSub}</Text>
          <View style={styles.winnerAvatars}>
            {winners.slice(0, 3).map((player) => (
              <View key={player.id} style={styles.winnerAvatarWrap}>
                <Avatar
                  name={player.displayName}
                  color={avatarColorForKey(player.avatarKey ?? player.id)}
                  size={44}
                />
              </View>
            ))}
          </View>
        </View>

        {mvp ? (
          <View style={styles.v2MvpRow}>
            <Avatar
              name={mvp.displayName}
              color={avatarColorForKey(mvp.avatarKey ?? mvp.id)}
              size={48}
              ring
            />
            <View>
              <Text style={styles.v2MvpKicker}>MATCH MVP</Text>
              <Text style={styles.v2MvpName}>{mvp.displayName}</Text>
            </View>
            <Crown color={debateUi.gold} size={20} />
          </View>
        ) : null}

        {resultsAudience !== 'spectator' ? (
          <View style={styles.pointRow}>
            {resultsAudience === 'leader' ? (
              <>
                <PointBadge label="MATCH POINTS" value={`+${matchPoints}`} />
                {mvpBonus > 0 ? <PointBadge label="MVP BONUS" value={`+${mvpBonus}`} /> : null}
              </>
            ) : (
              <>
                <PointBadge label="VICTORY" value={`+${matchPoints}`} />
                <PointBadge label="TAKING PART" value={`+${participation}`} />
                {mvpBonus > 0 ? <PointBadge label="MVP" value={`+${mvpBonus}`} /> : null}
              </>
            )}
          </View>
        ) : null}

        {xpEarned > 0 ? (
          <Text style={styles.xpLine}>+{xpEarned} XP added to your profile</Text>
        ) : null}

        <View style={styles.v2Actions}>
          {onPlayAgain ? <DebateGoldButton label="ANOTHER TOPIC" onPress={onPlayAgain} /> : null}
          {onBack ? <DebateOutlineButton label={backLabel} onPress={onBack} /> : null}
        </View>
        {showChangeVerdict && onChangeVerdict ? (
          <Pressable accessibilityRole="button" onPress={onChangeVerdict}>
            <Text style={styles.changeVerdict}>Change verdict</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

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
        {onPlayAgain ? <DebateGoldButton label="Play again" onPress={onPlayAgain} /> : null}
        {onBack ? <DebateOutlineButton label={backLabel} onPress={onBack} /> : null}
      </View>
    </View>
  );
}

function PointBadge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pointBadge}>
      <Text style={styles.pointValue}>{value}</Text>
      <Text style={styles.pointLabel}>{label}</Text>
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
  v2Wrap: { gap: spacing.lg },
  resultsKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 2,
    color: debateUi.muted,
    textAlign: 'center',
  },
  changeVerdict: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: debateUi.muted,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  winCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    backgroundColor: debateUi.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  trophyCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winTitle: { fontFamily: fontFamily.heading, fontSize: 32, letterSpacing: 0.5 },
  winSub: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1.5,
    color: debateUi.muted,
  },
  winnerAvatars: { flexDirection: 'row', marginTop: spacing.sm },
  winnerAvatarWrap: { marginHorizontal: -6 },
  v2MvpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
  },
  v2MvpKicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: debateUi.gold,
  },
  v2MvpName: { fontFamily: fontFamily.bodySemi, fontSize: 16, color: palette.white },
  pointRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pointBadge: {
    flex: 1,
    minWidth: 96,
    backgroundColor: debateUi.card,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
  },
  pointValue: { fontFamily: fontFamily.headingSemi, fontSize: 18, color: palette.white },
  pointLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 9,
    letterSpacing: 0.8,
    color: debateUi.muted,
    textAlign: 'center',
  },
  xpLine: { fontFamily: fontFamily.body, fontSize: 13, color: debateUi.muted, textAlign: 'center' },
  v2Actions: { gap: spacing.sm, marginTop: spacing.sm },
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
