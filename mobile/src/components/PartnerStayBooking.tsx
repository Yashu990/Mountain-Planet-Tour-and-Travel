// Booking form for a verified partner's hotel / homestay: room, dates, rooms & guests → live price
// from the server → pay in the app or at the property → request goes to the partner (answer within 2 h).
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, radius, space, squircle, type } from '@/theme';
import type { Stay } from '@/data/stays';
import { img } from '@/lib/images';
import { useAuth } from '@/lib/auth';
import { useCurrency, rupees } from '@/lib/currency';
import { notifyBookingsChanged } from '@/lib/bookings';
import { quoteStay, requestStayBooking, type Quote } from '@/lib/partnerBookings';
import { track } from '@/lib/monitoring';
import { BookingScreen, useContact } from './BookingLayout';
import { FormCard, Segmented, Stepper } from './form';
import { DateField, isoDay } from './DateField';
import { BadgePill, Callout, Card, Chip, Field, Gutter, Kicker, PrimaryButton, Screen, SoftButton } from './ui';
import { useRooms } from './RoomsSection';
import { CheckCircleIcon, InfoIcon } from './icons';

const day = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : null);

export function PartnerStayBooking({ listing, params }: { listing: Stay; params: { room?: string; ci?: string; co?: string; a?: string; c?: string } }) {
  const rooms = useRooms(listing.slug, true);
  const { user } = useAuth();
  const { priceNpr, currency } = useCurrency();
  const today = new Date();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(day(params.ci));
  const [checkOut, setCheckOut] = useState<Date | null>(day(params.co));
  const [roomCount, setRoomCount] = useState(1);
  const [adults, setAdults] = useState(Math.max(1, Number(params.a) || 2));
  const [children, setChildren] = useState(Math.max(0, Number(params.c) || 0));
  const [pay, setPay] = useState<'property' | 'app'>('property');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference: string; total: number; nights: number } | null>(null);
  const { contact, fields, validate } = useContact({ promo: false });

  // Pick the room passed in (id or name), else the cheapest.
  const room = useMemo(() => {
    if (!rooms?.length) return null;
    return rooms.find((r) => r.id === (roomId ?? params.room)) ?? rooms.find((r) => r.name === params.room) ?? rooms[0];
  }, [rooms, roomId, params.room]);

  // Live price whenever room / dates / number of rooms change.
  const ci = checkIn ? isoDay(checkIn) : '';
  const co = checkOut ? isoDay(checkOut) : '';
  useEffect(() => {
    if (!room || !ci || !co) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear the old quote when inputs are incomplete
      setQuote(null);
      return;
    }
    let alive = true;
    setQuoting(true);
    const t = setTimeout(() => {
      quoteStay(room.id, ci, co, roomCount).then((q) => {
        if (alive) {
          setQuote(q);
          setQuoting(false);
        }
      });
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [room, ci, co, roomCount]);

  if (done) {
    return (
      <Screen>
        <Gutter style={{ marginTop: space.xxl, alignItems: 'center', gap: space.md }}>
          <CheckCircleIcon size={56} color={colors.secondary} weight="fill" />
          <Text style={[type.displayMd, { textAlign: 'center' }]}>Request sent</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {listing.name} will confirm within 2 hours. We’ll show the answer in My bookings.
          </Text>
          <Card style={{ alignSelf: 'stretch', gap: 6 }}>
            <Kicker>Reference</Kicker>
            <Text style={type.headlineMd} selectable>{done.reference}</Text>
            <Text style={type.bodyMd}>{done.nights} {done.nights === 1 ? 'night' : 'nights'} · {rupees(done.total)}{currency !== 'NPR' ? ` (about ${priceNpr(done.total)})` : ''}</Text>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{pay === 'property' ? 'You pay at the property.' : 'Once confirmed, you can pay in the app.'}</Text>
          </Card>
          <PrimaryButton label="My bookings" onPress={() => router.replace('/bookings')} style={{ alignSelf: 'stretch' }} />
          <SoftButton label="Back to stays" onPress={() => router.replace('/stays')} />
        </Gutter>
      </Screen>
    );
  }

  const guests = adults + children;
  const send = async () => {
    setError('');
    const problem =
      !room ? 'Please choose a room.' :
      !checkIn || !checkOut ? 'Please choose check-in and check-out dates.' :
      !quote?.available ? (quote?.reason ?? 'These dates aren’t available.') :
      guests > room.max_guests * roomCount ? `This room fits up to ${room.max_guests} guests. Add a room for more people.` :
      validate();
    if (problem) return setError(problem);
    setBusy(true);
    try {
      const r = await requestStayBooking({
        roomId: room!.id, checkIn: ci, checkOut: co, rooms: roomCount, guests, payAtProperty: pay === 'property',
        name: contact.name.trim(), email: contact.email.trim(), phone: contact.phone.trim(), notes,
      });
      track('partner_booking_requested', { pay, nights: r.nights });
      notifyBookingsChanged();
      setDone({ reference: r.reference, total: r.total_npr, nights: r.nights });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <BookingScreen image={listing.images[0]} kicker="Reserve" title="Reserve your stay">
      <FormCard>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Image source={img(listing.images[0])} style={{ width: 64, height: 64, borderRadius: radius.lg, ...squircle }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={type.headlineSm} numberOfLines={2}>{listing.name}</Text>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{listing.city}{listing.checkInTime ? ` · check-in ${listing.checkInTime}` : ''}</Text>
          </View>
          <BadgePill label="Verified" style={{ backgroundColor: colors.secondary }} />
        </View>

        <View style={{ gap: 8 }}>
          <Kicker>Room</Kicker>
          {!rooms ? (
            <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {rooms.map((r) => (
                <Chip key={r.id} label={`${r.name} · ${priceNpr(r.price_npr)}`} active={room?.id === r.id} onPress={() => { setRoomId(r.id); setRoomCount(1); }} />
              ))}
            </View>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateField label="Check-in" value={checkIn} onChange={(d) => { setCheckIn(d); if (checkOut && checkOut <= d) setCheckOut(null); }} minimumDate={today} placeholder="Select" />
          <DateField label="Check-out" value={checkOut} onChange={setCheckOut} minimumDate={checkIn ? new Date(checkIn.getTime() + 86400000) : today} placeholder="Select" />
        </View>
        <View>
          <Stepper label="Rooms" value={roomCount} onChange={setRoomCount} min={1} max={Math.max(1, room?.units ?? 1)} />
          <Stepper label="Adults" value={adults} onChange={setAdults} min={1} max={40} />
          <Stepper label="Children" hint="Under 12" value={children} onChange={setChildren} max={20} />
        </View>

        {/* live price */}
        {room && ci && co ? (
          <View style={{ backgroundColor: quote && !quote.available ? colors.destructiveSoft : colors.surfaceAlt, borderRadius: radius.lg, padding: 14, gap: 4 }}>
            {quoting && !quote ? (
              <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start' }} />
            ) : quote?.available ? (
              <>
                <Kicker>Total for your stay</Kicker>
                <Text style={[type.headlineLg, { color: colors.primary }]}>
                  {rupees(quote.total_npr!)}
                  {currency !== 'NPR' ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{`  about ${priceNpr(quote.total_npr!)}`}</Text> : null}
                </Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
                  {quote.nights} {quote.nights === 1 ? 'night' : 'nights'} × {roomCount} {roomCount === 1 ? 'room' : 'rooms'} · price set by the property{quoting ? ' · updating…' : ''}
                </Text>
              </>
            ) : quote ? (
              <Text style={[type.bodyMd, { color: colors.destructive }]}>{quote.reason}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: 8 }}>
          <Kicker>How would you like to pay?</Kicker>
          <Segmented value={pay} onChange={setPay} options={[{ value: 'property', label: 'Pay at property' }, { value: 'app', label: 'Pay in app' }]} />
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
            {pay === 'property' ? 'Nothing to pay now. Pay the property when you arrive.' : 'Once the property confirms, pay securely in the app with Khalti or card.'}
          </Text>
        </View>
      </FormCard>

      <Gutter style={{ marginTop: space.xl, gap: 16 }}>
        <Text style={type.headlineMd}>Your details</Text>
        {fields}
        <Field label="Notes for the property" value={notes} onChangeText={setNotes} multiline placeholder="Arrival time, twin or double beds, dietary needs…" />
        {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
        {user ? (
          <PrimaryButton label={busy ? 'Sending…' : 'Request to book'} onPress={send} disabled={busy || quoting} />
        ) : (
          <>
            <Callout icon={InfoIcon}>Please sign in so the property can confirm your booking and you can follow it in My bookings.</Callout>
            <PrimaryButton label="Sign in to book" onPress={() => router.push('/account')} />
          </>
        )}
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>The property confirms within 2 hours. Free to cancel until it’s confirmed.</Text>
      </Gutter>
    </BookingScreen>
  );
}
