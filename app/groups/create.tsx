import { useState } from 'react';
import { StyleSheet, Switch, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { rpcCreateGroup } from '@/features/groups/api';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError('Add a group name.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = await rpcCreateGroup(name.trim(), description.trim(), isPrivate);
      router.replace(`/groups/${id}/lobby`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not create group.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Cancel" fallback="/groups" />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>New group</Text>
        <AuthField label="GROUP NAME" value={name} onChangeText={setName} />
        <AuthField
          label="DESCRIPTION"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Private group</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} />
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          Only people with a code can join.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Create group"
          variant="primary"
          disabled={loading}
          onPress={() => void submit()}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
