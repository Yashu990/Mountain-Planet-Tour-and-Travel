// Hotels & homestays search — travel-app layout: Hotels / Homestays / Near me tabs, city with
// Near me, check-in · nights · check-out, rooms & guests, SEARCH, then collections, cities,
// stays for you, offers, trust and FAQs. SEARCH opens the results list (/stays).
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { colors, fonts, radius } from '@/theme';
import { isoDay } from '@/components/DateField';
import { Stepper } from '@/components/form';
import { useContent } from '@/lib/content';
import { useStayPrice } from '@/lib/stayPrice';
import { useCurrency } from '@/lib/currency';
import { addRecentSearch } from '@/lib/recent';
import { img } from '@/lib/images';
import { stays, type StayKind } from '@/data/stays';
import {
  Box,
  Bubbles,
  ChoiceSheet,
  DateRangeBox,
  Faqs,
  FormCard,
  HRow,
  ModeTabs,
  OfferCards,
  SectionTitle,
  ServicePage,
  Sheet,
  TileGrid,
  TrustStrip,
  useDatePicker,
} from '@/components/service';
import { CrosshairIcon, HeartIcon, MagnifyingGlassIcon } from '@/components/icons';

const CITIES = [
  { value: 'Kathmandu', sub: 'Thamel, Boudha, Patan' },
  { value: 'Pokhara', sub: 'Lakeside, Sarangkot' },
  { value: 'Chitwan', sub: 'Sauraha, national park' },
  { value: 'Nagarkot', sub: 'Himalayan sunrise' },
  { value: 'Bhaktapur', sub: 'Medieval old town' },
  { value: 'Lumbini', sub: 'Birthplace of the Buddha' },
  { value: 'Ghandruk', sub: 'Annapurna village homestays' },
  { value: 'Bandipur', sub: 'Hilltop Newar town' },
  { value: 'Namche Bazaar', sub: 'Everest region' },
];

type Tab = 'hotel' | 'homestay' | 'near';

