import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button } from '@/components/ui';
import { fontFamily, palette, spacing } from '@/theme';

type Props = {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function LeaveGameSheet({ visible, onStay, onLeave }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onStay} title="Leave this game?">
      <Text style={styles.body}>Leaving abandons the game with no XP.</Text>
      <View style={styles.actions}>
        <Button label="Stay" variant="gold" onPress={onStay} />
        <Button label="Leave" variant="secondary" onPress={onLeave} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: palette.warmGray,
    marginBottom: spacing.md,
  },
  actions: { gap: spacing.sm },
});
