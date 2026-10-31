import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export function Screen({
  children,
  background,
  gutter,
  edges = ['top', 'bottom'],
  style,
}: {
  children: ReactNode;
  background?: string;
  gutter?: string;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.gutter, { backgroundColor: gutter ?? colors.background }]}>
      <SafeAreaView
        edges={edges}
        style={[styles.frame, { backgroundColor: background ?? colors.background }, style]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gutter: {
    flex: 1,
    alignItems: 'center',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
  },
});
