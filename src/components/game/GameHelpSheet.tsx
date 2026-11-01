import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet, Button } from '@/components/ui';
import { fontFamily, spacing, useTheme } from '@/theme';

type GameHelpSheetProps = {
  open: boolean;
  onClose: () => void;
  lines: string[];
};

export function GameHelpSheet({ open, onClose, lines }: GameHelpSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={open} onClose={onClose} title="How to play">
      <View style={styles.body}>
        {lines.map((line) => (
          <Text key={line} style={[styles.line, { color: colors.textPrimary }]}>
            {line}
          </Text>
        ))}
        <Button label="Got it" variant="primary" onPress={onClose} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingBottom: spacing.lg },
  line: { fontFamily: fontFamily.body, fontSize: 16, lineHeight: 24 },
});
