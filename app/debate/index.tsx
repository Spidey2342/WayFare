import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackButton, Button, Screen, ScreenScroll } from '@/components/ui';
import { palette, spacing, typeScale } from '@/theme';

export default function DebateHubScreen() {
  const router = useRouter();

  return (
    <Screen background={palette.offWhite} gutter={palette.offWhite}>
      <ScreenScroll contentContainerStyle={styles.content}>
        <BackButton label="Back" fallback="/home" />
        <Text style={typeScale.h1}>Debate</Text>
        <Text style={styles.lead}>Argue both sides, vote for the most convincing voice.</Text>
        <View style={styles.actions}>
          <Button
            label="Solo practice"
            variant="primary"
            onPress={() => router.push('/debate/solo')}
          />
          <Button
            label="Same phone"
            variant="secondary"
            onPress={() => router.push('/debate/pass/setup')}
          />
          <Button
            label="Join online room"
            variant="gold"
            onPress={() => router.push('/debate/join')}
          />
        </View>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 48 },
  lead: { ...typeScale.bodyM, color: palette.warmGray },
  actions: { gap: spacing.sm, marginTop: spacing.md },
});
