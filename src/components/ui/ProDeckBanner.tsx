import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bus } from 'lucide-react-native';

import { fontFamily, palette, radii, spacing } from '@/theme';

export function ProDeckBanner({ onPress }: { onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Outing mixed deck, pro"
      onPress={onPress}
      style={styles.banner}
    >
      <View style={styles.icon}>
        <Bus color={palette.midnight} size={22} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.kicker}>PRO</Text>
        <Text style={styles.title}>Outing (Mixed)</Text>
        <Text style={styles.body}>
          A mixed deck for trips and youth nights. Coming in a later update.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: palette.midnight,
    borderRadius: radii.card,
    padding: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    minHeight: 112,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    color: palette.gold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    color: palette.white,
    fontSize: 18,
  },
  body: {
    fontFamily: fontFamily.body,
    color: '#C9CDD6',
    fontSize: 13,
    lineHeight: 18,
  },
});
