import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { consumeAuthReturnTo } from '@/components/navigation/NavigationGuard';
import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { friendlyAuthError } from '@/features/auth/authErrors';
import { googleAuthEnabled, isSupabaseConfigured, requireSupabase } from '@/services/supabase';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        email: email.trim(),
        password,
      });
      if (signError) throw signError;
      await consumeAuthReturnTo(router);
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
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Welcome back</Text>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
          Sign in with your account
        </Text>
        <AuthField
          label="EMAIL"
          value={email}
          keyboardType="email-address"
          autoCapitalize="none"
          onChangeText={setEmail}
        />
        <View style={styles.passwordHead}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <Pressable onPress={() => router.push('/auth/reset-password')}>
            <Text style={styles.forgot}>Forgot password?</Text>
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
        <Button
          label="Sign in"
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
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  passwordHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
    color: palette.warmGray,
  },
  forgot: { fontFamily: fontFamily.bodySemi, color: palette.blue, fontSize: 13 },
  toggle: { fontFamily: fontFamily.bodySemi, color: palette.blue, fontSize: 14 },
  error: { color: palette.coral, fontFamily: fontFamily.body },
});
