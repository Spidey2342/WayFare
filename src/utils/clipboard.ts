import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

export async function copyTextToClipboard(text: string): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;
  try {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(trimmed);
      return true;
    }
    await Clipboard.setStringAsync(trimmed);
    return true;
  } catch {
    return false;
  }
}
