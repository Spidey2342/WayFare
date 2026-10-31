import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { fontFamily, palette, radii, spacing } from '@/theme';

interface ToastValue {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);

  const show = useCallback((next: string) => {
    setMessage(next);
    setTimeout(() => setMessage((current) => (current === next ? null : current)), 3200);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <Pressable
          accessibilityRole="alert"
          accessibilityLabel={message}
          onPress={() => setMessage(null)}
          style={styles.toast}
        >
          <Text style={styles.text}>{message}</Text>
        </Pressable>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastValue {
  const value = useContext(ToastContext);
  if (!value) {
    return { show: () => undefined };
  }
  return value;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 108,
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: palette.midnight,
    borderRadius: radii.lg,
    padding: spacing.md,
    zIndex: 20,
  },
  text: {
    color: palette.white,
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    textAlign: 'center',
  },
});
