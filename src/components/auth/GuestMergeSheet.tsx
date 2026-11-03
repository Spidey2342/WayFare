import { Layers, Medal, Zap } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { authScreen } from '@/features/auth/authScreenTheme';
import { BottomSheet, Button } from '@/components/ui';
import { fontFamily, palette, radii, spacing, typeScale } from '@/theme';

type Props = {
  open: boolean;
  xp: number;
  badgeCount: number;
  loading?: boolean;
  onKeep: () => void;
  onStartFresh: () => void;
};

/** Frame A3 — Keep your XP and badges? */
export function GuestMergeSheet({ open, xp, badgeCount, loading, onKeep, onStartFresh }: Props) {
  return (
    <BottomSheet visible={open} onClose={onStartFresh} title="">
      <View style={styles.wrap}>
        <View style={styles.iconCircle}>
          <Layers color={authScreen.gold} size={28} />
        </View>
        <Text style={styles.title}>Keep your XP and badges?</Text>
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Zap color={authScreen.gold} size={16} />
            <Text style={styles.statText}>{xp.toLocaleString()} XP</Text>
          </View>
          <View style={styles.statChip}>
            <Medal color={authScreen.gold} size={16} />
            <Text style={styles.statText}>
              {badgeCount} Badge{badgeCount === 1 ? '' : 's'}
            </Text>
          </View>
        </View>
        <Text style={styles.body}>
          We found guest progress on this device. Would you like to merge it with your account?
        </Text>
        <Button
          label="KEEP MY PROGRESS"
          variant="gold"
          loading={loading}
          disabled={loading}
          onPress={onKeep}
        />
        <Text accessibilityRole="button" onPress={onStartFresh} style={styles.fresh}>
          START FRESH
        </Text>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingBottom: spacing.lg, alignItems: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: authScreen.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: authScreen.border,
  },
  title: { ...typeScale.h2, color: palette.white, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: authScreen.card,
  },
  statText: { fontFamily: fontFamily.bodySemi, color: authScreen.muted, fontSize: 14 },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: authScreen.muted,
    textAlign: 'center',
  },
  fresh: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    letterSpacing: 1,
    color: authScreen.muted,
    marginTop: spacing.sm,
  },
});
