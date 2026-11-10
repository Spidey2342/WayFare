import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Logo } from '@/components/ui';
import { authScreen } from '@/features/auth/authScreenTheme';
import { palette, spacing } from '@/theme';

export function AuthSessionSplash() {
  return (
    <View style={styles.root}>
      <Logo />
      <ActivityIndicator color={palette.gold} size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: authScreen.bg,
  },
  spinner: { marginTop: spacing.md },
});
