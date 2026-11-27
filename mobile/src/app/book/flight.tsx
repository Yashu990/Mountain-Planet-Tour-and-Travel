// Flight search — travel-app layout: trip-type tabs, From ⇅ To, dates, travellers & class,
// special fares, big SEARCH, then tools, offers, popular routes, trust and FAQs.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '@/theme';
import { isoDay } from '@/components/DateField';
import { Stepper } from '@/components/form';
import { ReviewStep } from '@/components/ReviewStep';
import {
  Box,
  ChoiceSheet,
  Faqs,
  fmtDay,
  fmtShort,
  FormCard,
  HRow,
  InfoCards,
  ModeTabs,
  OfferCards,
  OptionChips,
  SectionTitle,
  ServicePage,
  Sheet,
  SwapPair,
  ToolTiles,
  TrustStrip,
  useDatePicker,
} from '@/components/service';
import { AirplaneTiltIcon, CloudSunIcon, MountainsIcon, SuitcaseRollingIcon, TaxiIcon } from '@/components/icons';

// Nepal's domestic airports most used by travellers.
export const AIRPORTS = [
  { code: 'KTM', city: 'Kathmandu', name: 'Tribhuvan International' },
  { code: 'LUA', city: 'Lukla', name: 'Tenzing–Hillary (Everest)' },
  { code: 'PKR', city: 'Pokhara', name: 'Pokhara International' },
  { code: 'JMO', city: 'Jomsom', name: 'Jomsom (Mustang)' },
  { code: 'BHR', city: 'Bharatpur', name: 'Bharatpur (Chitwan)' },
  { code: 'BWA', city: 'Bhairahawa', name: 'Gautam Buddha (Lumbini)' },
  { code: 'BIR', city: 'Biratnagar', name: 'Biratnagar' },
  { code: 'BDP', city: 'Bhadrapur', name: 'Chandragadhi' },
  { code: 'TMI', city: 'Tumlingtar', name: 'Tumlingtar (Makalu)' },
  { code: 'KEP', city: 'Nepalgunj', name: 'Nepalgunj' },
  { code: 'SIF', city: 'Simara', name: 'Simara' },
  { code: 'JKR', city: 'Janakpur', name: 'Janakpur' },
];
const label = (a: (typeof AIRPORTS)[number]) => `${a.city} (${a.code})`;
const byLabel = (v: string) => AIRPORTS.find((a) => label(a) === v)!;
const CLASSES = ['Economy', 'Business (where available)'];
const AIRLINES = ['Any airline', 'Buddha Air', 'Yeti Airlines', 'Shree Airlines', 'Nepal Airlines', 'Tara Air', 'Summit Air', 'Sita Air'];

type Fare = 'regular' | 'trekker' | 'flexible' | 'group';

