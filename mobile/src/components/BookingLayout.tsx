import { track } from '@/lib/monitoring';
import { useI18n } from '@/lib/i18n';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { colors, space, type } from '@/theme';
import { img } from '@/lib/images';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { notifyBookingsChanged, submitBooking, KIND_LABEL, type BookingInput, type SubmitResult } from '@/lib/bookings';
import { Callout, Field, GlassButton, Gutter, Kicker, PrimaryButton, Screen, SoftButton, TextButton } from './ui';
import { ArrowLeftIcon, CheckCircleIcon, CopySimpleIcon, InfoIcon, ReceiptIcon } from './icons';

/** Hero photo + title, with the form card overlapping it (reference flight / booking layout). */
export function BookingScreen({ image, kicker, title, children }: { image: string; kicker: string; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View style={{ height: 300 }}>
          <Image source={img(image)} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={title} />
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.55)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', top: insets.top + 8, left: space.gutter }}>
            <GlassButton icon={ArrowLeftIcon} label="Back" onPress={back} />
          </View>
          <View style={{ position: 'absolute', left: space.gutter, right: space.gutter, bottom: 104 }}>
            <Kicker style={{ color: 'rgba(255,255,255,0.85)' }}>{kicker}</Kicker>
            <Text style={[type.displayMd, { color: '#fff', marginTop: 6 }]}>{title}</Text>
          </View>
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Name / email / phone, pre-filled from the signed-in account. */
export function useContact() {
  const { user } = useAuth();
  const [contact, setContact] = useState({ name: '', email: '', phone: '', promo: '' });
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill from the signed-in account
    setContact((c) => ({ ...c, email: c.email || user.email || '', name: c.name || String(user.user_metadata?.full_name ?? '') }));
  }, [user]);
  const fields = (
    <View style={{ gap: 16 }}>
      <Field label="Full name *" value={contact.name} onChangeText={(v) => setContact((c) => ({ ...c, name: v }))} autoComplete="name" textContentType="name" placeholder="Your name" />
      <Field label="Email *" value={contact.email} onChangeText={(v) => setContact((c) => ({ ...c, email: v }))} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
      <Field label="Promo code (optional)" value={contact.promo} onChangeText={(v) => setContact((c) => ({ ...c, promo: v.toUpperCase() }))} autoCapitalize="characters" autoCorrect={false} placeholder="e.g. NAMASTE10" />
      <Field label="Phone / WhatsApp" value={contact.phone} onChangeText={(v) => setContact((c) => ({ ...c, phone: v }))} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="+977 98…" />
    </View>
  );
  const validate = () => {
    if (!contact.name.trim()) return 'Please add your name.';
    if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) return 'Please add a valid email so we can confirm.';
    return '';
  };
  return { contact, fields, validate };
}

/** Submit + busy / error / done state shared by every booking form. */
export function useBookingSubmit() {
  const { toast } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<(SubmitResult & { input: BookingInput }) | null>(null);
  const { t } = useI18n();
  const submit = async (input: BookingInput, problem?: string) => {
    if (problem) return setError(problem);
    setError('');
    setBusy(true);
    try {
      const r = await submitBooking(input);
      setDone({ ...r, input });
      track('booking_requested', { kind: input.kind, mode: r.mode, promo: !!input.promoCode });
      notifyBookingsChanged();
      if (r.mode === 'online') toast(`Booking requested · ${r.reference}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const footer = (label: string, onPress: () => void) => (
    <View style={{ gap: 12 }}>
      {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
      {busy ? (
        <View style={{ alignItems: 'center', gap: 8, paddingVertical: 14 }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Sending your booking…</Text>
        </View>
      ) : (
        <PrimaryButton label={label} onPress={onPress} />
      )}
      <Text style={[type.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 12 }]}>{t('common.noPayment')}</Text>
    </View>
  );
  return { busy, error, setError, done, submit, footer };
}

/** Confirmation screen after a booking is sent. */
export function BookingDone({ result }: { result: SubmitResult & { input: BookingInput } }) {
  const { toast } = useStore();
  const online = result.mode === 'online';
  const first = result.input.name.trim().split(' ')[0] || 'traveller';
  return (
    <Screen>
      <Gutter style={{ alignItems: 'center', marginTop: space.xxl }}>
        <CheckCircleIcon size={64} color={colors.secondary} weight="duotone" />
        <Kicker style={{ marginTop: space.lg }}>{online ? `${KIND_LABEL[result.input.kind]} requested` : 'Request ready to send'}</Kicker>
        <Text style={[type.displayMd, { marginTop: 8, textAlign: 'center' }]}>Dhanyabad, {first}!</Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 10 }]}>
          {online
            ? `We emailed a confirmation to ${result.input.email.trim()}. Our Kathmandu team will check availability and send the price within 24 hours.`
            : 'Send the email that just opened and our team will confirm availability and price within 24 hours.'}
        </Text>
        {online ? (
          <View style={{ marginTop: space.xl, alignItems: 'center' }}>
            <Kicker>Your reference</Kicker>
            <Text style={[type.displayMd, { marginTop: 4, letterSpacing: 1 }]} selectable>{result.reference}</Text>
            <SoftButton
              label="Copy reference"
              icon={CopySimpleIcon}
              style={{ marginTop: space.md }}
              onPress={async () => {
                await Clipboard.setStringAsync(result.reference);
                toast('Reference copied');
              }}
            />
          </View>
        ) : null}
        <PrimaryButton label="My bookings" icon={ReceiptIcon} onPress={() => router.replace('/bookings')} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
        <TextButton label="Back to home" onPress={() => router.dismissTo('/')} style={{ marginTop: space.lg }} />
      </Gutter>
    </Screen>
  );
}
