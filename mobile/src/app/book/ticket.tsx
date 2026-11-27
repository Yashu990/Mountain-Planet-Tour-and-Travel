// Activities & tickets — travel-app layout: photo carousel, search box, date & guests, SEARCH,
// then trending places (bubbles), top experiences (numbered), offers, trust and FAQs.
import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { isoDay } from '@/components/DateField';
import { Stepper } from '@/components/form';
import { ReviewStep } from '@/components/ReviewStep';
import { useCurrency } from '@/lib/currency';
import {
  Box,
  Bubbles,
  ChoiceSheet,
  Faqs,
  fmtDay,
  fmtShort,
  FormCard,
  OfferCards,
  OptionChips,
  SectionTitle,
  ServicePage,
  Sheet,
  TopList,
  TrustStrip,
  useDatePicker,
} from '@/components/service';
import { MagnifyingGlassIcon } from '@/components/icons';

const ACTIVITIES: { name: string; place: string; img: string; usd: number }[] = [
  { name: 'Paragliding over Pokhara', place: 'Pokhara', img: '/img/paragliding.jpg', usd: 95 },
  { name: 'Everest mountain flight', place: 'Kathmandu', img: '/img/heli.jpg', usd: 230 },
  { name: 'Trishuli river rafting', place: 'Trishuli', img: '/img/rafting.jpg', usd: 60 },
  { name: 'Chitwan jungle safari', place: 'Chitwan', img: '/img/chitwan.jpg', usd: 75 },
  { name: 'Kathmandu heritage walk', place: 'Kathmandu', img: '/img/kathmandu.jpg', usd: 35 },
  { name: 'Bhaktapur pottery & food tour', place: 'Bhaktapur', img: '/img/bhaktapur.jpg', usd: 40 },
  { name: 'Nagarkot sunrise trip', place: 'Nagarkot', img: '/img/poonhill.jpg', usd: 45 },
  { name: 'Lumbini monastery tour', place: 'Lumbini', img: '/img/lumbini.jpg', usd: 50 },
];
const SLOTS = ['Any time', 'Morning', 'Afternoon', 'Evening'];

