import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Switch, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { BackButton, Button, Screen, ScreenScroll, useToast } from '@/components/ui';
import { rpcCreateGroup } from '@/features/groups/api';
import { friendlyCreateGroupError } from '@/features/groups/groupErrors';
import {
  collapseWhitespace,
  GROUP_DESC_MAX,
  GROUP_NAME_MAX,
  GROUP_NAME_MIN,
} from '@/features/groups/normalize';
import { useSubmitRequestId } from '@/features/groups/useSubmitRequestId';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function CreateGroupScreen() {
  const router = useRouter();
  const toast = useToast();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getRequestId } = useSubmitRequestId(name, description, isPrivate);
  const submitLockRef = useRef(false);

  const nameClean = collapseWhitespace(name);
  const descClean = collapseWhitespace(description);

  const submit = useCallback(async () => {
    if (submitLockRef.current || loading) return;
    if (nameClean.length < GROUP_NAME_MIN) {
      setError(`Group name must be at least ${GROUP_NAME_MIN} characters.`);
      return;
    }
    if (nameClean.length > GROUP_NAME_MAX) {
      setError(`Group name must be ${GROUP_NAME_MAX} characters or less.`);
      return;
    }
    submitLockRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const result = await rpcCreateGroup(nameClean, descClean, isPrivate, getRequestId());
      if (result.alreadyExisted) {
        toast.show('You already created this group. Opening it now.');
      }
      router.replace(`/groups/${result.groupId}/lobby`);
    } catch (caught) {
      setError(friendlyCreateGroupError(caught));
    } finally {
      setLoading(false);
      submitLockRef.current = false;
    }
  }, [descClean, getRequestId, isPrivate, loading, nameClean, router, toast]);

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Cancel" fallback="/groups" />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>New group</Text>
        <AuthField
          label="GROUP NAME"
          value={name}
          onChangeText={setName}
          maxLength={GROUP_NAME_MAX}
        />
        <Text style={styles.counter}>
          {nameClean.length}/{GROUP_NAME_MAX} (min {GROUP_NAME_MIN})
        </Text>
        <AuthField
          label="DESCRIPTION"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={GROUP_DESC_MAX}
        />
        <Text style={styles.counter}>
          {descClean.length}/{GROUP_DESC_MAX}
        </Text>
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Private group</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} disabled={loading} />
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          Only people with a code can join.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Create group"
          variant="primary"
          loading={loading}
          disabled={loading}
          onPress={() => void submit()}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  counter: { fontFamily: fontFamily.body, fontSize: 12, color: palette.warmGray, marginTop: -8 },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
