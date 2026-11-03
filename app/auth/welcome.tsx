import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Logo, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { authScreen } from '@/features/auth/authScreenTheme';
import { fontFamily, spacing } from '@/theme';

export default function AuthWelcomeScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuth();

  return (
    <Screen background={authScreen.bg} gutter={authScreen.bg}>
      <View style={styles.body}>
        <Logo />
        <Text style={styles.title}>Wayfare</Text>
        <Text style={styles.tagline}>Build a habit. Enjoy the journey.</Text>
        <Button
          label="Create account"
          variant="gold"
          onPress={() => router.push('/auth/sign-up')}
        />
        <Button label="Sign in" variant="secondary" onPress={() => router.push('/auth/sign-in')} />
        <Button
          label="Continue without signing in"
          variant="ghost"
          onPress={() => {
            continueAsGuest();
            router.replace('/welcome');
          }}
        />
        <Text style={styles.legal}>By continuing you agree to our Terms and Privacy Policy.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 28,
    color: authScreen.text,
  },
  tagline: {
    fontFamily: fontFamily.body,
    color: authScreen.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  legal: {
    fontFamily: fontFamily.body,
    color: authScreen.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
