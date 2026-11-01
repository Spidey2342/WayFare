import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

import { ProgressBar } from '@/components/ui';
import {
  checklistItems,
  checklistProgress,
  routeForChecklistItem,
  type ChecklistItemId,
} from '@/features/onboarding/checklist';
import { useAppStore } from '@/store';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

export function StartHereChecklist() {
  const router = useRouter();
  const { colors } = useTheme();
  const checklist = useAppStore((state) => state.checklist);
  const dismissChecklist = useAppStore((state) => state.dismissChecklist);
  const progress = checklistProgress(checklist);

  if (!progress.visible) return null;

  const open = (id: ChecklistItemId) => {
    router.push(routeForChecklistItem(id));
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.head}>
        <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Start here</Text>
        <Pressable accessibilityRole="button" onPress={dismissChecklist}>
          <Text style={styles.dismiss}>Dismiss</Text>
        </Pressable>
      </View>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.body }}>
        Four quick steps so you always know what to do next.
      </Text>
      <ProgressBar progress={progress.done / progress.total} />
      <Text style={styles.meta}>
        {progress.done}/{progress.total} complete
      </Text>
      {checklistItems(checklist).map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={() => open(item.id)}
          style={[styles.row, { borderColor: colors.border }]}
        >
          <View style={[styles.bullet, item.done && styles.bulletDone]} />
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{item.label}</Text>
          <ChevronRight color={palette.warmGray} size={18} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dismiss: { fontFamily: fontFamily.bodySemi, color: palette.blue, fontSize: 14 },
  meta: { ...typeScale.caption, color: palette.warmGray },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bullet: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: palette.warmGray,
  },
  bulletDone: { backgroundColor: palette.teal, borderColor: palette.teal },
  rowLabel: { flex: 1, fontFamily: fontFamily.bodySemi, fontSize: 15 },
});
