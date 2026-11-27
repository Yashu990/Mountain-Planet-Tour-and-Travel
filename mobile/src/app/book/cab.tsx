// Cab search — travel-app layout: Airport / Outstation / Hourly & day tabs, From ⇅ To,
// trip start, passengers & vehicle, SEARCH, then vehicles, offers, trust, what's new and FAQs.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius } from '@/theme';
import { fmtTime, isoDay } from '@/components/DateField';
import { Stepper } from '@/components/form';
import { Field } from '@/components/ui';
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
  TrustStrip,
  useDatePicker,
} from '@/components/service';
import { AirplaneTiltIcon, BusIcon, CarIcon, ClockIcon, ShieldCheckIcon, TaxiIcon, type Icon } from '@/components/icons';

type Mode = 'airport' | 'outstation' | 'hourly';
const PLACES = [
  'Tribhuvan Airport, Kathmandu (KTM)',
  'Thamel, Kathmandu',
  'My hotel in Kathmandu',
  'Bhaktapur Durbar Square',
  'Nagarkot',
  'Pokhara Lakeside',
  'Pokhara Airport',
  'Sauraha, Chitwan',
  'Lumbini',
  'Besisahar (Annapurna Circuit start)',
  'Syabrubesi (Langtang start)',
  'Manthali / Ramechhap Airport',
];
const VEHICLES: { id: string; label: string; seats: number; icon: Icon; note: string }[] = [
  { id: 'Car', label: 'Car', seats: 3, icon: TaxiIcon, note: 'Sedan · 2 bags' },
  { id: 'SUV / Jeep', label: 'SUV / Jeep', seats: 6, icon: CarIcon, note: 'Mountain roads' },
  { id: 'Van', label: 'Van', seats: 12, icon: BusIcon, note: 'Groups & gear' },
  { id: 'Tourist bus', label: 'Tourist bus', seats: 30, icon: BusIcon, note: 'Big groups' },
];
const EXTRAS = ['Air-conditioned', 'English-speaking driver', 'Child seat', 'Roof rack', 'Name sign at arrivals'];
const short = (p: string) => p.split(',')[0].replace(/ \(.*\)/, '');

