import { track } from '@/lib/monitoring';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { img } from '@/lib/images';
import { useLayoutWidth } from '@/lib/layout';
import { router } from 'expo-router';
import { colors, fonts, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { rupees, useCurrency } from '@/lib/currency';
import { acceptBooking, cancelBooking, KIND_LABEL, notifyBookingsChanged, payBooking, STATUS_LABEL, useMyBookings, type Booking, type BookingKind, type BookingStatus } from '@/lib/bookings';
import { fmtDate } from '@/components/DateField';
import { Segmented } from '@/components/form';
import { Card, Gutter, Kicker, PrimaryButton, Screen, SoftButton, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { AirplaneTiltIcon, BedIcon, CaretRightIcon, CarIcon, CheckCircleIcon, ClockIcon, HouseLineIcon, TicketIcon, UserCircleIcon, type Icon } from '@/components/icons';

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
  const { priceNpr, currency } = useCurrency();
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
      {b.roomName ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: -6 }]}>{b.roomName}</Text> : null}
      {b.totalNpr != null ? (
        <View>
          <Kicker>{b.payAtProperty ? 'Total · pay at the property' : 'Total · pay in the app'}</Kicker>
          <Text style={[type.headlineLg, { marginTop: 2 }]}>
            {rupees(b.totalNpr)}
            {currency !== 'NPR' ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{`  about ${priceNpr(b.totalNpr)}`}</Text> : null}
          </Text>
        </View>
      ) : b.quoteUsd != null ? (
        <View>
          <Kicker>Price from our team</Kicker>
          <Text style={[type.headlineLg, { marginTop: 2 }]}>${b.quoteUsd.toLocaleString('en-US')}</Text>
        </View>
      ) : null}
      {b.partnerStatus === 'pending' && b.status === 'requested' ? (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ClockIcon size={18} color={colors.primary} />
          <Text style={[type.bodySm, { color: colors.primary, fontFamily: fonts.sansMedium, flex: 1 }]}>Waiting for the property to confirm (usually within 2 hours)</Text>
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
          <Text style={[type.bodySm, { color: colors.secondary, fontFamily: fonts.sansMedium }]}>{b.status === 'paid' ? 'Paid — our team will confirm shortly' : b.payAtProperty ? 'Confirmed by the property. Pay when you arrive.' : 'All set. See you in Nepal!'}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} selectable>{b.reference ?? 'Sent from your email app'}</Text>
        {canCancel && !busy ? <TextButton label="Cancel" arrow={false} onPress={cancel} /> : null}
      </View>
    </Card>
  );
}

type TripTab = 'upcoming' | 'completed' | 'cancelled';

const IDEAS: { label: string; img: string; cat: string }[] = [
  { label: 'TREKKING', img: '/img/ebc.jpg', cat: 'Trekking' },
  { label: 'CULTURE', img: '/img/kathmandu.jpg', cat: 'Culture' },
  { label: 'WILDLIFE', img: '/img/chitwan.jpg', cat: 'Wildlife' },
  { label: 'ADVENTURE', img: '/img/paragliding.jpg', cat: 'Adventure' },
  { label: 'HELI TOURS', img: '/img/heli.jpg', cat: 'Heli Tours' },
  { label: 'PEAK CLIMBING', img: '/img/climb.jpg', cat: 'Peak Climbing' },
];

/** Big swipeable trip-idea cards shown when there are no bookings yet. */
function TripIdeas() {
  const w = Math.round(useLayoutWidth() * 0.6);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={w + 12} decelerationRate="fast" contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 12, paddingTop: space.lg }}>
      {IDEAS.map((x) => (
        <Pressable key={x.label} onPress={() => router.navigate({ pathname: '/explore', params: { cat: x.cat } })} style={{ width: w, height: w * 1.25, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'flex-end' }} accessibilityRole="button" accessibilityLabel={x.label}>
          <Image source={img(x.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(7,13,24,0.8)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}>
            <Text style={{ flex: 1, fontFamily: fonts.sansBold, fontSize: 18, letterSpacing: 1, color: '#fff' }}>{x.label}</Text>
            <CaretRightIcon size={20} color="#fff" weight="bold" />
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/** Upcoming / Completed / Cancelled trips. Used as the "My Trips" tab and as a pushed screen. */
export function MyTrips({ inTab = false }: { inTab?: boolean }) {
  const { enabled, user } = useAuth();
  const { items, loading, reload } = useMyBookings();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<TripTab>('upcoming');
  const today = new Date().toISOString().slice(0, 10);
  const groups = useMemo(() => {
    const g: Record<TripTab, Booking[]> = { upcoming: [], completed: [], cancelled: [] };
    for (const b of items) {
      if (b.status === 'cancelled') g.cancelled.push(b);
      else if (b.status === 'completed' || (b.endDate ?? b.startDate) < today) g.completed.push(b);
      else g.upcoming.push(b);
    }
    return g;
  }, [items, today]);
  const list = groups[tab];

  return (
    <Screen
      tabs={inTab}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={async () => { setRefreshing(true); await reload(); setRefreshing(false); }} />}
    >
      {inTab ? null : <BackHeader />}
      <Gutter style={{ marginTop: inTab ? space.sm : space.md }}>
        <Kicker>Hotels, homestays, treks, rides, flights & tickets</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>My Trips</Text>
      </Gutter>
      <Gutter style={{ marginTop: space.md }}>
        <Segmented<TripTab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: `Upcoming${groups.upcoming.length ? ` (${groups.upcoming.length})` : ''}` },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </Gutter>

      {enabled && !user ? (
        <Gutter style={{ marginTop: space.lg }}>
          <Card style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <UserCircleIcon size={26} color={colors.secondary} weight="duotone" />
              <Text style={[type.bodySm, { flex: 1 }]}>Sign in to see live status, accept prices and pay here. Bookings made while signed out are confirmed by email.</Text>
            </View>
            <TextButton label="Sign in" onPress={() => router.push('/account')} style={{ alignSelf: 'flex-start', marginLeft: 34 }} />
          </Card>
        </Gutter>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : list.length === 0 ? (
        <View>
          <Gutter style={{ marginTop: space.xl }}>
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={[type.headlineMd, { textAlign: 'center' }]}>{tab === 'upcoming' ? 'No bookings yet' : tab === 'completed' ? 'No completed trips yet' : 'Nothing cancelled'}</Text>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Start exploring for your next trip</Text>
            </View>
          </Gutter>
          {tab === 'upcoming' ? <TripIdeas /> : null}
        </View>
      ) : (
        <Gutter style={{ marginTop: space.lg, gap: space.md }}>
          {list.map((b) => <BookingCard key={b.id} b={b} signedIn={!!user} onChanged={notifyBookingsChanged} />)}
        </Gutter>
      )}
    </Screen>
  );
}

export default function MyBookings() {
  return <MyTrips />;
}
