import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { rpcJoinSessionByCode } from '@/features/debate/api';
import { isSupabaseConfigured } from '@/services/supabase';
import { palette, radii, spacing, typeScale } from '@/theme';

export default function JoinDebateScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const join = async () => {
    setError(null);
    setLoading(true);
    try {
      const sessionId = await rpcJoinSessionByCode(code.trim());
      router.replace({ pathname: '/debate/[sessionId]', params: { sessionId } });
    } catch {
      setError('Could not join. Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <Screen>
        <Text style={typeScale.h2}>Add Supabase keys in .env to join online debates.</Text>
      </Screen>
    );
  }

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/debate" />
        <Text style={typeScale.h1}>Join debate</Text>
        <Text style={styles.lead}>Enter the 6-character room code from your host.</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          maxLength={6}
          style={styles.input}
          accessibilityLabel="Room code"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={loading ? 'Joining…' : 'Join room'}
          variant="gold"
          disabled={loading}
          onPress={() => void join()}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  lead: { ...typeScale.bodyM, color: palette.warmGray },
  input: {
    letterSpacing: 4,
    fontSize: 22,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: radii.card,
    padding: spacing.md,
    backgroundColor: palette.white,
  },
  error: { color: palette.coral, fontFamily: typeScale.bodyM.fontFamily },
});
