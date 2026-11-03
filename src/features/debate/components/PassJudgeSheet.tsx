import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, BottomSheet } from '@/components/ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import type { DebatePlayer } from '@/features/debate/types';
import { debateUi } from '@/features/debate/components/debateV2Ui';
import { fontFamily, palette, radii, spacing } from '@/theme';

type Props = {
  visible: boolean;
  players: DebatePlayer[];
  currentJudgeId: string;
  onClose: () => void;
  onSelect: (playerId: string) => void;
};

export function PassJudgeSheet({ visible, players, currentJudgeId, onClose, onSelect }: Props) {
  const candidates = players.filter((player) => player.id !== currentJudgeId);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Pass the judge role">
      <View style={styles.list}>
        {candidates.map((player) => (
          <Pressable
            key={player.id}
            accessibilityRole="button"
            onPress={() => onSelect(player.id)}
            style={styles.row}
          >
            <Avatar
              name={player.displayName}
              color={avatarColorForKey(player.avatarKey ?? player.id)}
              size={40}
            />
            <Text style={styles.name}>{player.displayName}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
  },
  name: { fontFamily: fontFamily.bodySemi, fontSize: 16, color: palette.white },
});
