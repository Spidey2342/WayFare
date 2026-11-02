import { useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { rpcJoinGroup } from '@/features/groups/api';
import { friendlyJoinGroupError } from '@/features/groups/groupErrors';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

const BOXES = 6;

export default function JoinGroupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [chars, setChars] = useState<string[]>(Array(BOXES).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const code = chars.join('');

  const setAt = (index: number, value: string) => {
    const letter = value
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-1)
      .toUpperCase();
    const next = [...chars];
    next[index] = letter;
    setChars(next);
  };

  const submit = useCallback(async () => {
    if (inFlight.current || loading) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const groupId = await rpcJoinGroup(code);
      router.replace(`/groups/${groupId}/lobby`);
    } catch (caught) {
      setError(friendlyJoinGroupError(caught));
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [code, loading, router]);

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/groups" />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Enter group code</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body, lineHeight: 22 }}>
          Ask your leader for the 6-character code.
        </Text>
        <View style={styles.boxes}>
          {chars.map((char, index) => (
            <TextInput
              key={index}
              value={char}
              editable={!loading}
              onChangeText={(value) => setAt(index, value)}
              autoCapitalize="characters"
              maxLength={1}
              style={[styles.box, { borderColor: colors.border, color: colors.textPrimary }]}
            />
          ))}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Join group"
          variant="primary"
          loading={loading}
          disabled={loading || code.length !== BOXES}
          onPress={() => void submit()}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  boxes: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  box: {
    width: 44,
    height: 52,
    borderWidth: 1,
    borderRadius: radii.md,
    textAlign: 'center',
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
  },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
