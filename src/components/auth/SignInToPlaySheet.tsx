import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BottomSheet, Button } from '@/components/ui';
import { fontFamily, spacing, useTheme } from '@/theme';

type SignInToPlaySheetProps = {
  open: boolean;
  onClose: () => void;
};

export function SignInToPlaySheet({ open, onClose }: SignInToPlaySheetProps) {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <BottomSheet visible={open} onClose={onClose} title="Sign in to play with friends">
      <View style={styles.body}>
        <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body, lineHeight: 22 }}>
          Groups and online play need a free account so everyone can join with a code.
        </Text>
        <Button
          label="Sign in"
          variant="primary"
          onPress={() => {
            onClose();
            router.push('/auth/sign-in');
          }}
        />
        <Button
          label="Create account"
          variant="secondary"
          onPress={() => {
            onClose();
            router.push('/auth/sign-up');
          }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm, paddingBottom: spacing.lg },
});
