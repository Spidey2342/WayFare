import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthField } from '@/components/auth/AuthField';
import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { friendlyAuthError } from '@/features/auth/authErrors';
import { normalizeEmail } from '@/features/auth/normalizeEmail';
import { isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
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
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/auth/sign-in" />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Reset your password</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body, lineHeight: 22 }}>
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
  ok: { color: palette.teal, fontFamily: fontFamily.body },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
