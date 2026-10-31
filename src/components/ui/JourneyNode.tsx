import { StyleSheet, Text, View } from 'react-native';
import { Check, Lock, MapPin } from 'lucide-react-native';

import { fontFamily, palette } from '@/theme';

export type JourneyNodeState = 'complete' | 'current' | 'locked';

export function JourneyNode({
  label,
  state,
  caption,
}: {
  label: string;
  state: JourneyNodeState;
  caption?: string;
}) {
  const bg = state === 'current' ? palette.gold : state === 'complete' ? palette.teal : '#E6E8EE';
  const ink = state === 'locked' ? palette.warmGray : palette.midnight;
  return (
    <View style={styles.wrap} accessibilityLabel={`${label}, ${state}`}>
      <View style={[styles.node, { backgroundColor: bg }]}>
        {state === 'complete' ? <Check color={palette.white} size={18} /> : null}
        {state === 'current' ? <Text style={styles.current}>{label}</Text> : null}
        {state === 'locked' ? <Lock color={palette.warmGray} size={16} /> : null}
        {state === 'current' ? (
          <MapPin color={palette.midnight} size={14} style={styles.pin} />
        ) : null}
      </View>
      {state !== 'current' ? <Text style={[styles.label, { color: ink }]}>{label}</Text> : null}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 88, gap: 6 },
  node: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  current: {
    fontFamily: fontFamily.heading,
    color: palette.midnight,
    fontSize: 16,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    textAlign: 'center',
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: palette.warmGray,
    textAlign: 'center',
  },
  pin: { position: 'absolute', top: -16 },
});
