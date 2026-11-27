import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/components/BottomTabBar';
import { colors } from '@/theme';

// Home · My Trips · Where to Go · Wishlist · Be a Host — labelled bottom navigation.
export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <BottomTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="trips" options={{ title: 'My Trips' }} />
      <Tabs.Screen name="explore" options={{ title: 'Where to Go' }} />
      <Tabs.Screen name="saved" options={{ title: 'Wishlist' }} />
      <Tabs.Screen name="host" options={{ title: 'Be a Host' }} />
    </Tabs>
  );
}