export default function CabSearch() {
  const params = useLocalSearchParams<{ service?: string }>();
  const today = new Date();
  const [mode, setMode] = useState<Mode>(params.service === 'Intercity transfer' ? 'outstation' : params.service === 'Full-day hire' ? 'hourly' : 'airport');
  const [from, setFrom] = useState(PLACES[0]);
  const [to, setTo] = useState(PLACES[1]);
  const [date, setDate] = useState<Date>(new Date(today.getTime() + 86400000));
  const [time, setTime] = useState<Date>(() => { const d = new Date(); d.setHours(10, 0, 0, 0); return d; });
  const [days, setDays] = useState(1);
  const [people, setPeople] = useState(2);
  const [bags, setBags] = useState(2);
  const [vehicle, setVehicle] = useState('Car');
  const [extras, setExtras] = useState<string[]>([]);
  const [flightNo, setFlightNo] = useState('');
  const [sheet, setSheet] = useState<null | 'from' | 'to' | 'pax'>(null);
  const [step, setStep] = useState<'search' | 'review'>('search');
  const [datePicker, openDate] = useDatePicker();

  const chooseMode = (m: Mode) => {
    setMode(m);
    if (m === 'airport') { setFrom(PLACES[0]); setTo(PLACES[1]); }
    if (m === 'outstation') { setFrom(PLACES[1]); setTo('Pokhara Lakeside'); }
    if (m === 'hourly') { setFrom(PLACES[1]); setTo('Bhaktapur Durbar Square'); }
  };
  const changePeople = (n: number) => {
    setPeople(n);
    const cur = VEHICLES.find((v) => v.id === vehicle)!;
    if (n > cur.seats) setVehicle(VEHICLES.find((v) => v.seats >= n)?.id ?? 'Tourist bus');
  };
  const service = mode === 'airport' ? (from.includes('Airport') ? 'Airport pickup' : 'Airport drop-off') : mode === 'outstation' ? 'Intercity transfer' : 'Full-day hire';
  const summary = `${short(from).toUpperCase()} → ${short(to).toUpperCase()}\n${fmtShort(date).toUpperCase()}, ${fmtTime(time)} | ${people} PAX | ${vehicle.toUpperCase()}`;

  if (step === 'review') {
    const end = mode === 'hourly' && days > 1 ? new Date(date.getTime() + (days - 1) * 86400000) : null;
    return (
      <ReviewStep
        title={`${service}`}
        onEdit={() => setStep('search')}
        lines={[
          ['Pickup', from],
          [mode === 'hourly' ? 'Going to' : 'Drop-off', to],
          ['Date & time', `${fmtShort(date)} ${date.getFullYear()}, ${fmtTime(time)}`],
          ...(mode === 'hourly' ? [['Days', String(days)] as [string, string]] : []),
          ['Passengers', `${people} · ${bags} bags`],
          ['Vehicle', vehicle],
          ...(extras.length ? [['Extras', extras.join(', ')] as [string, string]] : []),
        ]}
        extra={mode === 'airport' ? <View style={{ backgroundColor: '#fff', borderRadius: radius.lg, padding: 16 }}><Field label="Flight number (optional)" value={flightNo} onChangeText={setFlightNo} autoCapitalize="characters" placeholder="e.g. QR 652 — we track delays" /></View> : undefined}
        notesPlaceholder="Stops on the way, child seat, roof rack for bikes…"
        cta="REQUEST THIS RIDE"
        build={() => ({
          kind: 'cab',
          title: `${service}: ${short(from)} → ${short(to)}`,
          startDate: isoDay(date),
          endDate: end ? isoDay(end) : undefined,
          startTime: fmtTime(time),
          location: from,
          destination: to,
          guests: people,
          details: { service, vehicle, luggage: bags, ...(extras.length ? { extras: extras.join(', ') } : {}), ...(mode === 'hourly' ? { days } : {}), ...(flightNo ? { flightNumber: flightNo } : {}) },
        })}
      />
    );
  }

  return (
    <ServicePage
      title="Cab Search"
      subtitle="Airport transfers, intercity and day hire"
      summary={summary}
      onSearch={() => setStep('review')}
      tabs={<ModeTabs value={mode} onChange={chooseMode} options={[{ value: 'outstation', label: 'Outstation' }, { value: 'airport', label: 'Airport' }, { value: 'hourly', label: 'Hourly / Day' }]} />}
      form={
        <FormCard>
          <SwapPair
            left={<Box label="From" value={short(from)} sub={from.includes(',') ? from.split(',').slice(1).join(',').trim() : 'Pickup'} onPress={() => setSheet('from')} />}
            right={<Box label={mode === 'hourly' ? 'Going to' : 'To'} value={short(to)} sub={to.includes(',') ? to.split(',').slice(1).join(',').trim() : 'Drop-off'} onPress={() => setSheet('to')} />}
            onSwap={() => { setFrom(to); setTo(from); }}
          />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Box style={{ flex: 1 }} label="Trip start" value={fmtShort(date)} sub={fmtDay(date)} onPress={() => openDate(date, today, setDate)} />
            <Box style={{ flex: 1 }} label="Pickup time" value={fmtTime(time)} sub="24-hour" onPress={() => openDate(time, undefined, setTime, 'time')} />
          </View>
          <Box label="Passengers, bags & vehicle" value={`${people} people · ${vehicle}`} sub={`${bags} bags${mode === 'hourly' ? ` · ${days} day${days > 1 ? 's' : ''}` : ''}`} onPress={() => setSheet('pax')} />
        </FormCard>
      }
    >
      <SectionTitle sub="Tap to choose">Our vehicles</SectionTitle>
      <HRow gap={10}>
        {VEHICLES.map((v) => {
          const on = v.id === vehicle;
          const fits = people <= v.seats;
          return (
            <Pressable key={v.id} disabled={!fits} onPress={() => setVehicle(v.id)} style={{ width: 140, backgroundColor: on ? colors.secondary : '#fff', borderRadius: radius.lg, padding: 14, gap: 6, opacity: fits ? 1 : 0.4, borderWidth: 1, borderColor: on ? colors.secondary : colors.border }} accessibilityRole="radio" accessibilityState={{ checked: on, disabled: !fits }}>
              <v.icon size={28} color={on ? '#fff' : colors.secondary} weight="duotone" />
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: on ? '#fff' : colors.onSurface }}>{v.label}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: on ? 'rgba(255,255,255,0.85)' : colors.onSurfaceVariant }}>Up to {v.seats} · {v.note}</Text>
            </Pressable>
          );
        })}
      </HRow>

      <SectionTitle>Offers</SectionTitle>
      <OfferCards
        items={[
          { tag: 'AIRPORT', title: 'Free name-sign pickup with any trek', text: 'Book a trek and your arrival transfer is on us.', img: '/img/kathmandu.jpg', cta: 'Explore treks', onPress: () => router.navigate('/explore') },
          { tag: 'OUTSTATION', title: 'Kathmandu → Pokhara by private car', text: '6–7 hours with stops at Kurintar and Bandipur.', img: '/img/pokhara.jpg', cta: 'Book now', onPress: () => chooseMode('outstation') },
        ]}
      />

      <TrustStrip big="10,000+" text="airport pickups and mountain-road transfers by our licensed drivers" />

      <SectionTitle>What&apos;s new</SectionTitle>
      <InfoCards
        items={[
          { icon: AirplaneTiltIcon, title: 'Flight tracking', text: 'Add your flight number and your driver waits even if you land late.' },
          { icon: ClockIcon, title: 'Day hire', text: 'Car and driver for a full day of Kathmandu Valley sightseeing.' },
          { icon: ShieldCheckIcon, title: 'Licensed drivers', text: 'Experienced on mountain roads to Besisahar, Syabrubesi and Ramechhap.' },
        ]}
      />

      <SectionTitle>FAQs</SectionTitle>
      <Faqs
        items={[
          { q: 'How do I book an airport pickup?', a: 'Choose Airport, set Tribhuvan Airport as pickup, add the date and time and send the request. Add your flight number so we track delays.' },
          { q: 'Can I book a car to a trek start?', a: 'Yes — choose Outstation and pick Besisahar, Syabrubesi or Ramechhap. We use 4×4 jeeps where roads need them.' },
          { q: 'When do I pay?', a: 'We confirm the price first. You can then pay in the app or to the driver.' },
        ]}
      />

      <ChoiceSheet visible={sheet === 'from'} title="Pickup" value={from} options={PLACES} allowCustom customPlaceholder="Type a hotel or address" onPick={setFrom} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'to'} title={mode === 'hourly' ? 'Going to' : 'Drop-off'} value={to} options={PLACES.filter((p) => p !== from)} allowCustom customPlaceholder="Type a hotel or address" onPick={setTo} onClose={() => setSheet(null)} />
      <Sheet visible={sheet === 'pax'} title="Passengers, bags & vehicle" onClose={() => setSheet(null)}>
        <Stepper label="Passengers" value={people} onChange={changePeople} min={1} max={45} />
        <Stepper label="Bags" value={bags} onChange={setBags} max={40} />
        {mode === 'hourly' ? <Stepper label="Days" value={days} onChange={setDays} min={1} max={30} /> : null}
        <OptionChips label="Vehicle" value={vehicle} onChange={setVehicle} options={VEHICLES.filter((v) => v.seats >= people).map((v) => ({ value: v.id, label: v.label, sub: `Up to ${v.seats}` }))} />
        <View style={{ gap: 8, marginTop: 6 }}>
          <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12, color: colors.onSurfaceVariant, letterSpacing: 0.5 }}>EXTRAS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {EXTRAS.map((x) => {
              const on = extras.includes(x);
              return (
                <Pressable key={x} onPress={() => setExtras((e) => (on ? e.filter((y) => y !== x) : [...e, x]))} style={{ borderWidth: 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? 'rgba(217,90,64,0.06)' : '#fff', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <Text style={{ fontFamily: fonts.sansSemi, fontSize: 13, color: on ? colors.primary : colors.onSurface }}>{x}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Sheet>
      {datePicker}
    </ServicePage>
  );
}
