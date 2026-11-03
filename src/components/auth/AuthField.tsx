import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { AUTH_LOOK, authScreen } from '@/features/auth/authScreenTheme';
import { fontFamily, palette, radii, spacing, typeScale, useTheme } from '@/theme';

type AuthFieldProps = TextInputProps & {
  label: string;
  error?: string | null;
};

export function AuthField({ label, error, style, ...rest }: AuthFieldProps) {
  const { colors } = useTheme();
  const dark = AUTH_LOOK === 'dark';
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, dark && { color: authScreen.muted }]}>{label}</Text>
      <TextInput
        placeholderTextColor={dark ? authScreen.muted : palette.warmGray}
        style={[
          styles.input,
          dark
            ? {
                color: authScreen.text,
                borderColor: error ? authScreen.error : authScreen.border,
                backgroundColor: authScreen.inputBg,
              }
            : { color: colors.textPrimary, borderColor: error ? palette.coral : colors.border },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    ...typeScale.caption,
    color: palette.warmGray,
    letterSpacing: 0.6,
    fontFamily: fontFamily.bodySemi,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 16,
    backgroundColor: palette.white,
  },
  error: { color: palette.coral, fontFamily: fontFamily.body, fontSize: 13 },
});