export default function Activities() {
  const params = useLocalSearchParams<{ activity?: string }>();
  const { price } = useCurrency();
  const today = new Date();
  const [activity, setActivity] = useState(params.activity ?? '');
  const [date, setDate] = useState<Date>(new Date(today.getTime() + 2 * 86400000));
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [pickup, setPickup] = useState<'yes' | 'no'>('yes');
  const [sheet, setSheet] = useState<null | 'what' | 'pax'>(null);
  const [step, setStep] = useState<'search' | 'review'>('search');
  const [datePicker, openDate] = useDatePicker();
  const pick = (name: string) => { setActivity(name); setStep('review'); };
  const pax = adults + children;
  const summary = `${(activity || 'ANY ACTIVITY').toUpperCase()}\n${fmtShort(date).toUpperCase()} | ${pax} GUESTS`;

  if (step === 'review') {
    return (
      <ReviewStep
        title={activity || 'Activity'}
        onEdit={() => setStep('search')}
        lines={[
          ['Activity', activity || 'Help me choose'],
          ['Date', `${fmtShort(date)} ${date.getFullYear()}`],
          ['Time', slot],
          ['Guests', `${adults} adult${adults > 1 ? 's' : ''}${children ? `, ${children} child${children > 1 ? 'ren' : ''}` : ''}`],
          ['Hotel pickup', pickup === 'yes' ? 'Yes' : 'No'],
        ]}
        cta="REQUEST TICKETS"
        build={() => ({
          kind: 'ticket',
          title: activity || 'Activity',
          startDate: isoDay(date),
          location: activity || 'Activity',
          guests: pax,
          details: { activity: activity || 'Help me choose', adults, children, timeOfDay: slot, hotelPickup: pickup === 'yes' },
        })}
      />
    );
  }

  return (
    <ServicePage
      title="Activities & Tickets"
      subtitle="Adventures, tours and attractions"
      hero={{ images: ['/img/paragliding.jpg', '/img/rafting.jpg', '/img/chitwan.jpg', '/img/heli.jpg'], caption: 'Things to do in Nepal', sub: 'Paragliding · Rafting · Safaris · Mountain flights' }}
      summary={summary}
      onSearch={() => setStep('review')}
      form={
        <FormCard>
          <Box icon={MagnifyingGlassIcon} label="Activity" value={activity || undefined} placeholder="Search paragliding, rafting, safari…" onPress={() => setSheet('what')} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Box style={{ flex: 1 }} label="Date" value={fmtShort(date)} sub={fmtDay(date)} onPress={() => openDate(date, today, setDate)} />
            <Box style={{ flex: 1 }} label="Guests" value={`${pax} guest${pax > 1 ? 's' : ''}`} sub={slot} onPress={() => setSheet('pax')} />
          </View>
        </FormCard>
      }
    >
      <SectionTitle>Trending places</SectionTitle>
      <Bubbles
        items={[
          { label: 'Pokhara', img: '/img/pokhara.jpg', onPress: () => setActivity('Paragliding over Pokhara') },
          { label: 'Chitwan', img: '/img/chitwan.jpg', onPress: () => setActivity('Chitwan jungle safari') },
          { label: 'Kathmandu', img: '/img/kathmandu.jpg', onPress: () => setActivity('Kathmandu heritage walk') },
          { label: 'Bhaktapur', img: '/img/bhaktapur.jpg', onPress: () => setActivity('Bhaktapur pottery & food tour') },
          { label: 'Nagarkot', img: '/img/poonhill.jpg', onPress: () => setActivity('Nagarkot sunrise trip') },
          { label: 'Lumbini', img: '/img/lumbini.jpg', onPress: () => setActivity('Lumbini monastery tour') },
        ]}
      />

      <SectionTitle>Top experiences in Nepal</SectionTitle>
      <TopList items={ACTIVITIES.map((a) => ({ place: a.place, title: a.name, price: `from ${price(a.usd)} per adult`, img: a.img, onPress: () => pick(a.name) }))} />

      <SectionTitle>Offers</SectionTitle>
      <OfferCards
        items={[
          { tag: 'COMBO', title: 'Paragliding + lakeside stay', text: 'Fly over Phewa Lake and stay by the water.', img: '/img/paragliding.jpg', cta: 'Plan it', onPress: () => router.push({ pathname: '/stays', params: { where: 'Pokhara' } }) },
          { tag: 'ADVENTURE', title: 'Rafting on the way to Chitwan', text: 'Raft the Trishuli, then continue to the jungle.', img: '/img/rafting.jpg', cta: 'Book now', onPress: () => pick('Trishuli river rafting') },
        ]}
      />

      <TrustStrip big="4.8★" text="average rating from travellers on our activities" />

      <SectionTitle>FAQs</SectionTitle>
      <Faqs
        items={[
          { q: 'Is hotel pickup included?', a: 'For most activities in Kathmandu and Pokhara, yes — choose hotel pickup and add your hotel in the notes.' },
          { q: 'What if the weather is bad?', a: 'Paragliding and mountain flights depend on weather. We move you to the next good slot or refund you.' },
          { q: 'Can children join?', a: 'Many activities welcome children. Paragliding and rafting have minimum ages; we confirm when you request.' },
        ]}
      />

      <ChoiceSheet visible={sheet === 'what'} title="Choose an activity" value={activity} options={ACTIVITIES.map((a) => ({ value: a.name, sub: `${a.place} · from ${price(a.usd)}` }))} allowCustom customPlaceholder="Search or type an activity" onPick={setActivity} onClose={() => setSheet(null)} />
      <Sheet visible={sheet === 'pax'} title="Guests & time" onClose={() => setSheet(null)}>
        <Stepper label="Adults" value={adults} onChange={setAdults} min={1} max={30} />
        <Stepper label="Children" hint="Under 12" value={children} onChange={setChildren} max={20} />
        <OptionChips label="Time of day" value={slot} onChange={setSlot} options={SLOTS.map((s) => ({ value: s, label: s }))} />
        <OptionChips label="Hotel pickup" value={pickup} onChange={setPickup} options={[{ value: 'yes', label: 'Yes, pick me up' }, { value: 'no', label: 'No, I’ll come' }]} />
      </Sheet>
      {datePicker}
    </ServicePage>
  );
}
