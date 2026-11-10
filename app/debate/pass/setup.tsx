import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';

import { Avatar, Screen, ScreenScroll } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import {
  DebateGoldButton,
  DebateModeHeader,
  debateUi,
} from '@/features/debate/components/debateV2Ui';
import { avatarColorForKey } from '@/data/avatarPresets';
import { newLocalDebateId } from '@/features/debate/ids';
import {
  PASS_SELF_ID,
  normalizePassPlayerName,
  passAddedAvatarColor,
  validatePassPlayerName,
} from '@/features/debate/passSetupPlayers';
import { bundledDebateTopics, createPassSession } from '@/features/debate/localSession';
import { saveLocalDebate } from '@/features/debate/localStore';
import { fontFamily, minTapTarget, palette, radii, spacing, typeScale } from '@/theme';

type ListedPlayer = {
  id: string;
  displayName: string;
  isSelf: boolean;
  avatarColor: string;
};

export default function PassDebateSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ test?: string }>();
  const fast = params.test === '1' || process.env.EXPO_PUBLIC_DEBATE_TEST_TIMERS === 'true';
  const { profile, user } = useAuth();

  const selfName = profile?.display_name?.trim() || 'Account';
  const selfAvatarColor = avatarColorForKey(profile?.avatar_key ?? user?.id ?? 'midnight');

  const [addedNames, setAddedNames] = useState<string[]>([]);
  const [judgeId, setJudgeId] = useState(PASS_SELF_ID);
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const players: ListedPlayer[] = useMemo(() => {
    const self: ListedPlayer = {
      id: PASS_SELF_ID,
      displayName: selfName,
      isSelf: true,
      avatarColor: selfAvatarColor,
    };
    const extras = addedNames.map((name, index) => ({
      id: `added-${index}`,
      displayName: name,
      isSelf: false,
      avatarColor: passAddedAvatarColor(index),
    }));
    return [self, ...extras];
  }, [selfName, selfAvatarColor, addedNames]);

  const playerCount = players.length;
  const canContinue = playerCount >= 3;
  const atMax = playerCount >= 8;

  const removePlayer = useCallback(
    (id: string) => {
      if (id === PASS_SELF_ID) return;
      const row = players.find((item) => item.id === id);
      if (!row || row.isSelf) return;
      setAddedNames((list) => list.filter((item) => item !== row.displayName));
      if (judgeId === id) setJudgeId(PASS_SELF_ID);
    },
    [judgeId, players],
  );

  const confirmAdd = useCallback(() => {
    const error = validatePassPlayerName(draftName, addedNames, selfName);
    if (error) {
      setNameError(error);
      return;
    }
    const name = normalizePassPlayerName(draftName);
    setAddedNames((list) => [...list, name]);
    setDraftName('');
    setNameError(null);
    setAdding(false);
  }, [draftName, addedNames, selfName]);

  const start = () => {
    if (!canContinue) return;
    const debatePlayers = players.map((row) => ({
      id: row.id,
      displayName: row.displayName,
    }));
    const hostId = judgeId;
    const placeholderTopic = bundledDebateTopics()[0]!;
    const id = newLocalDebateId('pass');
    const session = createPassSession(id, placeholderTopic, debatePlayers, hostId, {
      prepSeconds: fast ? 1 : 30,
      debateSeconds: fast ? 2 : 120,
      votingSeconds: fast ? 2 : 30,
      debateExtensionSeconds: 30,
    });
    saveLocalDebate(session);
    router.push({ pathname: '/debate/pass/[sessionId]', params: { sessionId: id } });
  };

  return (
    <Screen background={palette.midnightDeep} gutter={palette.midnightDeep}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <DebateModeHeader title={null} onBack={() => router.replace('/debate')} />
        <Text style={styles.title}>Players</Text>
        <Text style={styles.kicker}>WHO IS PLAYING TODAY?</Text>

        {!canContinue ? (
          <Text style={styles.helper} testID="pass-setup-helper">
            Add at least 3 players: a judge and one on each side.
          </Text>
        ) : null}
        {atMax ? (
          <Text style={styles.helper} testID="pass-setup-limit">
            You can have up to 8 players.
          </Text>
        ) : null}
        {nameError ? (
          <Text style={styles.notice} testID="pass-setup-name-error">
            {nameError}
          </Text>
        ) : null}

        <View style={styles.list}>
          {players.map((row) => {
            const isJudge = judgeId === row.id;
            const label = row.isSelf ? `${row.displayName} (You)` : row.displayName;
            return (
              <Pressable
                key={row.id}
                testID={`pass-setup-row-${row.id}`}
                accessibilityRole="button"
                onPress={() => setJudgeId(row.id)}
                style={[styles.playerRow, isJudge && styles.playerRowJudge]}
              >
                <Avatar name={row.displayName} color={row.avatarColor} size={44} />
                <Text style={styles.playerName}>{label}</Text>
                {!row.isSelf ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${row.displayName}`}
                    hitSlop={8}
                    onPress={(event) => {
                      event.stopPropagation?.();
                      removePlayer(row.id);
                    }}
                    style={styles.removeBtn}
                  >
                    <X color={debateUi.muted} size={18} />
                  </Pressable>
                ) : (
                  <View style={styles.removePlaceholder} />
                )}
                <View style={styles.judgeToggle}>
                  <Text style={[styles.judgeLabel, isJudge && styles.judgeLabelOn]}>JUDGE</Text>
                  <View style={[styles.radio, isJudge && styles.radioOn]} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {!atMax ? (
          adding ? (
            <View style={styles.addInputRow}>
              <TextInput
                testID="pass-setup-name-input"
                value={draftName}
                onChangeText={(text) => {
                  setDraftName(text);
                  setNameError(null);
                }}
                onSubmitEditing={confirmAdd}
                placeholder="Name"
                placeholderTextColor={debateUi.muted}
                style={styles.addInput}
                accessibilityLabel="New player name"
                autoFocus
              />
              <Pressable
                accessibilityRole="button"
                onPress={confirmAdd}
                style={styles.addConfirm}
                testID="pass-setup-add-confirm"
              >
                <Text style={styles.addConfirmText}>ADD</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              testID="pass-setup-add"
              onPress={() => {
                setAdding(true);
                setNameError(null);
              }}
              style={styles.addBtn}
            >
              <Text style={styles.addBtnText}>+ ADD PLAYER</Text>
            </Pressable>
          )
        ) : null}

        <DebateGoldButton
          label="CONTINUE"
          disabled={!canContinue}
          onPress={start}
          testID="pass-setup-continue"
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  title: { ...typeScale.h2, color: palette.white },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 2,
    color: debateUi.muted,
  },
  helper: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: debateUi.muted,
  },
  notice: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    color: palette.coral,
  },
  list: { gap: spacing.sm },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: debateUi.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: debateUi.cardBorder,
    padding: spacing.md,
    minHeight: minTapTarget + 8,
  },
  playerRowJudge: { borderColor: debateUi.gold, borderWidth: 2 },
  playerName: { flex: 1, fontFamily: fontFamily.bodySemi, fontSize: 16, color: palette.white },
  removeBtn: {
    minWidth: minTapTarget,
    minHeight: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePlaceholder: { width: minTapTarget },
  judgeToggle: { alignItems: 'flex-end', gap: 4 },
  judgeLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10,
    letterSpacing: 1,
    color: debateUi.muted,
  },
  judgeLabelOn: { color: debateUi.gold },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: debateUi.muted,
  },
  radioOn: { borderColor: debateUi.gold, backgroundColor: debateUi.gold },
  addBtn: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: debateUi.cardBorder,
    minHeight: minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  addBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.8,
    color: debateUi.muted,
  },
  addInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: debateUi.cardBorder,
    padding: spacing.sm,
    backgroundColor: debateUi.card,
  },
  addInput: {
    flex: 1,
    minHeight: minTapTarget,
    paddingHorizontal: spacing.md,
    color: palette.white,
    fontFamily: fontFamily.body,
    fontSize: 16,
  },
  addConfirm: {
    minHeight: minTapTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: debateUi.cardBorder,
  },
  addConfirmText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.8,
    color: palette.white,
  },
});
