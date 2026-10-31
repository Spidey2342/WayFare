import { Tabs } from 'expo-router';

import { TabBar } from '@/components/navigation/TabBar';

export default function TabsLayout() {
  return (
    <Tabs tabBar={() => <TabBar />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="decks" />
      <Tabs.Screen name="play" options={{ href: null }} />
      <Tabs.Screen name="journey" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
