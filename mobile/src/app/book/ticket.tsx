import { useI18n } from '@/lib/i18n';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { space, type } from '@/theme';
import { BookingDone, BookingScreen, useBookingSubmit, useContact } from '@/components/BookingLayout';
import { Checkbox, FormCard, SelectField, Stepper } from '@/components/form';
import { DateField, isoDay } from '@/components/DateField';
import { Chip, ChipRow, Field, Gutter, Kicker } from '@/components/ui';
import { TicketIcon } from '@/components/icons';

const ACTIVITIES = [
  'Paragliding over Pokhara',
  'Trishuli river rafting',
  'Chitwan jungle safari',
  'Everest mountain flight (from Kathmandu)',
  'Cultural show / festival',
  'Cooking class in Kathmandu',
];

export default function TicketBooking() {
  const params = useLocalSearchParams<{ activity?: string }>();
  const today = new Date();
  const [activity, setActivity] = useState(params.activity ?? '');
  const [date, setDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [notes, setNotes] = useState('');
  const [slot, setSlot] = useState('Any time');
  const [pickup, setPickup] = useState(false);
  const { contact, fields, validate } = useContact();
  const { done, submit, footer } = useBookingSubmit();
  const { t } = useI18n();

  if (done) return <BookingDone result={done} />;

  const send = () => {
    const problem = !activity ? 'Please choose an activity.' : !date ? 'Please choose a date.' : validate();
    submit(
      {
        kind: 'ticket',
        title: activity,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        promoCode: contact.promo || undefined,
        startDate: date ? isoDay(date) : '',
        location: activity,
        guests: adults + children,
        details: { activity, adults, children, timeOfDay: slot, hotelPickup: pickup },
        notes,
      },
      problem || undefined,
    );
  };

  return (
    <BookingScreen image="/img/paragliding.jpg" kicker="Tickets & activities" title="Book an experience">
      <FormCard>
        <SelectField label="Activity" value={activity} onChange={setActivity} options={ACTIVITIES} icon={TicketIcon} allowCustom customPlaceholder="Something else? Type it" />
        <DateField label="Date" value={date} onChange={setDate} minimumDate={today} placeholder="Select" />
        <View style={{ gap: 10 }}>
          <Kicker>Time of day</Kicker>
          <View style={{ marginHorizontal: -20 }}>
            <ChipRow>{['Any time', 'Morning', 'Afternoon', 'Evening'].map((t) => <Chip key={t} label={t} active={slot === t} onPress={() => setSlot(t)} />)}</ChipRow>
          </View>
        </View>
        <Checkbox label="Pick me up from my hotel" checked={pickup} onChange={setPickup} />
        <View>
          <Kicker>People</Kicker>
          <Stepper label="Adults" value={adults} onChange={setAdults} min={1} max={30} />
          <Stepper label="Children" hint="Age limits vary by activity" value={children} onChange={setChildren} max={20} />
        </View>
      </FormCard>
      <Gutter style={{ marginTop: space.xl, gap: 16 }}>
        <Text style={type.headlineMd}>{t('common.yourDetails')}</Text>
        {fields}
        <Field label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Weight for paragliding, preferred time, pickup from hotel…" />
        {footer('Request tickets', send)}
      </Gutter>
    </BookingScreen>
  );
}
