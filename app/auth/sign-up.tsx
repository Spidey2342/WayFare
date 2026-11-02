import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { friendlyAuthError } from '@/features/auth/authErrors';
import { suggestEmailDomain } from '@/features/auth/emailTypoSuggest';
import { normalizeEmail } from '@/features/auth/normalizeEmail';
import { writeLastUsedEmail } from '@/features/auth/lastUsedEmail';
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
  const [duplicateNotice, setDuplicateNotice] = useState(false);
  const [typoDismissed, setTypoDismissed] = useState(false);

  const typoSuggestion = useMemo(() => {
    if (typoDismissed) return null;
    return suggestEmailDomain(email);
  }, [email, typoDismissed]);

  const submit = async () => {
    if (!ageConfirmed) {
      router.push('/auth/under-13');
      return;
    }
    if (!isSupabaseConfigured) {
      setError(
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (not .env.example), then restart Expo.',
      );
      return;
    }
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    setDuplicateNotice(false);
    try {
      const client = requireSupabase();
      const normalizedEmail = normalizeEmail(email);
      const { data, error: signError } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { display_name: displayName.trim().replace(/\s+/g, ' ') || 'Player' },
        },
      });
      if (signError) throw signError;
      const identities = data.user?.identities ?? [];
      if (identities.length === 0) {
        setDuplicateNotice(true);
        return;
      }
      await writeLastUsedEmail(normalizedEmail);
      router.replace('/auth/profile-setup');
    } catch (caught) {
      const friendly = friendlyAuthError(caught);
      if (friendly.toLowerCase().includes('already')) {
        setDuplicateNotice(true);
        return;
      }
      setError(friendly);
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
          onChangeText={(value) => {
            setEmail(value);
            setTypoDismissed(false);
          }}
          placeholder="mail@example.com"
        />
        {typoSuggestion ? (
          <View style={styles.typoBox}>
            <Text style={styles.typoText}>Did you mean {typoSuggestion}?</Text>
            <View style={styles.typoActions}>
              <Pressable onPress={() => setEmail(typoSuggestion)}>
                <Text style={styles.link}>Yes, use it</Text>
              </Pressable>
              <Pressable onPress={() => setTypoDismissed(true)}>
                <Text style={styles.linkMuted}>No</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
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
        {duplicateNotice ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>You already have an account.</Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/auth/sign-in',
                  params: { email: normalizeEmail(email) },
                })
              }
            >
              <Text style={styles.link}>Log in instead</Text>
            </Pressable>
          </View>
        ) : null}
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
  notice: { gap: spacing.xs },
  noticeText: { fontFamily: fontFamily.body, color: palette.ink },
  typoBox: { gap: spacing.xs },
  typoText: { fontFamily: fontFamily.body, color: palette.warmGray },
  typoActions: { flexDirection: 'row', gap: spacing.md },
  footer: { textAlign: 'center', fontFamily: fontFamily.body, color: palette.warmGray },
  link: { color: palette.blue, fontFamily: fontFamily.bodySemi },
  linkMuted: { color: palette.warmGray, fontFamily: fontFamily.bodySemi },
});
