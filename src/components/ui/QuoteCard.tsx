import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Share2 } from 'lucide-react-native';

import { fontFamily, minTapTarget, palette, radii, shadows, spacing, useTheme } from '@/theme';

export function QuoteCard({
  verse,
  reference,
  onShare,
}: {
  verse: string;
  reference: string;
  onShare?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }, shadows.soft]}>
      <Text style={[styles.kicker, { color: colors.textSecondary }]}>Verse of the day</Text>
      <Text selectable style={[styles.verse, { color: colors.textPrimary }]}>
        {verse}
      </Text>
      <View style={styles.row}>
        <Text style={styles.reference}>{reference}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share verse"
          onPress={onShare}
          style={styles.share}
        >
          <Share2 color={palette.midnight} size={18} />
        </Pressable>
      </View>
      <Text style={styles.translation}>King James Version</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  kicker: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  verse: {
    fontFamily: fontFamily.scripture,
    fontSize: 18,
    lineHeight: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reference: {
    fontFamily: fontFamily.bodySemi,
    color: palette.warmGray,
    fontSize: 13,
  },
  share: {
    width: minTapTarget,
    height: minTapTarget,
    borderRadius: 16,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translation: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: palette.warmGray,
  },
});
