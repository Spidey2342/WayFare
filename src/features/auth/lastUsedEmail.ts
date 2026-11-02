import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'wayfare.lastUsedEmail';

export async function readLastUsedEmail(): Promise<string | null> {
  const value = await AsyncStorage.getItem(KEY);
  return value && value.length > 0 ? value : null;
}

export async function writeLastUsedEmail(email: string): Promise<void> {
  await AsyncStorage.setItem(KEY, email);
}

export async function clearLastUsedEmail(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
