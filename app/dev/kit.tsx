import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, spacing, typeScale, useTheme } from '@/theme';

const swatches = [
  ['Deep Midnight', palette.midnight],
  ['Warm Gold', palette.gold],
  ['Coral', palette.coral],
  ['Soft Teal', palette.teal],
  ['Electric Blue', palette.blue],
  ['Soft Purple', palette.purple],
  ['Off-white', palette.offWhite],
  ['Warm Gray', palette.warmGray],
] as const;

export default function DevKitScreen() {
  const { colors, mode } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.kicker, { color: palette.goldDeep }]}>WAYFARE</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Design kit</Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Token preview. Mode: {mode}. Components land in the next stage.
        </Text>
        <View style={styles.grid}>
          {swatches.map(([name, color]) => (
            <View key={name} style={[styles.swatch, { backgroundColor: colors.surface }]}>
              <View style={[styles.chip, { backgroundColor: color }]} />
              <Text style={[styles.swatchName, { color: colors.textPrimary }]}>{name}</Text>
              <Text style={[styles.swatchHex, { color: colors.textSecondary }]}>{color}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.typeCard, { backgroundColor: colors.surface }]}>
          <Text style={[typeScale.display, { color: colors.textPrimary, fontSize: 40 }]}>
            Fearfully & Wonderfully
          </Text>
          <Text style={[typeScale.h2, { color: colors.textPrimary }]}>Journey of Faith</Text>
          <Text style={[typeScale.h3, { color: colors.textPrimary }]}>Connect & Discover</Text>
          <Text style={[typeScale.bodyL, { color: colors.textSecondary }]}>
            Wayfare is a bridge to honest conversations and spiritual growth with your community.
          </Text>
          <Text style={[typeScale.caption, { color: colors.textSecondary }]}>
            Level 4 · Disciple
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.md },
  kicker: { ...typeScale.caption },
  title: { ...typeScale.h1 },
  note: { ...typeScale.bodyM },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: '47%', borderRadius: 16, padding: spacing.sm, gap: spacing.xs },
  chip: { height: 56, borderRadius: 12 },
  swatchName: { fontFamily: typeScale.bodyS.fontFamily, fontSize: 14 },
  swatchHex: { ...typeScale.caption },
  typeCard: { borderRadius: 28, padding: spacing.xl, gap: spacing.sm },
});
