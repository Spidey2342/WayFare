import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Check } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import { Avatar, Button, Chip, Screen, ScreenScroll } from '@/components/ui';
import type { LobbyMemberRow } from '@/features/groups/lobbyModel';
import {
  readyCount,
  waitingForMorePlayers,
  canLeaderStartGame,
} from '@/features/groups/lobbyModel';
import { avatarColorForKey } from '@/data/avatarPresets';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

/** Dev-only static lobby for audit screenshots (matches B5 layout). */
export default function LobbyPreviewScreen() {
  const params = useLocalSearchParams<{ members?: string }>();
  const count = params.members === '3' ? 3 : 1;
  const members: LobbyMemberRow[] =
    count === 3
      ? [
          {
            userId: '1',
            displayName: 'Leader',
            avatarKey: 'sunrise',
            role: 'leader',
            ready: true,
            online: true,
          },
          {
            userId: '2',
            displayName: 'Member',
            avatarKey: 'teal',
            role: 'member',
            ready: true,
            online: true,
          },
          {
            userId: '3',
            displayName: 'Jay',
            avatarKey: 'coral',
            role: 'member',
            ready: false,
            online: true,
          },
        ]
      : [
          {
            userId: '1',
            displayName: 'Leader',
            avatarKey: 'sunrise',
            role: 'leader',
            ready: false,
            online: true,
          },
        ];

  const waiting = waitingForMorePlayers(members);
  const startEnabled = canLeaderStartGame(members);

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenHeader variant="dark" title="Sample Group" fallback="/groups" />
      <ScreenScroll contentContainerStyle={styles.content}>
        <View style={styles.codeCard}>
          <Text style={styles.codeKicker}>SHARE ROOM CODE</Text>
          <Text selectable style={styles.codeValue}>
            WYF7X2
          </Text>
        </View>
        <View style={styles.membersHead}>
          <Text style={styles.membersLabel}>MEMBERS ({members.length})</Text>
          <Chip label="LEADER VIEW" tone="gold" />
        </View>
        {members.map((member) => (
          <View key={member.userId} style={styles.memberRow}>
            <Avatar
              name={member.displayName}
              color={avatarColorForKey(member.avatarKey ?? 'sunrise')}
              size={48}
            />
            <Text style={styles.memberName}>
              {member.displayName}
              {member.userId === '1' ? ' (You)' : ''}
            </Text>
            <View
              style={[styles.statusChip, member.ready ? styles.statusReady : styles.statusWait]}
            >
              {member.ready ? <Check color={palette.teal} size={14} /> : null}
              <Text style={member.ready ? styles.statusReadyText : styles.statusWaitText}>
                {member.ready ? 'READY' : 'WAITING...'}
              </Text>
            </View>
          </View>
        ))}
        <Button label="Mark ready" variant="secondary" onPress={() => undefined} />
        <Button
          label="Start Game"
          variant="gold"
          disabled={!startEnabled}
          onPress={() => undefined}
        />
        <Text style={styles.hint}>
          {startEnabled
            ? `${readyCount(members)} players ready`
            : `Waiting for ${waiting} more player${waiting === 1 ? '' : 's'}...`}
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
  codeCard: {
    backgroundColor: '#252838',
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  codeKicker: { ...typeScale.caption, color: palette.warmGray, letterSpacing: 1.4 },
  codeValue: {
    fontFamily: fontFamily.heading,
    fontSize: 36,
    color: palette.white,
    letterSpacing: 6,
  },
  membersHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  membersLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: palette.warmGray,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#252838',
    borderRadius: radii.card,
    padding: spacing.md,
  },
  memberName: { flex: 1, color: palette.white, fontFamily: fontFamily.bodySemi },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  statusReady: { backgroundColor: palette.tealSoft },
  statusWait: { backgroundColor: 'rgba(255,255,255,0.08)' },
  statusReadyText: { fontFamily: fontFamily.bodySemi, fontSize: 11, color: palette.teal },
  statusWaitText: { fontFamily: fontFamily.bodySemi, fontSize: 11, color: palette.warmGray },
  hint: { textAlign: 'center', color: palette.warmGray, fontFamily: fontFamily.body },
});