export default function Hotels() {
  useContent();
  const params = useLocalSearchParams<{ kind?: StayKind }>();
  const { label } = useStayPrice();
  const { currency } = useCurrency();
  const today = new Date();
  const [tab, setTab] = useState<Tab>(params.kind === 'homestay' ? 'homestay' : 'hotel');
  const [where, setWhere] = useState('Pokhara');
  const [checkIn, setCheckIn] = useState<Date>(new Date(today.getTime() + 7 * 86400000));
  const [checkOut, setCheckOut] = useState<Date>(new Date(today.getTime() + 9 * 86400000));
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [sheet, setSheet] = useState<null | 'where' | 'guests'>(null);
  const [locating, setLocating] = useState(false);
  const [datePicker, openDate] = useDatePicker();

  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000));
  const kind: StayKind = tab === 'homestay' ? 'homestay' : 'hotel';
  const summary = `${where.toUpperCase()}\n${checkIn.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${checkOut.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} | ${rooms} ROOM, ${adults + children} GUESTS`;

  const nearMe = async () => {
    setLocating(true);
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== 'granted') return;
      const pos = await Location.getLastKnownPositionAsync() ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      const [place] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const near = CITIES.find((c) => [place?.city, place?.subregion, place?.district, place?.region].some((x) => x && x.toLowerCase().includes(c.value.toLowerCase())));
      setWhere(near?.value ?? 'Kathmandu');
    } catch {
      /* keep the current city */
    } finally {
      setLocating(false);
    }
  };

  const search = () => {
    addRecentSearch({ kind: 'stay', where, checkIn: isoDay(checkIn), checkOut: isoDay(checkOut), rooms, guests: adults + children });
    router.push({ pathname: '/stays', params: { where, kind, ci: isoDay(checkIn), co: isoDay(checkOut), a: String(adults), c: String(children), r: String(rooms) } });
  };

  const forYou = [...stays].filter((s) => s.kind === kind || tab === 'near').sort((a, b) => Number(!!b.partnerId) - Number(!!a.partnerId)).slice(0, 6);

  return (
    <ServicePage
      title="Hotels & Homestays"
      subtitle="Stays across Nepal"
      right={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.onSurface, paddingHorizontal: 6 }}>{currency}</Text>
          <Pressable onPress={() => router.navigate('/saved')} hitSlop={8} style={{ padding: 6 }} accessibilityRole="button" accessibilityLabel="Wishlist">
            <HeartIcon size={22} color={colors.primary} weight="duotone" />
          </Pressable>
        </View>
      }
      hero={{ images: ['/img/pokhara.jpg', '/img/bhaktapur.jpg', '/img/people.jpg', '/img/chitwan.jpg'], caption: tab === 'homestay' ? 'Stay with a Nepali family' : 'Stays with a view', sub: 'Lakeside · Heritage · Village homestays · Jungle lodges' }}
      tabs={<ModeTabs value={tab} onChange={(t) => { setTab(t); if (t === 'near') nearMe(); }} options={[{ value: 'hotel', label: 'Hotels' }, { value: 'homestay', label: 'Homestays' }, { value: 'near', label: 'Near me' }]} />}
      summary={summary}
      onSearch={search}
      form={
        <FormCard>
          <Box
            icon={MagnifyingGlassIcon}
            label="City, area or property"
            value={where}
            sub={CITIES.find((c) => c.value === where)?.sub ?? 'Nepal'}
            onPress={() => setSheet('where')}
            accent
            right={
              <Pressable onPress={nearMe} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#fff' }} accessibilityRole="button" accessibilityLabel="Use my location">
                <CrosshairIcon size={16} color={colors.onSurface} />
                <Text style={{ fontFamily: fonts.sansSemi, fontSize: 12.5, color: colors.onSurface }}>{locating ? '…' : 'Near Me'}</Text>
              </Pressable>
            }
          />
          <DateRangeBox
            start={checkIn}
            end={checkOut}
            badge={`${nights} NIGHT${nights > 1 ? 'S' : ''}`}
            onStart={() => openDate(checkIn, today, (d) => { setCheckIn(d); if (checkOut <= d) setCheckOut(new Date(d.getTime() + 86400000)); })}
            onEnd={() => openDate(checkOut, new Date(checkIn.getTime() + 86400000), setCheckOut)}
          />
          <Box label="Rooms & guests" value={`${rooms} Room, ${adults} Adult${adults > 1 ? 's' : ''}${children ? ` & ${children} Child${children > 1 ? 'ren' : ''}` : ''}`} onPress={() => setSheet('guests')} />
        </FormCard>
      }
    >
      <SectionTitle>Explore collections</SectionTitle>
      <TileGrid
        items={[
          { label: 'Lake-view stays', img: '/img/pokhara.jpg', onPress: () => router.push({ pathname: '/stays', params: { where: 'Pokhara' } }) },
          { label: 'Heritage hotels', img: '/img/kathmandu.jpg', onPress: () => router.push({ pathname: '/stays', params: { where: 'Kathmandu' } }) },
          { label: 'Village homestays', img: '/img/people.jpg', onPress: () => router.push({ pathname: '/stays', params: { kind: 'homestay' } }) },
          { label: 'Jungle lodges', img: '/img/chitwan.jpg', onPress: () => router.push({ pathname: '/stays', params: { where: 'Chitwan' } }) },
          { label: 'Mountain-view lodges', img: '/img/annapurna.jpg', onPress: () => router.push({ pathname: '/stays', params: { where: 'Ghandruk' } }) },
          { label: 'Old-town stays', img: '/img/bhaktapur.jpg', onPress: () => router.push({ pathname: '/stays', params: { where: 'Bhaktapur' } }) },
        ]}
      />

      <SectionTitle>Popular cities</SectionTitle>
      <Bubbles
        items={[
          { label: 'Pokhara', img: '/img/pokhara.jpg', onPress: () => setWhere('Pokhara') },
          { label: 'Kathmandu', img: '/img/kathmandu.jpg', onPress: () => setWhere('Kathmandu') },
          { label: 'Chitwan', img: '/img/chitwan.jpg', onPress: () => setWhere('Chitwan') },
          { label: 'Bhaktapur', img: '/img/bhaktapur.jpg', onPress: () => setWhere('Bhaktapur') },
          { label: 'Lumbini', img: '/img/lumbini.jpg', onPress: () => setWhere('Lumbini') },
          { label: 'Nagarkot', img: '/img/poonhill.jpg', onPress: () => setWhere('Nagarkot') },
        ]}
      />

      {forYou.length ? (
        <>
          <SectionTitle action="View All" onAction={() => router.push({ pathname: '/stays', params: { kind } })}>Stays for you</SectionTitle>
          <HRow gap={12}>
            {forYou.map((s) => {
              const p = label(s);
              return (
                <Pressable key={s.slug} onPress={() => router.push(`/stays/${s.slug}`)} style={{ width: 230, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden' }} accessibilityRole="button" accessibilityLabel={s.name}>
                  <Image source={img(s.images[0])} style={{ width: 230, height: 140 }} contentFit="cover" />
                  <View style={{ padding: 12, gap: 3 }}>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.onSurface }} numberOfLines={1}>{s.name}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant }}>{s.city}{s.partnerId ? ' · Verified partner' : s.isSample ? ' · Sample' : ''}</Text>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.onSurface, marginTop: 4 }}>{p ? `${p} / night` : 'Price on request'}</Text>
                  </View>
                </Pressable>
              );
            })}
          </HRow>
        </>
      ) : null}

      <SectionTitle>Offers</SectionTitle>
      <OfferCards
        items={[
          { tag: 'STAYS', title: 'Pay at the property', text: 'Reserve partner hotels now and pay when you arrive.', img: '/img/pokhara.jpg', cta: 'Explore', onPress: () => router.push({ pathname: '/stays', params: { kind: 'hotel' } }) },
          { tag: 'HOMESTAYS', title: 'Live with a Gurung family', text: 'Home-cooked dal bhat and Annapurna views in Ghandruk.', img: '/img/people.jpg', cta: 'Book now', onPress: () => router.push({ pathname: '/stays', params: { kind: 'homestay' } }) },
        ]}
      />

      <TrustStrip big="10%" text="is all our verified partners pay — so their best prices stay on Mountain Planet" />

      <SectionTitle>FAQs</SectionTitle>
      <Faqs
        items={[
          { q: 'Can I pay at the hotel?', a: 'Yes. Verified partner stays let you choose Pay at property or Pay in app when you book.' },
          { q: 'How quickly is a booking confirmed?', a: 'The property answers within 2 hours. You see the answer in My Trips.' },
          { q: 'What is a homestay?', a: 'You stay in a family home, eat local food and join daily village life — a favourite on the Annapurna and Langtang trails.' },
        ]}
      />

      <ChoiceSheet visible={sheet === 'where'} title="Where do you want to stay?" value={where} options={CITIES} allowCustom customPlaceholder="Search city, area or property" onPick={setWhere} onClose={() => setSheet(null)} />
      <Sheet visible={sheet === 'guests'} title="Rooms & guests" onClose={() => setSheet(null)}>
        <Stepper label="Rooms" value={rooms} onChange={setRooms} min={1} max={10} />
        <Stepper label="Adults" value={adults} onChange={setAdults} min={1} max={30} />
        <Stepper label="Children" hint="Under 12" value={children} onChange={setChildren} max={10} />
      </Sheet>
      {datePicker}
    </ServicePage>
  );
}
