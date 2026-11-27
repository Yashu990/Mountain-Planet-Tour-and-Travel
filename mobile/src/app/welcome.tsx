// First-launch welcome: sign in (Google / Apple / phone / email) or skip and browse as a guest.
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space, type } from '@/theme';
import { brand, img } from '@/lib/images';
import { Kicker, TextButton } from '@/components/ui';
import { SignInOptions } from '@/components/SignInOptions';
import { LoginChoices } from '@/components/LoginChoices';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const done = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <View style={{ height: 340 }}>
        <Image source={img('/img/hero.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Himalayan peaks at sunrise" />
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.05)', 'rgba(255,255,255,1)']} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
        <Image source={brand.mark} style={{ position: 'absolute', top: insets.top + 24, left: space.gutter, width: 72, height: 42 }} contentFit="contain" />
      </View>
      <View style={{ flex: 1, paddingHorizontal: space.gutter, marginTop: -60, gap: space.lg }}>
        <View>
          <Kicker>Welcome to Mountain Planet</Kicker>
          <Text style={[type.displayMd, { marginTop: 8 }]}>Your Himalayan trip, all in one app</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
            Sign in to keep your saved trips and bookings on every device, and get a message the moment your price is ready.
          </Text>
        </View>
        <SignInOptions onEmail={() => router.replace('/account')} onDone={done} />
        <TextButton label="Skip for now" arrow={false} onPress={done} style={{ alignSelf: 'center' }} />
        <LoginChoices />
      </View>
      <View style={{ paddingBottom: insets.bottom + 12, paddingHorizontal: space.gutter }}>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 12 }]}>
          By continuing you agree to our{' '}
          <Text style={{ color: colors.primary }} onPress={() => router.push('/legal/terms')}>Terms</Text> and{' '}
          <Text style={{ color: colors.primary }} onPress={() => router.push('/legal/privacy')}>Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
}
