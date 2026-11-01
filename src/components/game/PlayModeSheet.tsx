import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button } from '@/components/ui';
import type { PlayMode } from '@/features/auth/routing';
import { fontFamily, spacing, useTheme } from '@/theme';

const options: { id: PlayMode; title: string; body: string }[] = [
  { id: 'solo', title: 'Solo', body: 'Just you, at your own pace.' },
  { id: 'pass', title: 'Same phone', body: 'Pass one phone around the room.' },
  {
    id: 'online',
    title: 'With friends online',
    body: 'Everyone on their own phone, join with a code.',
  },
];

type PlayModeSheetProps = {
  open: boolean;
  onClose: () => void;
  onPick: (mode: PlayMode) => void;
};

export function PlayModeSheet({ open, onClose, onPick }: PlayModeSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={open} onClose={onClose} title="How do you want to play?">
      <View style={styles.body}>
        {options.map((option) => (
          <View key={option.id} style={styles.option}>
            <Button label={option.title} variant="secondary" onPress={() => onPick(option.id)} />
            <Text style={[styles.copy, { color: colors.textSecondary }]}>{option.body}</Text>
          </View>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingBottom: spacing.md },
  option: { gap: 4 },
  copy: { fontFamily: fontFamily.body, fontSize: 13, lineHeight: 18 },
});
