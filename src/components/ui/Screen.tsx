import type { ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

const webRoot = Platform.OS === 'web' ? ({ height: '100%', minHeight: 0 } as const) : null;

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
    <View style={[styles.gutter, webRoot, { backgroundColor: gutter ?? colors.background }]}>
      <SafeAreaView
        edges={edges}
        style={[styles.frame, webRoot, { backgroundColor: background ?? colors.background }, style]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Vertical scroll that fills the screen — required for web when content exceeds the viewport. */
export function ScreenScroll({ children, contentContainerStyle, style, ...rest }: ScrollViewProps) {
  return (
    <ScrollView
      style={[styles.scroll, style]}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      {...rest}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  gutter: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    overflow: 'hidden',
  },
  frame: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    maxWidth: 440,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
});
