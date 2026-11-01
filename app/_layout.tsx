import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NavigationGuard } from '@/components/navigation/NavigationGuard';
import { RouteError } from '@/components/RouteError';
import { AuthProvider } from '@/features/auth/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { useAppStore } from '@/store';
import { fontAssets, ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <RouteError error={error} retry={retry} />;
}

export default function RootLayout() {
  const preference = useAppStore((state) => state.themePreference);
  const hydrated = useAppStore((state) => state.hydrated);
  const [loaded, error] = useFonts(fontAssets);

  useEffect(() => {
    if ((loaded || error) && hydrated) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error, hydrated]);

  if ((!loaded && !error) || !hydrated) {
    return null;
  }

  return (
    <GestureHandlerRootView
      style={Platform.OS === 'web' ? { flex: 1, minHeight: 0, height: '100%' } : { flex: 1 }}
    >
      <SafeAreaProvider>
        <ThemeProvider preference={preference}>
          <ToastProvider>
            <AuthProvider>
              <NavigationGuard>
                <StatusBar style={preference === 'dark' ? 'light' : 'auto'} />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: 'fade',
                    contentStyle: { flex: 1 },
                  }}
                />
              </NavigationGuard>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
