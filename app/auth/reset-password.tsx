import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { friendlyAuthError } from '@/features/auth/authErrors';
import { authScreen } from '@/features/auth/authScreenTheme';
import { normalizeEmail } from '@/features/auth/normalizeEmail';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, spacing, typeScale } from '@/theme';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isSupabaseConfigured) {
      setError('Reset needs Supabase configured in .env.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const { error: resetError } = await requireSupabase().auth.resetPasswordForEmail(
        normalizeEmail(email),
      );
      if (resetError) throw resetError;
      setMessage('If that email exists, we sent a reset link.');
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen background={authScreen.bg} gutter={authScreen.bg}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/auth/sign-in" />
        <Text style={[typeScale.h1, { color: authScreen.text }]}>Reset your password</Text>
        <Text style={styles.lead}>
          Enter your email and we will send a link to choose a new password.
        </Text>
        <AuthField
          label="EMAIL"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        {message ? <Text style={styles.ok}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Send reset link"
          variant="gold"
          disabled={loading}
          onPress={() => void submit()}
        />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  lead: { color: authScreen.muted, fontFamily: fontFamily.body, lineHeight: 22 },
  ok: { color: authScreen.gold, fontFamily: fontFamily.body },
  error: { color: authScreen.error, fontFamily: fontFamily.body },
});
