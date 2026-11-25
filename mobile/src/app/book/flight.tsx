import { useI18n } from '@/lib/i18n';
import { useLayoutWidth } from '@/lib/layout';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space, type } from '@/theme';
import { stays } from '@/data/stays';
import { useContent } from '@/lib/content';
import { BookingDone, BookingScreen, useBookingSubmit, useContact } from '@/components/BookingLayout';
import { Checkbox, FormCard, Segmented, SelectField, Stepper } from '@/components/form';
import { DateField, isoDay } from '@/components/DateField';
import { Chip, ChipRow, Field, Gutter, Kicker, Section, SectionHeader } from '@/components/ui';
import { StayCard } from '@/components/cards';
import { AirplaneTiltIcon } from '@/components/icons';

// Nepal's domestic airports most used by travellers.
export const AIRPORTS = [
  'Kathmandu (KTM)',
  'Lukla (LUA)',
  'Pokhara (PKR)',
  'Jomsom (JMO)',
  'Bharatpur / Chitwan (BHR)',
  'Bhairahawa / Lumbini (BWA)',
  'Biratnagar (BIR)',
  'Bhadrapur (BDP)',
  'Tumlingtar (TMI)',
  'Nepalgunj (KEP)',
  'Simara (SIF)',
  'Janakpur (JKR)',
];
const CLASSES = ['Economy', 'Business (where available)'];
// Nepali domestic carriers; Lukla is served by the smaller STOL operators.
const AIRLINES = ['Any airline', 'Buddha Air', 'Yeti Airlines', 'Shree Airlines', 'Nepal Airlines', 'Tara Air', 'Summit Air', 'Sita Air'];
const TIMES = ['Any time', 'Early morning (before 9)', 'Morning (9–12)', 'Afternoon (12–6)'];

export default function FlightBooking() {
  useContent();
  const width = useLayoutWidth();
  const today = new Date();
  const [trip, setTrip] = useState<'oneway' | 'return'>('oneway');
  const [from, setFrom] = useState('Kathmandu (KTM)');
  const [to, setTo] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [back, setBack] = useState<Date | null>(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cls, setCls] = useState('Economy');
  const [flexible, setFlexible] = useState(false);
  const [airline, setAirline] = useState(AIRLINES[0]);
  const [departTime, setDepartTime] = useState(TIMES[0]);
  const [extraBag, setExtraBag] = useState(false);
  const [notes, setNotes] = useState('');
  const { contact, fields, validate } = useContact();
  const { done, submit, footer } = useBookingSubmit();
  const { t } = useI18n();

  if (done) return <BookingDone result={done} />;

  const send = () => {
    const problem =
      !to ? 'Please choose where you are flying to.' :
      from === to ? 'Departure and arrival must be different.' :
      !date ? 'Please choose your flight date.' :
      trip === 'return' && !back ? 'Please choose your return date.' :
      trip === 'return' && back && date && back < date ? 'Return must be after departure.' :
      validate();
    submit(
      {
        kind: 'flight',
        title: `${from.replace(/ \(.*\)/, '')} → ${to.replace(/ \(.*\)/, '')}${trip === 'return' ? ' (return)' : ''}`,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        promoCode: contact.promo || undefined,
        startDate: date ? isoDay(date) : '',
        endDate: trip === 'return' && back ? isoDay(back) : undefined,
        location: from,
        destination: to,
        guests: adults + children,
        details: { trip: trip === 'return' ? 'Round trip' : 'One way', adults, children, class: cls, airline, departureTime: departTime, extraBaggage: extraBag, flexibleDates: flexible },
        notes,
      },
      problem || undefined,
    );
  };

  const colW = (width - space.gutter * 2 - space.md) / 2;
  return (
    <BookingScreen image="/img/heli.jpg" kicker="Domestic flights" title="Fly across Nepal">
      <FormCard>
        <Segmented value={trip} onChange={setTrip} options={[{ value: 'oneway', label: 'One way' }, { value: 'return', label: 'Round trip' }]} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SelectField label="From" value={from} onChange={setFrom} options={AIRPORTS} icon={AirplaneTiltIcon} />
          <SelectField label="To" value={to} onChange={setTo} options={AIRPORTS.filter((a) => a !== from)} />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateField label="Date" value={date} onChange={(d) => { setDate(d); if (back && back < d) setBack(null); }} minimumDate={today} placeholder="Select" />
          {trip === 'return' ? <DateField label="Return" value={back} onChange={setBack} minimumDate={date ?? today} placeholder="Select" /> : null}
        </View>
        <SelectField label="Class" value={cls} onChange={setCls} options={CLASSES} />
        <View>
          <Kicker>Passengers</Kicker>
          <Stepper label="Adults" hint="12+ years" value={adults} onChange={setAdults} min={1} max={20} />
          <Stepper label="Children" hint="2–11 years" value={children} onChange={setChildren} max={10} />
        </View>
        <SelectField label="Preferred airline" value={airline} onChange={setAirline} options={AIRLINES} />
        <View style={{ gap: 10 }}>
          <Kicker>Departure time</Kicker>
          <View style={{ marginHorizontal: -20 }}>
            <ChipRow>{TIMES.map((t) => <Chip key={t} label={t} active={departTime === t} onPress={() => setDepartTime(t)} />)}</ChipRow>
          </View>
        </View>
        <Checkbox label="Extra checked baggage (over the 10–15 kg domestic allowance)" checked={extraBag} onChange={setExtraBag} />
        <Checkbox label="My dates are flexible by a day or two (helps with Lukla weather)" checked={flexible} onChange={setFlexible} />
      </FormCard>

      <Gutter style={{ marginTop: space.xl, gap: 16 }}>
        <Text style={type.headlineMd}>{t('common.yourDetails')}</Text>
        {fields}
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Trek you’re joining, extra baggage, mountain-side seat…" />
        {footer('Request fares', send)}
      </Gutter>

      <Section>
        <SectionHeader kicker="Hotels & homestays" title="Popular stays" action="See all" onAction={() => router.push('/stays')} />
        <Gutter style={{ flexDirection: 'row', gap: space.md }}>
          {stays.slice(0, 2).map((s) => <StayCard key={s.slug} stay={s} width={colW} />)}
        </Gutter>
        {stays.length === 0 ? <Gutter><Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Stays are coming soon.</Text></Gutter> : null}
      </Section>
    </BookingScreen>
  );
}
