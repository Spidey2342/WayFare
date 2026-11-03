import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { consumeAuthReturnTo } from '@/components/navigation/NavigationGuard';
import { AuthBackLink } from '@/components/auth/AuthBackLink';
import { Button, Screen, ScreenScroll } from '@/components/ui';
import { friendlyAuthError } from '@/features/auth/authErrors';
import {
  clearLastUsedEmail,
  readLastUsedEmail,
  writeLastUsedEmail,
} from '@/features/auth/lastUsedEmail';
import { normalizeEmail } from '@/features/auth/normalizeEmail';
import { googleAuthEnabled, isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { authScreen } from '@/features/auth/authScreenTheme';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(() => (typeof params.email === 'string' ? params.email : ''));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remembered, setRemembered] = useState(false);

  useEffect(() => {
    if (typeof params.email === 'string' && params.email.length > 0) return;
    void readLastUsedEmail().then((saved) => {
      if (saved) {
        setEmail(saved);
        setRemembered(true);
      }
    });
  }, [params.email]);

  const submit = async () => {
    if (!isSupabaseConfigured) {
      setError(
        'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (not .env.example), then restart Expo.',
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: signError } = await requireSupabase().auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (signError) throw signError;
      await writeLastUsedEmail(normalizeEmail(email));
      await consumeAuthReturnTo(router);
    } catch (caught) {
      setError(friendlyAuthError(caught));
    } finally {
      setLoading(false);
    }
  };

  const displayName = email.trim().split('@')[0]?.replace(/\./g, ' ').split(' ')[0] ?? 'Player';
  const welcomeTitle = remembered
    ? `Welcome back, ${displayName.charAt(0).toUpperCase()}${displayName.slice(1)}!`
    : 'Welcome back';

  return (
    <Screen background={authScreen.bg} gutter={authScreen.bg}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <AuthBackLink fallback="/auth/welcome" />
        <Text style={[typeScale.h1, { color: authScreen.text }]}>{welcomeTitle}</Text>
        {remembered ? (
          <View style={styles.emailRow}>
            <Text style={styles.emailText}>{email}</Text>
            <Pressable
              onPress={() => {
                void clearLastUsedEmail();
                setEmail('');
                setRemembered(false);
              }}
            >
              <Text style={styles.notYou}>NOT YOU?</Text>
            </Pressable>
          </View>
        ) : (
          <AuthField
            label="EMAIL ADDRESS"
            value={email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={setEmail}
          />
        )}
        <View style={styles.passwordHead}>
          <Text style={styles.fieldLabel}>YOUR PASSWORD</Text>
          <Pressable onPress={() => router.push('/auth/reset-password')}>
            <Text style={styles.forgotCaps}>FORGOT PASSWORD?</Text>
          </Pressable>
        </View>
        <AuthField
          label=""
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
        />
        <Pressable accessibilityRole="button" onPress={() => setShowPassword((v) => !v)}>
          <Text style={styles.toggle}>{showPassword ? 'Hide password' : 'Show password'}</Text>
        </Pressable>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label="LOG IN" variant="gold" disabled={loading} onPress={() => void submit()} />
        {googleAuthEnabled ? (
          <Button
            label="Continue with Google"
            variant="secondary"
            disabled={loading}
            onPress={() => {}}
          />
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  passwordHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  emailText: { fontFamily: fontFamily.body, color: authScreen.muted, fontSize: 15 },
  notYou: {
    fontFamily: fontFamily.bodySemi,
    color: authScreen.gold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  fieldLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: authScreen.muted,
  },
  forgotCaps: {
    fontFamily: fontFamily.bodySemi,
    color: authScreen.muted,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  toggle: { fontFamily: fontFamily.bodySemi, color: authScreen.gold, fontSize: 14 },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
