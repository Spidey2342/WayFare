import { useCallback, useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Copy } from 'lucide-react-native';

import { BackButton, BottomSheet, Button, Screen, ScreenScroll } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { rpcStartGroupDebate } from '@/features/debate/api';
import { debateStatementsForDeck } from '@/features/debate/cards';
import {
  fetchGroup,
  fetchGroupMembers,
  fetchMemberProfiles,
  rpcRemoveMember,
  rpcRotateCode,
} from '@/features/groups/api';
import { requireSupabase } from '@/services/supabase';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

type MemberView = { userId: string; name: string; role: string; ready: boolean };

export default function GroupLobbyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ id: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const [title, setTitle] = useState('Group lobby');
  const [code, setCode] = useState('');
  const [members, setMembers] = useState<MemberView[]>([]);
  const [readySelf, setReadySelf] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!id) return;
    const group = await fetchGroup(id);
    setTitle(group?.name ?? 'Group lobby');
    setCode(group?.join_code ?? '');
    const rows = await fetchGroupMembers(id);
    const profiles = await fetchMemberProfiles(rows.map((row) => row.user_id));
    const names = new Map(
      profiles.map((profile) => [profile.id, profile.display_name ?? 'Member']),
    );
    setMembers(
      rows.map((row) => ({
        userId: row.user_id,
        name: names.get(row.user_id) ?? 'Member',
        role: row.role,
        ready: row.user_id === user?.id ? readySelf : false,
      })),
    );
  }, [id, readySelf, user?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!id) return;
    const channel = requireSupabase()
      .channel(`group-members-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${id}` },
        () => {
          void reload();
        },
      )
      .subscribe();
    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [id, reload]);

  const isLeader = members.some((member) => member.userId === user?.id && member.role === 'leader');

  const copyCode = async () => {
    setMessage('Code copied');
    await Share.share({ message: `Join my Wayfare group with code ${code}` });
  };

  const rotate = async () => {
    try {
      const next = await rpcRotateCode(id);
      setCode(next);
      setMessage('New code created');
    } catch {
      setMessage('Only the leader can rotate the code.');
    }
  };

  const startMatch = async () => {
    try {
      const statements = debateStatementsForDeck('church-culture', 6);
      if (statements.length === 0) {
        setMessage('No debate statements in this deck.');
        return;
      }
      const sessionId = await rpcStartGroupDebate(
        id,
        'church-culture',
        statements.map((item) => item.cardId),
      );
      router.push(`/debate/${sessionId}`);
    } catch {
      setMessage('Could not start debate. Run Supabase migration 0002.');
    }
  };

  const removeFirstMember = async () => {
    const target = members.find((member) => member.role !== 'leader');
    if (!target) return;
    try {
      await rpcRemoveMember(id, target.userId);
      setMessage('Member removed');
      void reload();
    } catch {
      setMessage('Could not remove member.');
    }
  };

  return (
    <Screen background={palette.midnight} gutter={palette.midnight}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback={`/groups/${id}`} />
        <Text style={[typeScale.h1, { color: palette.white }]}>{title}</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeLabel}>Join code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{code}</Text>
            <Pressable accessibilityRole="button" onPress={() => void copyCode()}>
              <Copy color={palette.gold} size={20} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.section}>Members ({members.length})</Text>
        {members.map((member) => (
          <View key={member.userId} style={styles.memberRow}>
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={member.ready ? styles.ready : styles.waiting}>
              {member.ready ? 'Ready' : 'Waiting'}
            </Text>
          </View>
        ))}
        <Button
          label={readySelf ? 'You are ready' : 'Mark ready'}
          variant="secondary"
          onPress={() => setReadySelf(true)}
        />
        {isLeader ? (
          <>
            <Button label="Start debate" variant="gold" onPress={() => void startMatch()} />
            <Button label="Leader tools" variant="ghost" onPress={() => setToolsOpen(true)} />
          </>
        ) : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}
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

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  codeBox: {
    backgroundColor: '#252838',
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  codeLabel: { ...typeScale.caption, color: palette.warmGray },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 28,
    color: palette.white,
    letterSpacing: 4,
  },
  section: { color: palette.warmGray, fontFamily: fontFamily.bodySemi },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3D52',
  },
  memberName: { color: palette.white, fontFamily: fontFamily.bodySemi },
  ready: { color: palette.teal, fontFamily: fontFamily.bodySemi },
  waiting: { color: palette.warmGray, fontFamily: fontFamily.body },
  message: { color: palette.gold, fontFamily: fontFamily.body },
});
