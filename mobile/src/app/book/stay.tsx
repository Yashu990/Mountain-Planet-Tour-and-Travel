import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, space, squircle, type } from '@/theme';
import { getStay, type StayKind } from '@/data/stays';
import { useContent } from '@/lib/content';
import { img } from '@/lib/images';
import { BookingDone, BookingScreen, useBookingSubmit, useContact } from '@/components/BookingLayout';
import { FormCard, Segmented, SelectField, Stepper } from '@/components/form';
import { DateField, isoDay } from '@/components/DateField';
import { BadgePill, Chip, ChipRow, Field, Gutter, Kicker } from '@/components/ui';
import { MapPinIcon } from '@/components/icons';

const HOTEL_CITIES = ['Kathmandu', 'Pokhara', 'Chitwan (Sauraha)', 'Nagarkot', 'Bhaktapur', 'Lumbini', 'Lukla', 'Namche Bazaar'];
const HOMESTAY_AREAS = ['Ghandruk (Annapurna)', 'Bandipur', 'Sirubari', 'Tharu village, Chitwan', 'Tamang Heritage Trail (Langtang)', 'Bhaktapur old town', 'Panauti'];
const LEVELS = ['Budget', 'Standard', 'Boutique', 'Luxury'];
const MEALS = ['Breakfast only', 'All meals with the family'];

const nights = (a: Date | null, b: Date | null) => (a && b ? Math.round((b.getTime() - a.getTime()) / 86400000) : 0);

export default function StayBooking() {
  useContent();
  const params = useLocalSearchParams<{ kind?: StayKind; stay?: string; room?: string; where?: string; ci?: string; co?: string; a?: string; c?: string }>();
  const day = (s?: string) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : null);
  const listing = params.stay ? getStay(params.stay) : undefined;
  const today = new Date();
  const [kind, setKind] = useState<StayKind>(listing?.kind ?? params.kind ?? 'hotel');
  const [where, setWhere] = useState(listing?.city ?? params.where ?? '');
  const [checkIn, setCheckIn] = useState<Date | null>(day(params.ci));
  const [checkOut, setCheckOut] = useState<Date | null>(day(params.co));
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(Math.max(1, Number(params.a) || 2));
  const [children, setChildren] = useState(Math.max(0, Number(params.c) || 0));
  const [level, setLevel] = useState('Standard');
  const [meals, setMeals] = useState(MEALS[1]);
  const [notes, setNotes] = useState('');
  const { contact, fields, validate } = useContact();
  const { done, submit, footer } = useBookingSubmit();
  const { t } = useI18n();

  if (done) return <BookingDone result={done} />;

  const n = nights(checkIn, checkOut);
  const guests = adults + children;
  const send = () => {
    const problem =
      !where.trim() ? 'Please choose where you want to stay.' :
      !checkIn || !checkOut ? 'Please choose check-in and check-out dates.' :
      n < 1 ? 'Check-out must be at least one night after check-in.' :
      listing && guests > listing.maxGuests ? `This stay fits up to ${listing.maxGuests} guests.` :
      validate();
    submit(
      {
        kind,
        title: listing ? listing.name : `${kind === 'hotel' ? 'Hotel' : 'Homestay'} in ${where}`,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        promoCode: contact.promo || undefined,
        startDate: checkIn ? isoDay(checkIn) : '',
        endDate: checkOut ? isoDay(checkOut) : undefined,
        location: where,
        guests,
        staySlug: listing?.slug,
        details: { nights: n, adults, children, ...(params.room ? { room: params.room } : {}), ...(kind === 'hotel' ? { rooms, comfort: level } : { meals }) },
        notes,
      },
      problem || undefined,
    );
  };

  return (
    <BookingScreen image={listing?.images[0] ?? (kind === 'homestay' ? '/img/annapurna.jpg' : '/img/pokhara.jpg')} kicker={listing ? 'Reserve' : 'Hotels & homestays'} title={listing ? 'Reserve your stay' : 'Book a stay'}>
      <FormCard>
        {listing ? (
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Image source={img(listing.images[0])} style={{ width: 64, height: 64, borderRadius: radius.lg, ...squircle }} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={type.headlineSm} numberOfLines={2}>{listing.name}</Text>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{params.room ? `${params.room} · ` : ''}{listing.city} · up to {listing.maxGuests} guests</Text>
            </View>
            {listing.isSample ? <BadgePill label="Sample" /> : null}
          </View>
        ) : (
          <>
            <Segmented value={kind} onChange={(k) => { setKind(k); setWhere(''); }} options={[{ value: 'hotel', label: 'Hotel' }, { value: 'homestay', label: 'Homestay' }]} />
            <SelectField
              label={kind === 'hotel' ? 'City' : 'Village / area'}
              value={where}
              onChange={setWhere}
              options={kind === 'hotel' ? HOTEL_CITIES : HOMESTAY_AREAS}
              icon={MapPinIcon}
              allowCustom
              customPlaceholder="Type another place"
            />
          </>
        )}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateField label="Check-in" value={checkIn} onChange={(d) => { setCheckIn(d); if (checkOut && checkOut <= d) setCheckOut(null); }} minimumDate={today} placeholder="Select" />
          <DateField label="Check-out" value={checkOut} onChange={setCheckOut} minimumDate={checkIn ? new Date(checkIn.getTime() + 86400000) : today} placeholder="Select" />
        </View>
        {n > 0 ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: -8 }]}>{n} {n === 1 ? 'night' : 'nights'}</Text> : null}
        <View>
          <Kicker>Guests</Kicker>
          {kind === 'hotel' && !listing ? <Stepper label="Rooms" value={rooms} onChange={setRooms} min={1} max={20} /> : null}
          <Stepper label="Adults" value={adults} onChange={setAdults} min={1} max={listing?.maxGuests ?? 40} />
          <Stepper label="Children" hint="Under 12" value={children} onChange={setChildren} max={20} />
        </View>
        {!listing ? (
          <View style={{ gap: 10 }}>
            <Kicker>{kind === 'hotel' ? 'Comfort level' : 'Meals'}</Kicker>
            <View style={{ marginHorizontal: -20 }}>
              <ChipRow>
                {(kind === 'hotel' ? LEVELS : MEALS).map((x) => (
                  <Chip key={x} label={x} active={(kind === 'hotel' ? level : meals) === x} onPress={() => (kind === 'hotel' ? setLevel(x) : setMeals(x))} />
                ))}
              </ChipRow>
            </View>
          </View>
        ) : null}
      </FormCard>

      <Gutter style={{ marginTop: space.xl, gap: 16 }}>
        <Text style={type.headlineMd}>{t('common.yourDetails')}</Text>
        {fields}
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Arrival time, dietary needs, twin or double beds…" />
        {footer(listing ? 'Reserve' : 'Request this stay', send)}
      </Gutter>
    </BookingScreen>
  );
}
