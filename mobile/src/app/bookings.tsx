import { track } from '@/lib/monitoring';
import { useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { acceptBooking, cancelBooking, KIND_LABEL, notifyBookingsChanged, payBooking, STATUS_LABEL, useMyBookings, type Booking, type BookingKind, type BookingStatus } from '@/lib/bookings';
import { fmtDate } from '@/components/DateField';
import { Card, Gutter, Kicker, PrimaryButton, Screen, SoftButton, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { AirplaneTiltIcon, BedIcon, CarIcon, CheckCircleIcon, HouseLineIcon, ReceiptIcon, TicketIcon, UserCircleIcon, type Icon } from '@/components/icons';

const ICON: Record<BookingKind, Icon> = { hotel: BedIcon, homestay: HouseLineIcon, cab: CarIcon, flight: AirplaneTiltIcon, ticket: TicketIcon };

const PILL: Record<BookingStatus, { bg: string; fg: string }> = {
  requested: { bg: colors.surface, fg: colors.onSurface },
  quoted: { bg: 'rgba(217,90,64,0.12)', fg: colors.primary },
  accepted: { bg: 'rgba(217,90,64,0.12)', fg: colors.primary },
  paid: { bg: colors.secondary, fg: colors.onSecondary },
  confirmed: { bg: colors.secondary, fg: colors.onSecondary },
  completed: { bg: colors.surface, fg: colors.onSurfaceVariant },
  cancelled: { bg: colors.surface, fg: colors.onSurfaceVariant },
  emailed: { bg: colors.surface, fg: colors.onSurfaceVariant },
};

const day = (s?: string | null) => (s ? fmtDate(new Date(s + 'T00:00:00')) : '');

function BookingCard({ b, signedIn, onChanged }: { b: Booking; signedIn: boolean; onChanged: () => void }) {
  const { toast } = useStore();
  const [busy, setBusy] = useState(false);
  const I = ICON[b.kind];
  const pill = PILL[b.status];
  const live = signedIn && !b.id.startsWith('local-');
  const canCancel = live && (b.status === 'requested' || b.status === 'quoted' || b.status === 'accepted');

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again or contact our team.');
    } finally {
      setBusy(false);
      onChanged();
    }
  };

  const pay = (provider: 'khalti' | 'stripe') =>
    act(async () => {
      const r = await payBooking(b.id, provider);
      track('payment', { provider, result: r, kind: b.kind });
      if (r === 'paid') toast('Payment received — thank you!');
      else if (r === 'failed') Alert.alert('Payment not completed', 'No money was taken. You can try again.');
    });

  const cancel = () =>
    Alert.alert('Cancel this booking?', `${b.title} (${b.reference})`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Cancel booking', style: 'destructive', onPress: () => act(async () => { await cancelBooking(b.id); toast('Booking cancelled'); }) },
    ]);

  return (
    <Card style={{ gap: 12 }}>
      {/* wraps the status pill under the label on narrow screens / large text instead of squeezing it */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 12, rowGap: 8 }}>
        <I size={24} color={colors.secondary} weight="duotone" />
        <Kicker style={{ flexGrow: 1, flexShrink: 0 }}>{KIND_LABEL[b.kind]}</Kicker>
        <View style={{ backgroundColor: pill.bg, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 }}>
          <Text style={[type.labelSm, { color: pill.fg }]}>{STATUS_LABEL[b.status]}</Text>
        </View>
      </View>
      <Text style={type.headlineMd}>{b.title}</Text>
      <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
        {day(b.startDate)}
        {b.endDate ? ` → ${day(b.endDate)}` : ''}
        {b.startTime ? ` · ${b.startTime}` : ''} · {b.guests} {b.guests === 1 ? 'person' : 'people'}
      </Text>
      {b.quoteUsd != null ? (
        <View>
          <Kicker>Price from our team</Kicker>
          <Text style={[type.headlineLg, { marginTop: 2 }]}>${b.quoteUsd.toLocaleString('en-US')}</Text>
        </View>
      ) : null}
      {b.teamNote ? <Text style={[type.bodySm, { fontFamily: fonts.sansMedium }]}>{b.teamNote}</Text> : null}

      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {!busy && live && b.status === 'quoted' && b.quoteUsd != null ? (
        <PrimaryButton label="Accept price" onPress={() => act(async () => { await acceptBooking(b.id); toast('Price accepted — choose how to pay'); })} />
      ) : null}
      {!busy && live && b.status === 'accepted' ? (
        <View style={{ gap: 10 }}>
          <PrimaryButton label="Pay with Khalti (NPR)" onPress={() => pay('khalti')} />
          <SoftButton label="Pay by card (USD)" onPress={() => pay('stripe')} style={{ alignSelf: 'stretch', justifyContent: 'center' }} />
        </View>
      ) : null}
      {b.status === 'paid' || b.status === 'confirmed' ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <CheckCircleIcon size={18} color={colors.secondary} weight="fill" />
          <Text style={[type.bodySm, { color: colors.secondary, fontFamily: fonts.sansMedium }]}>{b.status === 'paid' ? 'Paid — our team will confirm shortly' : 'All set. See you in Nepal!'}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} selectable>{b.reference ?? 'Sent from your email app'}</Text>
        {canCancel && !busy ? <TextButton label="Cancel" arrow={false} onPress={cancel} /> : null}
      </View>
    </Card>
  );
}

export default function MyBookings() {
  const { enabled, user } = useAuth();
  const { items, loading, reload } = useMyBookings();
  const [refreshing, setRefreshing] = useState(false);

  return (
    <Screen
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}
    >
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker>Hotels, homestays, rides, flights & tickets</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>My bookings</Text>
      </Gutter>

      {enabled && !user ? (
        <Gutter style={{ marginTop: space.lg }}>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <UserCircleIcon size={26} color={colors.secondary} weight="duotone" />
              <Text style={[type.bodySm, { flex: 1 }]}>Sign in before you book to see live status, accept prices and pay here. Bookings made while signed out are confirmed by email.</Text>
            </View>
            <TextButton label="Sign in" onPress={() => router.push('/account')} style={{ alignSelf: 'flex-start', marginLeft: 34 }} />
          </Card>
        </Gutter>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : items.length === 0 ? (
        <Gutter style={{ marginTop: space.xl }}>
          <Card style={{ alignItems: 'center', paddingVertical: space.xxl, gap: 8 }}>
            <ReceiptIcon size={40} color={colors.onSurfaceVariant} weight="duotone" />
            <Text style={[type.headlineMd, { marginTop: space.sm }]}>No bookings yet</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Book a hotel, homestay, ride, flight or activity and it shows up here.</Text>
            <SoftButton label="Book something" onPress={() => router.navigate('/')} style={{ marginTop: space.md }} />
          </Card>
        </Gutter>
      ) : (
        <Gutter style={{ marginTop: space.lg, gap: space.md }}>
          {items.map((b) => <BookingCard key={b.id} b={b} signedIn={!!user} onChanged={notifyBookingsChanged} />)}
        </Gutter>
      )}
    </Screen>
  );
}