export default function FlightSearch() {
  const today = new Date();
  const [trip, setTrip] = useState<'oneway' | 'return'>('oneway');
  const [from, setFrom] = useState(label(AIRPORTS[0]));
  const [to, setTo] = useState(label(AIRPORTS[1]));
  const [date, setDate] = useState<Date>(new Date(today.getTime() + 86400000));
  const [back, setBack] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cls, setCls] = useState(CLASSES[0]);
  const [airline, setAirline] = useState(AIRLINES[0]);
  const [fare, setFare] = useState<Fare>('regular');
  const [sheet, setSheet] = useState<null | 'from' | 'to' | 'pax' | 'airline'>(null);
  const [step, setStep] = useState<'search' | 'review'>('search');
  const [datePicker, openDate] = useDatePicker();
  const [error, setError] = useState('');

  const A = byLabel(from);
  const B = byLabel(to);
  const pax = adults + children;
  const summary = `${A.city.toUpperCase()} – ${B.city.toUpperCase()}\n${fmtShort(date).toUpperCase()}${back ? ` – ${fmtShort(back).toUpperCase()}` : ''} | ${pax} TRAVELLER${pax > 1 ? 'S' : ''} | ${cls.split(' ')[0].toUpperCase()}`;

  const search = () => {
    if (from === to) return setError('Departure and arrival must be different.');
    if (trip === 'return' && !back) return setError('Please add your return date.');
    setError('');
    setStep('review');
  };

  if (step === 'review') {
    return (
      <ReviewStep
        title={`${A.city} → ${B.city}${trip === 'return' ? ' · round trip' : ''}`}
        onEdit={() => setStep('search')}
        lines={[
          ['Route', `${label(A)} → ${label(B)}`],
          ['Departure', `${fmtShort(date)} ${date.getFullYear()}`],
          ...(back ? [['Return', `${fmtShort(back)} ${back.getFullYear()}`] as [string, string]] : []),
          ['Travellers', `${adults} adult${adults > 1 ? 's' : ''}${children ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}`],
          ['Class', cls],
          ['Airline', airline],
          ['Fare type', fare === 'trekker' ? 'Trekker (extra baggage)' : fare === 'flexible' ? 'Flexible date' : fare === 'group' ? 'Group (6+)' : 'Regular'],
        ]}
        notesPlaceholder="Trek you’re joining, mountain-side seat, extra baggage…"
        cta="REQUEST FARES"
        build={() => ({
          kind: 'flight',
          title: `${A.city} → ${B.city}${trip === 'return' ? ' (return)' : ''}`,
          startDate: isoDay(date),
          endDate: back ? isoDay(back) : undefined,
          location: label(A),
          destination: label(B),
          guests: pax,
          details: { trip: trip === 'return' ? 'Round trip' : 'One way', adults, children, class: cls, airline, fare, flexibleDates: fare === 'flexible', extraBaggage: fare === 'trekker' },
        })}
      />
    );
  }

  return (
    <ServicePage
      title="Flight Search"
      subtitle="Domestic flights across Nepal"
      summary={summary}
      onSearch={search}
      searchLabel="SEARCH FLIGHTS"
      tabs={<ModeTabs value={trip} onChange={(v) => { setTrip(v); if (v === 'oneway') setBack(null); }} options={[{ value: 'oneway', label: 'ONE WAY' }, { value: 'return', label: 'ROUND TRIP' }]} />}
      form={
        <FormCard>
          <SwapPair
            left={<Box label="From" value={A.city} sub={`${A.code} – ${A.name}`} onPress={() => setSheet('from')} />}
            right={<Box label="To" value={B.city} sub={`${B.code} – ${B.name}`} onPress={() => setSheet('to')} />}
            onSwap={() => { setFrom(to); setTo(from); }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Box style={{ flex: 1 }} label="Departure date" value={fmtShort(date)} sub={fmtDay(date)} onPress={() => openDate(date, today, (d) => { setDate(d); if (back && back < d) setBack(null); })} />
            <Box
              style={{ flex: 1 }}
              label={back ? 'Return date' : '+ Add return date'}
              value={back ? fmtShort(back) : undefined}
              sub={back ? fmtDay(back) : 'Save on round trips'}
              placeholder="+ ADD RETURN"
              onPress={() => openDate(back ?? date, date, (d) => { setBack(d); setTrip('return'); })}
            />
          </View>
          <Box label="Travellers & class" value={`${pax}, ${cls.split(' ')[0]}`} sub={airline} onPress={() => setSheet('pax')} />
          <OptionChips
            label="Special fares (optional)"
            value={fare}
            onChange={setFare}
            options={[
              { value: 'regular', label: 'Regular' },
              { value: 'trekker', label: 'Trekker', sub: 'Extra baggage' },
              { value: 'flexible', label: 'Flexible date', sub: 'Lukla weather' },
              { value: 'group', label: 'Group 6+', sub: 'Group rate' },
            ]}
          />
          {error ? <Text style={{ fontFamily: fonts.sansSemi, color: colors.destructive, fontSize: 13 }}>{error}</Text> : null}
        </FormCard>
      }
    >
      <View style={{ marginTop: 16 }}>
        <ToolTiles
          items={[
            { icon: CloudSunIcon, label: 'Mountain weather', onPress: () => router.push('/tools') },
            { icon: TaxiIcon, label: 'Airport pickup', onPress: () => router.push('/book/cab') },
            { icon: SuitcaseRollingIcon, label: 'Baggage rules', onPress: () => router.push({ pathname: '/ai', params: { q: 'What is the baggage allowance on Lukla flights?' } }) },
            { icon: MountainsIcon, label: 'Everest flight', onPress: () => router.push('/book/ticket') },
          ]}
        />
      </View>

      <SectionTitle>Offers</SectionTitle>
      <OfferCards
        items={[
          { tag: 'FLIGHTS', title: 'Lukla flights with spare-day cover', text: 'Book your Everest trek and we hold a spare day for weather.', img: '/img/ebc.jpg', cta: 'Book now', onPress: () => router.push({ pathname: '/explore', params: { q: 'everest' } }) },
          { tag: 'COMBO', title: 'Fly + stay in Pokhara', text: 'Flight and a lakeside hotel in one request.', img: '/img/pokhara.jpg', cta: 'Explore', onPress: () => router.push({ pathname: '/stays', params: { where: 'Pokhara' } }) },
          { tag: 'SIGHTSEEING', title: 'Everest mountain flight', text: 'One-hour sunrise flight past the world’s highest peaks.', img: '/img/heli.jpg', cta: 'Book now', onPress: () => router.push('/book/ticket') },
        ]}
      />

      <SectionTitle sub="Tap to fill the search">Popular routes</SectionTitle>
      <HRow gap={10}>
        {[
          ['KTM', 'LUA'],
          ['KTM', 'PKR'],
          ['PKR', 'JMO'],
          ['KTM', 'BHR'],
          ['KTM', 'BWA'],
          ['KTM', 'TMI'],
        ].map(([a, b]) => {
          const x = AIRPORTS.find((p) => p.code === a)!;
          const y = AIRPORTS.find((p) => p.code === b)!;
          return (
            <Pressable key={a + b} onPress={() => { setFrom(label(x)); setTo(label(y)); }} style={{ backgroundColor: '#FFFFFF', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, minWidth: 150, borderWidth: 1, borderColor: colors.border }} accessibilityRole="button" accessibilityLabel={`${x.city} to ${y.city}`}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.onSurface }}>{x.city} → {y.city}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant, marginTop: 2 }}>{a} – {b}</Text>
            </Pressable>
          );
        })}
      </HRow>

      <TrustStrip big="25+" text="years of flying trekkers to Lukla, Jomsom and Pokhara" />

      <SectionTitle>Good to know</SectionTitle>
      <InfoCards
        items={[
          { icon: CloudSunIcon, title: 'Mountain flights are morning flights', text: 'Lukla and Jomsom flights leave early, before the afternoon wind. Delays for weather are normal.' },
          { icon: SuitcaseRollingIcon, title: '10–15 kg baggage', text: 'Small planes have tight limits. Choose the Trekker fare for extra checked baggage.' },
          { icon: AirplaneTiltIcon, title: 'Ramechhap for Lukla', text: 'In peak season some Lukla flights leave from Manthali (Ramechhap), 4–5 hours by road.' },
        ]}
      />

      <SectionTitle>FAQs</SectionTitle>
      <Faqs
        items={[
          { q: 'How do I book a domestic flight?', a: 'Choose your route, date and travellers, tap Search and send the request. We confirm the fare and seats, then you pay in the app.' },
          { q: 'What if my Lukla flight is cancelled?', a: 'Weather cancellations are common. We rebook you on the next available flight; booking a Flexible-date fare and a spare day in your trek helps.' },
          { q: 'Can foreigners pay in rupees?', a: 'Foreign nationals pay the published USD fare. You can see prices in your own currency and pay by card or Khalti.' },
        ]}
      />

      {/* sheets */}
      <ChoiceSheet visible={sheet === 'from'} title="From" value={from} options={AIRPORTS.map((a) => ({ value: label(a), sub: a.name }))} onPick={(v) => { setFrom(v); if (v === to) setTo(from); }} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'to'} title="To" value={to} options={AIRPORTS.filter((a) => label(a) !== from).map((a) => ({ value: label(a), sub: a.name }))} onPick={setTo} onClose={() => setSheet(null)} />
      <Sheet visible={sheet === 'pax'} title="Travellers & class" onClose={() => setSheet(null)}>
        <Stepper label="Adults" hint="12+ years" value={adults} onChange={setAdults} min={1} max={20} />
        <Stepper label="Children" hint="2–11 years" value={children} onChange={setChildren} max={10} />
        <View style={{ height: 8 }} />
        <OptionChips label="Class" value={cls} onChange={setCls} options={CLASSES.map((c) => ({ value: c, label: c }))} />
        <OptionChips label="Preferred airline" value={airline} onChange={setAirline} options={AIRLINES.map((c) => ({ value: c, label: c }))} />
      </Sheet>
      {datePicker}
    </ServicePage>
  );
}
