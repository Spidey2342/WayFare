import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Hand } from 'lucide-react-native';

import { Button, Screen } from '@/components/ui';
import { fontFamily, palette, spacing, typeScale, useTheme } from '@/theme';

export default function Under13Screen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Hand color={palette.white} size={32} />
        </View>
        <Text style={[typeScale.h1, { color: colors.textPrimary }]}>Hold on a moment</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          Wayfare is only available for users 13 and older. It looks like you are not there yet.
        </Text>
        <Text style={styles.shout}>
          Please ask a parent or leader to help you create an account.
        </Text>
        <Button
          label="Ask a parent or leader"
          variant="primary"
          onPress={() => router.replace('/auth/welcome')}
        />
        <Button
          label="I am actually over 13"
          variant="ghost"
          onPress={() => router.replace('/auth/sign-up')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, padding: spacing.xl, gap: spacing.md, justifyContent: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.coral,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  bodyText: { fontFamily: fontFamily.body, lineHeight: 24, textAlign: 'center' },
  shout: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    letterSpacing: 0.4,
    textAlign: 'center',
    color: palette.warmGray,
  },
});
