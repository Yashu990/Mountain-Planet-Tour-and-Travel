import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, space, squircle, type } from '@/theme';
import { BookingDone, BookingScreen, useBookingSubmit, useContact } from '@/components/BookingLayout';
import { FormCard, SelectField, Stepper } from '@/components/form';
import { DateField, fmtTime, isoDay } from '@/components/DateField';
import { Chip, ChipRow, Field, Gutter, Kicker } from '@/components/ui';
import { QuickChip } from '@/components/filters';
import { BusIcon, CarIcon, MapPinIcon, TaxiIcon, type Icon } from '@/components/icons';

const SERVICES = ['Airport pickup', 'Airport drop-off', 'City ride', 'Full-day hire', 'Intercity transfer'] as const;
type Service = (typeof SERVICES)[number];

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
];

const CAB_EXTRAS = ['Air-conditioned', 'English-speaking driver', 'Child seat', 'Roof rack', 'Name sign at arrivals'];

const VEHICLES:{ id: string; label: string; seats: number; icon: Icon }[] = [
  { id: 'Car', label: 'Car', seats: 3, icon: TaxiIcon },
  { id: 'SUV / Jeep', label: 'SUV / Jeep', seats: 6, icon: CarIcon },
  { id: 'Van', label: 'Van', seats: 12, icon: BusIcon },
  { id: 'Tourist bus', label: 'Tourist bus', seats: 30, icon: BusIcon },
];

export default function CabBooking() {
  const params = useLocalSearchParams<{ service?: string }>();
  const today = new Date();
  const [service, setService] = useState<Service>((SERVICES as readonly string[]).includes(params.service ?? '') ? (params.service as Service) : 'Airport pickup');
  const [pickup, setPickup] = useState('Tribhuvan Airport, Kathmandu (KTM)');
  const [drop, setDrop] = useState('Thamel, Kathmandu');
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [days, setDays] = useState(1);
  const [people, setPeople] = useState(2);
  const [bags, setBags] = useState(2);
  const [vehicle, setVehicle] = useState('Car');
  const [flightNo, setFlightNo] = useState('');
  const [notes, setNotes] = useState('');
  const [extras, setExtras] = useState<string[]>([]);
  const toggleExtra = (x: string) => setExtras((e) => (e.includes(x) ? e.filter((y) => y !== x) : [...e, x]));
  const { contact, fields, validate } = useContact();
  const { done, submit, footer } = useBookingSubmit();
  const { t } = useI18n();

  // Sensible pickup / drop-off defaults per service.
  const chooseService = (s: Service) => {
    setService(s);
    if (s === 'Airport pickup') { setPickup('Tribhuvan Airport, Kathmandu (KTM)'); setDrop('Thamel, Kathmandu'); }
    if (s === 'Airport drop-off') { setPickup('Thamel, Kathmandu'); setDrop('Tribhuvan Airport, Kathmandu (KTM)'); }
    if (s === 'Intercity transfer') { setPickup('Thamel, Kathmandu'); setDrop('Pokhara Lakeside'); }
  };

  // Upgrade the vehicle when the group no longer fits.
  const changePeople = (n: number) => {
    setPeople(n);
    const cur = VEHICLES.find((v) => v.id === vehicle)!;
    if (n > cur.seats) setVehicle(VEHICLES.find((v) => v.seats >= n)?.id ?? 'Tourist bus');
  };

  if (done) return <BookingDone result={done} />;

  const airport = service === 'Airport pickup' || service === 'Airport drop-off';
  const multiDay = service === 'Full-day hire';

  const send = () => {
    const problem =
      !pickup.trim() || !drop.trim() ? 'Please add pickup and drop-off.' :
      !date ? 'Please choose the date.' :
      !time ? 'Please choose the pickup time.' :
      validate();
    const end = date && multiDay && days > 1 ? new Date(date.getTime() + (days - 1) * 86400000) : null;
    submit(
      {
        kind: 'cab',
        title: `${service}: ${pickup.split(',')[0]} → ${drop.split(',')[0]}`,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        promoCode: contact.promo || undefined,
        startDate: date ? isoDay(date) : '',
        endDate: end ? isoDay(end) : undefined,
        startTime: time ? fmtTime(time) : undefined,
        location: pickup,
        destination: drop,
        guests: people,
        details: { service, vehicle, luggage: bags, ...(extras.length ? { extras: extras.join(', ') } : {}), ...(multiDay ? { days } : {}), ...(airport && flightNo ? { flightNumber: flightNo } : {}) },
        notes,
      },
      problem || undefined,
    );
  };

  return (
    <BookingScreen image="/img/kathmandu.jpg" kicker="Cabs & vehicles" title="Book a ride">
      <FormCard>
        <View style={{ marginHorizontal: -20 }}>
          <ChipRow>{SERVICES.map((s) => <Chip key={s} label={s} active={service === s} onPress={() => chooseService(s)} />)}</ChipRow>
        </View>
        <SelectField label="Pickup" value={pickup} onChange={setPickup} options={PLACES} icon={MapPinIcon} allowCustom customPlaceholder="Type a hotel or address" />
        <SelectField label={multiDay ? 'Going to' : 'Drop-off'} value={drop} onChange={setDrop} options={PLACES} icon={MapPinIcon} allowCustom customPlaceholder="Type a hotel or address" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <DateField label="Date" value={date} onChange={setDate} minimumDate={today} placeholder="Select" />
          <DateField label="Pickup time" value={time} onChange={setTime} mode="time" placeholder="Select" />
        </View>
        {airport ? <Field label="Flight number (optional)" value={flightNo} onChangeText={setFlightNo} autoCapitalize="characters" placeholder="e.g. QR 652 — we track delays" /> : null}
        <View>
          {multiDay ? <Stepper label="Days" value={days} onChange={setDays} min={1} max={30} /> : null}
          <Stepper label="Passengers" value={people} onChange={changePeople} min={1} max={45} />
          <Stepper label="Bags" value={bags} onChange={setBags} max={40} />
        </View>
        <View style={{ gap: 10 }}>
          <Kicker>Vehicle</Kicker>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {VEHICLES.map((v) => {
              const on = v.id === vehicle;
              const fits = people <= v.seats;
              return (
                <Pressable
                  key={v.id}
                  onPress={() => fits && setVehicle(v.id)}
                  disabled={!fits}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on, disabled: !fits }}
                  style={{ width: '47%', flexGrow: 1, padding: 14, borderRadius: radius.lg, backgroundColor: on ? colors.secondary : colors.surfaceAlt, opacity: fits ? 1 : 0.4, gap: 6, ...squircle }}
                >
                  <v.icon size={24} color={on ? colors.onSecondary : colors.secondary} weight="duotone" />
                  <Text style={[type.headlineSm, { fontSize: 16, color: on ? colors.onSecondary : colors.onSurface }]}>{v.label}</Text>
                  <Text style={[type.bodySm, { color: on ? 'rgba(255,255,255,0.85)' : colors.onSurfaceVariant }]}>Up to {v.seats} people</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ gap: 10 }}>
          <Kicker>Extras</Kicker>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CAB_EXTRAS.map((x) => <QuickChip key={x} label={x} on={extras.includes(x)} onPress={() => toggleExtra(x)} />)}
          </View>
        </View>
      </FormCard>

      <Gutter style={{ marginTop: space.xl, gap: 16 }}>
        <Text style={type.headlineMd}>{t('common.yourDetails')}</Text>
        {fields}
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Child seat, stops on the way, roof rack for bikes…" />
        {footer('Request this ride', send)}
      </Gutter>
    </BookingScreen>
  );
}
