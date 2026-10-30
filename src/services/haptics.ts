import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type VibrateNavigator = { vibrate?: (pattern: number | number[]) => boolean };

async function vibrateWeb(durationMs: number): Promise<void> {
  const nav = globalThis.navigator as VibrateNavigator | undefined;
  nav?.vibrate?.(durationMs);
}

export async function tapHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await vibrateWeb(12);
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics are a bonus. Never block a tap.
  }
}

export async function successHaptic(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await vibrateWeb(20);
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore unsupported devices.
  }
}
