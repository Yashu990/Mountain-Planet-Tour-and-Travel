import { track, wrapRoot } from '@/lib/monitoring';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Roboto_400Regular } from '@expo-google-fonts/roboto/400Regular';
import { Roboto_500Medium } from '@expo-google-fonts/roboto/500Medium';
import { Roboto_700Bold } from '@expo-google-fonts/roboto/700Bold';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/lib/store';
import { AuthProvider, useAuth } from '@/lib/auth';
import { usePushNotifications } from '@/lib/push';
import { ContentProvider } from '@/lib/content';
import { CurrencyProvider } from '@/lib/currency';
import { I18nProvider } from '@/lib/i18n';
import { Intro } from '@/components/Intro';
import { LocationPrompt } from '@/components/LocationPrompt';
import { colors } from '@/theme';
import { MAX_CONTENT_WIDTH } from '@/lib/layout';

SplashScreen.preventAutoHideAsync().catch(() => {});

const WELCOME_KEY = 'mpn-welcomed';
const LOCATION_ASKED_KEY = 'mpn-location-asked';

/** Registers push for the signed-in user and shows the welcome / sign-in screen once after the intro. */
function Boot({ introDone }: { introDone: boolean }) {
  const { user, enabled, ready } = useAuth();
  usePushNotifications(user?.id);
  const pathname = usePathname();
  useEffect(() => {
    track('screen', { path: pathname.replace(/\/[0-9a-f-]{20,}$/i, '/:id') });
  }, [pathname]);
  useEffect(() => {
    if (!introDone || !enabled || !ready || user) return;
    AsyncStorage.getItem(WELCOME_KEY)
      .then((seen) => {
        if (!seen) {
          AsyncStorage.setItem(WELCOME_KEY, '1').catch(() => {});
          router.push('/welcome');
        }
      })
      .catch(() => {});
  }, [introDone, enabled, ready, user]);

  // Once, on Home after the intro (and the welcome screen if shown): offer local-currency prices.
  const [askLocation, setAskLocation] = useState(false);
  useEffect(() => {
    if (!introDone || pathname !== '/') return;
    let cancelled = false;
    const t = setTimeout(() => {
      AsyncStorage.multiGet([LOCATION_ASKED_KEY, 'mpn-currency'])
        .then(([[, asked], [, chosen]]) => {
          if (cancelled || asked || chosen) return;
          AsyncStorage.setItem(LOCATION_ASKED_KEY, '1').catch(() => {});
          setAskLocation(true);
        })
        .catch(() => {});
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [introDone, pathname]);
  return <LocationPrompt visible={askLocation} onDone={() => setAskLocation(false)} />;
}

function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Roboto_400Regular, Roboto_500Medium, Roboto_700Bold });
  // The intro plays on every launch, like the website does on every refresh.
  const [introDone, setIntroDone] = useState(false);
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <I18nProvider>
      <AuthProvider>
      <ContentProvider>
      <CurrencyProvider>
      <StoreProvider>
        <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
          <StatusBar style="dark" />
          {/* On tablets the app sits in a centred column instead of stretching edge to edge. */}
          <View style={{ flex: 1, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', backgroundColor: colors.surface, overflow: 'hidden' }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface }, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="tour/[slug]" />
            <Stack.Screen name="guide/[slug]" />
            <Stack.Screen name="destinations/index" />
            <Stack.Screen name="destinations/[slug]" />
            <Stack.Screen name="plan" />
            <Stack.Screen name="about" />
            <Stack.Screen name="ai" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="share-story" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="account" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="menu" options={{ presentation: "transparentModal", animation: "slide_from_left" }} />
            <Stack.Screen name="story/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
            <Stack.Screen name="admin/index" />
            <Stack.Screen name="admin/booking/[id]" />
            <Stack.Screen name="tools" />
            <Stack.Screen name="map" />
            <Stack.Screen name="trip" />
            <Stack.Screen name="legal/[doc]" />
            <Stack.Screen name="review" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
          </View>
          <Boot introDone={introDone} />
          {!introDone && <Intro onDone={() => setIntroDone(true)} />}
        </View>
      </StoreProvider>
      </CurrencyProvider>
      </ContentProvider>
      </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}

export default wrapRoot(RootLayout);
