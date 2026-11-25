// Push notifications: register this phone for the signed-in user, and open the right
// screen when a notification is tapped. Needs an EAS project id (set when you run the
// first EAS build) — in Expo Go on Android remote push is not available, so this quietly
// does nothing there.
import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

async function register(userId: string) {
  if (!supabase || !Device.isDevice) return;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'Bookings', importance: AndroidImportance.HIGH });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await supabase.from('push_tokens').upsert({ token, user_id: userId, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
}

/** Call once in the root layout. */
export function usePushNotifications(userId: string | undefined) {
  useEffect(() => {
    if (userId) register(userId).catch(() => {});
  }, [userId]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const url = r.notification.request.content.data?.url;
      if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
    });
    return () => sub.remove();
  }, []);
}
