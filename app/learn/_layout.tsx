import { Stack } from 'expo-router';

export default function LearnLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { flex: 1 } }} />
  );
}
