import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

import { Avatar, Button, TimerRing } from '@/components/ui';
import type { DebatePlayer, DebateSide } from '@/features/debate/types';
import { avatarColorForKey } from '@/data/avatarPresets';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

type Props = {
  title?: string;
  secondsLeft: number;
  totalSeconds: number;
  candidates: DebatePlayer[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
};

function sideAccent(side: DebateSide | null) {
  if (side === 'agree') return palette.coral;
  if (side === 'disagree') return palette.teal;
  return palette.line;
}

export function DebateVoteGrid({
  title = 'Who convinced you most?',
  secondsLeft,
  totalSeconds,
  candidates,
  selectedId,
  onSelect,
  onSubmit,
  submitLabel = 'Lock in vote',
  submitDisabled,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <TimerRing secondsLeft={secondsLeft} total={totalSeconds} size={56} />
      </View>
      <View style={styles.grid}>
        {candidates.map((player) => {
          const selected = selectedId === player.id;
          const edge = sideAccent(player.side);
          return (
            <Pressable
              key={player.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(player.id)}
              style={[styles.tile, selected && styles.tileSelected]}
            >
              <View style={[styles.edge, { backgroundColor: edge }]} />
              <Avatar
                name={player.displayName}
                color={avatarColorForKey(player.avatarKey ?? player.id)}
                size={56}
              />
              <Text style={styles.name} numberOfLines={1}>
                {player.displayName}
              </Text>
              {selected ? (
                <View style={styles.check}>
                  <Check color={palette.midnight} size={16} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      <Button
        label={submitLabel}
        variant="gold"
        disabled={submitDisabled ?? !selectedId}
        onPress={onSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typeScale.h2, color: palette.white, flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    width: '47%',
    minHeight: minTapTarget * 2,
    backgroundColor: palette.midnightRaised,
    borderRadius: radii.card,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  tileSelected: {
    borderColor: palette.gold,
  },
  edge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  name: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    color: palette.white,
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  check: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
