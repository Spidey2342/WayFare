import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Copy, Settings } from 'lucide-react-native';

import { ScreenHeader } from '@/components/navigation/ScreenHeader';
import {
  Avatar,
  BottomSheet,
  Button,
  Chip,
  Screen,
  ScreenScroll,
  SkeletonLoader,
} from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { rpcCreateDebateSession } from '@/features/debate/api';
import { rpcGetGroupLobby, rpcRemoveMember, rpcRotateCode } from '@/features/groups/api';
import {
  baseMembersFromRpc,
  canLeaderStartGame,
  copyCodeResult,
  friendlyLobbyError,
  membersWithPresence,
  readyCount,
  waitingForMorePlayers,
  type LobbyMemberRow,
} from '@/features/groups/lobbyModel';
import { useLobbyPresence } from '@/features/groups/useLobbyPresence';
import { goBackOr } from '@/navigation/goBackOr';
import { isSupabaseConfigured, logSupabaseDevStatus, requireSupabase } from '@/services/supabase';
import { copyTextToClipboard } from '@/utils/clipboard';
import { avatarColorForKey } from '@/data/avatarPresets';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

export default function GroupLobbyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [baseMembers, setBaseMembers] = useState<LobbyMemberRow[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  const { readyMap, onlineMap, setSelfReady, clearPresence, selfReady } = useLobbyPresence(
    id,
    user?.id,
  );

  const members = useMemo(
    () => membersWithPresence(baseMembers, readyMap, onlineMap),
    [baseMembers, onlineMap, readyMap],
  );

  const isLeader = members.some((member) => member.userId === user?.id && member.role === 'leader');
  const waiting = waitingForMorePlayers(members);
  const startEnabled = canLeaderStartGame(members);

  const reload = useCallback(async () => {
    if (!id) {
      setError('Missing group id.');
      setLoading(false);
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add keys to .env and restart Expo.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await rpcGetGroupLobby(id);
      setGroupName(payload.group.name);
      setJoinCode(payload.group.join_code ?? '');
      setBaseMembers(baseMembersFromRpc(payload));
    } catch (caught) {
      setError(friendlyLobbyError(caught));
      setJoinCode('');
      setBaseMembers([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    logSupabaseDevStatus();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial lobby fetch
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!id || !isSupabaseConfigured) return;
    const channel = requireSupabase()
      .channel(`group-members-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${id}` },
        () => void reload(),
      )
      .subscribe();
    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [id, reload]);

  const leaveLobby = useCallback(async () => {
    await clearPresence();
    goBackOr(router, `/groups/${id}`);
  }, [clearPresence, id, router]);

  const copyCode = async () => {
    const result = copyCodeResult(joinCode, await copyTextToClipboard(joinCode));
    setToast(result.message);
  };

  const shareCode = async () => {
    const code = joinCode.trim();
    if (!code) {
      setToast('No join code to share yet.');
      return;
    }
    const message = `Join my Wayfare group with code ${code}`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ text: message });
        return;
      }
      await Share.share({ message });
    } catch {
      const copied = await copyTextToClipboard(code);
      setToast(copied ? 'Code copied' : "Couldn't share. Select the code and copy it manually.");
    }
  };

  const toggleReady = async () => {
    await setSelfReady(!selfReady);
  };

  const rotate = async () => {
    try {
      const next = await rpcRotateCode(id);
      setJoinCode(next);
      setToast('New code created');
    } catch {
      setToast('Only the leader can rotate the code.');
    }
  };

  const startMatch = async () => {
    try {
      const sessionId = await rpcCreateDebateSession(id, null);
      router.push(`/debate/${sessionId}`);
    } catch {
      setToast('Could not start game. Run Supabase migration 0002.');
    }
  };

  const removeFirstMember = async () => {
    const target = members.find((member) => member.role !== 'leader');
    if (!target) return;
    try {
      await rpcRemoveMember(id, target.userId);
      setToast('Member removed');
      void reload();
    } catch {
      setToast('Could not remove member.');
    }
  };

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenHeader
        variant="dark"
        title={loading ? 'Group lobby' : groupName}
        fallback={`/groups/${id}`}
        backLabel="Go back"
        onBackPress={() => void leaveLobby()}
        rightAction={
          isLeader ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Leader settings"
              onPress={() => setToolsOpen(true)}
              style={styles.settingsBtn}
            >
              <Settings color={palette.white} size={22} />
            </Pressable>
          ) : (
            <View style={styles.settingsBtn} />
          )
        }
      />

      <ScreenScroll contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.stack}>
            <SkeletonLoader height={120} />
            <SkeletonLoader height={56} />
            <SkeletonLoader height={56} />
            <SkeletonLoader height={56} />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Could not load lobby</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Button label="Retry" variant="gold" onPress={() => void reload()} />
          </View>
        ) : (
          <>
            <View style={styles.codeCard}>
              <Text style={styles.codeKicker}>SHARE ROOM CODE</Text>
              <View style={styles.codeRow}>
                <Text selectable style={styles.codeValue}>
                  {joinCode}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Copy room code"
                  disabled={!joinCode.trim()}
                  onPress={() => void copyCode()}
                  style={[styles.iconBtn, !joinCode.trim() && styles.iconBtnDisabled]}
                >
                  <Copy color={palette.gold} size={22} />
                </Pressable>
              </View>
              <Button label="Share" variant="secondary" onPress={() => void shareCode()} />
            </View>

            <View style={styles.membersHead}>
              <Text style={styles.membersLabel}>MEMBERS ({members.length})</Text>
              {isLeader ? <Chip label="LEADER VIEW" tone="gold" /> : null}
            </View>

            <View style={styles.memberList}>
              {members.map((member) => (
                <MemberRow key={member.userId} member={member} isYou={member.userId === user?.id} />
              ))}
            </View>

            <Button
              label={selfReady ? 'READY' : 'Mark ready'}
              variant={selfReady ? 'secondary' : 'secondary'}
              onPress={() => void toggleReady()}
            />

            {isLeader ? (
              <View style={styles.startBlock}>
                <Button
                  label="Start Game"
                  variant="gold"
                  disabled={!startEnabled}
                  onPress={() => void startMatch()}
                />
                <Text style={styles.startHint}>
                  {startEnabled
                    ? `${readyCount(members)} players ready`
                    : `Waiting for ${waiting} more player${waiting === 1 ? '' : 's'}...`}
                </Text>
              </View>
            ) : (
              <Text style={styles.startHint}>
                {startEnabled
                  ? 'Waiting for the leader to start…'
                  : `Waiting for ${waiting} more player${waiting === 1 ? '' : 's'}...`}
              </Text>
            )}

            {toast ? <Text style={styles.toast}>{toast}</Text> : null}
          </>
        )}
      </ScreenScroll>

      <BottomSheet visible={toolsOpen} onClose={() => setToolsOpen(false)} title="Leader tools">
        <View style={{ gap: spacing.sm }}>
          <Button label="Rotate join code" variant="secondary" onPress={() => void rotate()} />
          <Button
            label="Remove a member"
            variant="secondary"
            onPress={() => void removeFirstMember()}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function MemberRow({ member, isYou }: { member: LobbyMemberRow; isYou: boolean }) {
  return (
    <View style={styles.memberRow}>
      <Avatar
        name={member.displayName}
        color={avatarColorForKey(member.avatarKey ?? member.userId)}
        size={48}
      />
      <View style={styles.memberMeta}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {member.displayName}
            {isYou ? ' (You)' : ''}
          </Text>
          {member.role === 'leader' ? <Text style={styles.leaderBadge}>Leader</Text> : null}
        </View>
      </View>
      <View style={[styles.statusChip, member.ready ? styles.statusReady : styles.statusWait]}>
        {member.ready ? <Check color={palette.teal} size={14} /> : null}
        <Text style={member.ready ? styles.statusReadyText : styles.statusWaitText}>
          {member.ready ? 'READY' : 'WAITING...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  stack: { gap: spacing.md },
  settingsBtn: {
    width: minTapTarget,
    height: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCard: {
    backgroundColor: '#252838',
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  codeKicker: {
    ...typeScale.caption,
    color: palette.warmGray,
    letterSpacing: 1.4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  codeValue: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: 36,
    lineHeight: 44,
    color: palette.white,
    letterSpacing: 6,
  },
  iconBtn: {
    width: minTapTarget,
    height: minTapTarget,
    borderRadius: minTapTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconBtnDisabled: { opacity: 0.4 },
  membersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membersLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1.2,
    color: palette.warmGray,
  },
  memberList: { gap: spacing.sm },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#252838',
    borderRadius: radii.card,
    padding: spacing.md,
  },
  memberMeta: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  memberName: {
    color: palette.white,
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    flexShrink: 1,
  },
  leaderBadge: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: palette.gold,
    letterSpacing: 0.6,
  },
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
  startBlock: { gap: spacing.sm, marginTop: spacing.md },
  startHint: {
    textAlign: 'center',
    color: palette.warmGray,
    fontFamily: fontFamily.body,
    fontSize: 14,
  },
  toast: { color: palette.gold, fontFamily: fontFamily.body, textAlign: 'center' },
  errorCard: {
    backgroundColor: '#252838',
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorTitle: { ...typeScale.h3, color: palette.white },
  errorBody: { ...typeScale.bodyM, color: palette.warmGray, lineHeight: 22 },
});
