import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import {
  DebateGoldButton,
  DebateMutedFooter,
  DebateTopicCard,
  debateUi,
} from '@/features/debate/components/debateV2Ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import type { DebatePlayer } from '@/features/debate/types';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

type Props = {
  topic: string;
  players: DebatePlayer[];
  judgeId: string;
  canStart: boolean;
  onStart: () => void;
};

export function PassReadyScreen({ topic, players, judgeId, canStart, onStart }: Props) {
  const debaters = players.filter((player) => player.id !== judgeId);
  const agree = debaters.filter((player) => player.side === 'agree');
  const disagree = debaters.filter((player) => player.side === 'disagree');

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text style={typeScale.h2}>Ready?</Text>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{players.length} PLAYERS</Text>
        </View>
      </View>
      <DebateTopicCard text={topic} />
      <SideList label="AGREE" tint={debateUi.agree} players={agree} />
      <SideList label="DISAGREE" tint={debateUi.disagree} players={disagree} />
      {!canStart ? (
        <DebateMutedFooter>
          Each side needs at least 1 player to start the debate.
        </DebateMutedFooter>
      ) : null}
      <DebateGoldButton label="START DEBATE" disabled={!canStart} onPress={onStart} />
    </View>
  );
}

function SideList({
  label,
  tint,
  players,
}: {
  label: string;
  tint: string;
  players: DebatePlayer[];
}) {
  return (
    <View style={styles.sideBlock}>
      <View style={styles.sideHead}>
        <View style={[styles.dot, { backgroundColor: tint }]} />
        <Text style={[styles.sideLabel, { color: tint }]}>{label}</Text>
        <Text style={styles.sideCount}>
          {players.length} Player{players.length === 1 ? '' : 's'}
        </Text>
      </View>
      {players.map((player) => (
        <View key={player.id} style={styles.playerRow}>
          <Avatar
            name={player.displayName}
            color={avatarColorForKey(player.avatarKey ?? player.id)}
            size={36}
          />
          <Text style={styles.playerName}>{player.displayName}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 0.8,
    color: debateUi.muted,
  },
  sideBlock: {
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sideHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  sideLabel: { fontFamily: fontFamily.headingSemi, fontSize: 14 },
  sideCount: {
    marginLeft: 'auto',
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: debateUi.muted,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  playerName: { fontFamily: fontFamily.bodySemi, fontSize: 15, color: palette.white },
});
