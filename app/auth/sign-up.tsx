import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { friendlyAuthError } from '@/features/auth/authErrors';
import { googleAuthEnabled, isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!ageConfirmed) {
      router.push('/auth/under-13');
      return;
    }
    if (!isSupabaseConfigured) {
      setError('Sign-up needs Supabase configured in .env on this build.');
      return;
    }
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const client = requireSupabase();
      const { error: signError } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName.trim() || 'Player' },
        },
      });
      if (signError) throw signError;
      router.replace('/auth/profile-setup');
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/auth/welcome" />
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Join the journey</Text>
        <AuthField
          label="DISPLAY NAME"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          placeholder="e.g. John D."
        />
        <AuthField
          label="EMAIL"
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
          placeholder="mail@example.com"
        />
        <AuthField
          label="PASSWORD"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
        />
        <Pressable accessibilityRole="button" onPress={() => setShowPassword((v) => !v)}>
          <Text style={styles.toggle}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: ageConfirmed }}
          onPress={() => setAgeConfirmed((v) => !v)}
          style={styles.checkRow}
        >
          <View style={[styles.check, ageConfirmed && styles.checkOn]} />
          <Text style={[styles.checkLabel, { color: colors.textSecondary }]}>
            I confirm that I am 13 or older and agree to the terms and privacy policy.
          </Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Create account"
          variant="primary"
          disabled={loading}
          onPress={() => void submit()}
        />
        {googleAuthEnabled ? (
          <Button
            label="Continue with Google"
            variant="secondary"
            disabled={loading}
            onPress={() => {}}
          />
        ) : null}
        <Text style={styles.footer}>
          Already have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/auth/sign-in')}>
            Sign in
          </Text>
        </Text>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  toggle: { fontFamily: fontFamily.bodySemi, color: palette.blue, fontSize: 14 },
  checkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.warmGray,
    marginTop: 2,
  },
  checkOn: { backgroundColor: palette.teal, borderColor: palette.teal },
  checkLabel: { flex: 1, fontFamily: fontFamily.body, lineHeight: 22 },
  error: { color: palette.coral, fontFamily: fontFamily.body },
  footer: { textAlign: 'center', fontFamily: fontFamily.body, color: palette.warmGray },
  link: { color: palette.blue, fontFamily: fontFamily.bodySemi },
});
