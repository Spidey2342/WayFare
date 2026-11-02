import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, TimerRing } from '@/components/ui';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

import { DEBATE_KINDNESS_REMINDER } from '../types';
import type { DebatePlayer } from '../types';

type Props = {
  topic: string;
  secondsLeft: number;
  totalSeconds: number;
  forPlayers: DebatePlayer[];
  againstPlayers: DebatePlayer[];
  readyCount: number;
  playerCount: number;
  showReadyButton: boolean;
  onReady?: () => void;
  readyDisabled?: boolean;
  onStickerPlaceholder?: () => void;
  announceTimer?: boolean;
};

export function DebateStage({
  topic,
  secondsLeft,
  totalSeconds,
  forPlayers,
  againstPlayers,
  readyCount,
  playerCount,
  showReadyButton,
  onReady,
  readyDisabled,
  onStickerPlaceholder,
  announceTimer = true,
}: Props) {
  const announced = useRef<number | null>(null);
  useEffect(() => {
    if (!announceTimer) return;
    if (secondsLeft !== 30 && secondsLeft !== 10) return;
    if (announced.current === secondsLeft) return;
    announced.current = secondsLeft;
    void AccessibilityInfo.announceForAccessibility(`${secondsLeft} seconds left`);
  }, [announceTimer, secondsLeft]);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text style={styles.reminder}>{DEBATE_KINDNESS_REMINDER}</Text>
      <View style={styles.header}>
        <SideLabel label="AGREE" color={palette.coral} />
        <View style={styles.timerWrap}>
          <TimerRing secondsLeft={secondsLeft} total={totalSeconds} />
        </View>
        <SideLabel label="DISAGREE" color={palette.teal} />
      </View>
      <View style={styles.topicCard}>
        <Text style={styles.topicLabel}>Topic</Text>
        <Text style={styles.topicText}>{topic}</Text>
      </View>
      <View style={styles.columns}>
        <SideColumn side="agree" players={forPlayers} accent={palette.coral} />
        <SideColumn side="disagree" players={againstPlayers} accent={palette.teal} />
      </View>
      {showReadyButton ? (
        <View style={styles.readyBlock}>
          <Button
            label="Ready to Vote"
            variant="gold"
            disabled={readyDisabled}
            onPress={onReady}
            accessibilityLabel={`Ready to Vote, ${readyCount} of ${playerCount} ready`}
          />
          <Text style={styles.readyMeta}>
            {readyCount} of {playerCount} ready
          </Text>
        </View>
      ) : null}
      {onStickerPlaceholder ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reactions coming soon"
          onPress={onStickerPlaceholder}
          style={styles.sticker}
        >
          <Text style={styles.stickerText}>Stickers</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SideLabel({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.sideBadge, { backgroundColor: color }]}>
      <Text style={styles.sideBadgeText}>{label}</Text>
    </View>
  );
}

function SideColumn({
  side,
  players,
  accent,
}: {
  side: 'agree' | 'disagree';
  players: DebatePlayer[];
  accent: string;
}) {
  return (
    <View style={styles.column} accessibilityLabel={`${side} side players`}>
      {players.map((player) => (
        <View key={player.id} style={[styles.chip, { borderColor: accent }]}>
          <View style={[styles.chipDot, { backgroundColor: accent }]} />
          <Text style={styles.chipName} numberOfLines={1}>
            {player.displayName}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  reminder: {
    ...typeScale.caption,
    color: palette.gold,
    textAlign: 'center',
    fontFamily: fontFamily.bodySemi,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sideBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    minWidth: 72,
    alignItems: 'center',
  },
  sideBadgeText: {
    fontFamily: fontFamily.headingSemi,
    color: palette.white,
    fontSize: 13,
    letterSpacing: 0.6,
  },
  timerWrap: { flexShrink: 0 },
  topicCard: {
    backgroundColor: palette.midnightRaised,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: palette.line,
  },
  topicLabel: { ...typeScale.caption, color: palette.warmGray },
  topicText: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: palette.white,
    lineHeight: 28,
  },
  columns: { flexDirection: 'row', gap: spacing.md },
  column: { flex: 1, gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: minTapTarget,
  },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipName: { flex: 1, color: palette.white, fontFamily: fontFamily.bodySemi, fontSize: 14 },
  readyBlock: { gap: spacing.xs, alignItems: 'center' },
  readyMeta: { color: palette.warmGray, fontFamily: fontFamily.body, fontSize: 13 },
  sticker: {
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.line,
    minHeight: minTapTarget,
    justifyContent: 'center',
  },
  stickerText: { color: palette.warmGray, fontFamily: fontFamily.bodySemi },
});
