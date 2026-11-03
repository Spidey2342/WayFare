import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { authScreen } from '@/features/auth/authScreenTheme';
import { goBackOr } from '@/navigation/goBackOr';
import { fontFamily, minTapTarget } from '@/theme';

export function AuthBackLink({ fallback, label = 'Back' }: { fallback: Href; label?: string }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      onPress={() => goBackOr(router, fallback)}
      style={styles.hit}
    >
      <Text style={styles.label}>{`‹ ${label}`}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minHeight: minTapTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    color: authScreen.muted,
  },
});
