import { StyleSheet, Text, View } from 'react-native';
import { Compass } from 'lucide-react-native';

import { fontFamily, palette } from '@/theme';

export function Logo({ size = 84 }: { size?: number }) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.tile, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <Compass color={palette.midnight} size={size * 0.48} strokeWidth={2.4} />
      </View>
      <Text style={styles.word}>WAYFARE</Text>
      <View style={styles.rule} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  tile: {
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 4,
    borderBottomColor: palette.goldDeep,
  },
  word: {
    fontFamily: fontFamily.display,
    color: palette.white,
    fontSize: 32,
    letterSpacing: 4,
  },
  rule: {
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.gold,
    marginTop: -6,
  },
});
