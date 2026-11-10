import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { AuthField } from '@/components/auth/AuthField';
import { Avatar, Button, Screen, ScreenScroll } from '@/components/ui';
import { authScreen } from '@/features/auth/authScreenTheme';
import { fontFamily, palette, spacing, typeScale } from '@/theme';

export default function AuthFrameDevScreen() {
  const params = useLocalSearchParams<{ frame: string }>();
  const frame = (typeof params.frame === 'string' ? params.frame : 'A1').toUpperCase();

  if (frame === 'A2') {
    return (
      <Screen background={authScreen.bg} gutter={authScreen.bg}>
        <ScreenScroll contentContainerStyle={styles.content}>
          <Avatar name="Alex" color={palette.gold} size={72} />
          <Text style={styles.title}>Welcome back, Alex!</Text>
          <Text style={styles.muted}>alex@example.com</Text>
          <Text style={styles.link}>NOT YOU?</Text>
          <AuthField
            label="YOUR PASSWORD"
            value=""
            onChangeText={() => undefined}
            secureTextEntry
          />
          <Text style={styles.link}>FORGOT PASSWORD?</Text>
          <Button label="LOG IN" variant="gold" onPress={() => undefined} />
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen background={authScreen.bg} gutter={authScreen.bg}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.muted}>Join the world&apos;s sharpest debating community.</Text>
        <AuthField label="EMAIL ADDRESS" value="" onChangeText={() => undefined} />
        <View style={styles.notice}>
          <Text style={styles.noticeText}>You already have an account. Log in instead</Text>
        </View>
        <AuthField label="FULL NAME" value="" onChangeText={() => undefined} />
        <Button label="CONTINUE" variant="gold" onPress={() => undefined} />
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48, alignItems: 'stretch' },
  title: { ...typeScale.h2, color: authScreen.text, textAlign: 'center' },
  muted: { fontFamily: fontFamily.body, color: authScreen.muted, textAlign: 'center' },
  link: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: authScreen.gold,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: '#2A1218',
    borderRadius: 12,
    padding: spacing.md,
  },
  noticeText: { fontFamily: fontFamily.body, color: '#FF5C5C', fontSize: 14 },
});
