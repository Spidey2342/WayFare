import { StyleSheet, Text, View } from 'react-native';

import { fontFamily, palette } from '@/theme';

export function Avatar({
  name,
  color = palette.gold,
  size = 40,
  ring = false,
}: {
  name: string;
  color?: string;
  size?: number;
  ring?: boolean;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        ring && styles.ring,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

export function AvatarStack({
  people,
  extra = 0,
}: {
  people: readonly { name: string; color: string }[];
  extra?: number;
}) {
  return (
    <View style={styles.stack} accessibilityLabel={`${people.length + extra} people`}>
      {people.map((person, index) => (
        <View key={`${person.name}-${index}`} style={{ marginLeft: index === 0 ? 0 : -10 }}>
          <Avatar name={person.name} color={person.color} size={32} ring />
        </View>
      ))}
      {extra > 0 ? (
        <View style={[styles.extra, { marginLeft: -10 }]}>
          <Text style={styles.extraText}>+{extra}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: 2,
    borderColor: palette.white,
  },
  initial: {
    fontFamily: fontFamily.heading,
    color: palette.midnight,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extra: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.midnight,
    borderWidth: 2,
    borderColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    color: palette.white,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
  },
});
