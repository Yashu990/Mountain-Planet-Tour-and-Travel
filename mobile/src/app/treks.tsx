// Treks & Tours search — travel-app holiday-package layout: starting from, trek region, month,
// travellers, duration / difficulty chips, SEARCH, then trending regions, best sellers (numbered),
// trip styles, short trips, trust, FAQs and "Customise my trip".
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius } from '@/theme';
import { Stepper } from '@/components/form';
import { useContent } from '@/lib/content';
import { useCurrency } from '@/lib/currency';
import { img } from '@/lib/images';
import { tours } from '@/data/tours';
import {
  Box,
  Bubbles,
  ChoiceSheet,
  Faqs,
  FormCard,
  G,
  HRow,
  OptionChips,
  SectionTitle,
  ServicePage,
  Sheet,
  TileGrid,
  TopList,
  TrustStrip,
} from '@/components/service';
import { ChatCircleDotsIcon, MapPinIcon } from '@/components/icons';

const REGIONS = [
  { value: 'Anywhere in Nepal', sub: 'Show every trek and tour', q: '' },
  { value: 'Everest', sub: 'Base Camp, Gokyo, Three Passes', q: 'everest' },
  { value: 'Annapurna', sub: 'Base Camp, Circuit, Poon Hill', q: 'annapurna' },
  { value: 'Langtang', sub: 'Closest big trek to Kathmandu', q: 'langtang' },
  { value: 'Manaslu', sub: 'Permit-only circuit', q: 'manaslu' },
  { value: 'Mustang', sub: 'The walled kingdom of Lo', q: 'mustang' },
  { value: 'Chitwan', sub: 'Jungle safari', q: 'chitwan' },
  { value: 'Kathmandu Valley', sub: 'Heritage & culture', q: 'kathmandu' },
  { value: 'Pokhara', sub: 'Lakes, paragliding', q: 'pokhara' },
];
const FROM = ['Kathmandu', 'Pokhara'];
const MONTHS = (() => {
  const out: string[] = ['Flexible'];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
    out.push(m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }));
  }
  return out;
})();
type Dur = 'any' | 'short' | 'mid' | 'long';
type Diff = 'any' | 'Easy' | 'Moderate' | 'Challenging';

export default function Treks() {
  const { version } = useContent();
  const { price } = useCurrency();
  const [from, setFrom] = useState(FROM[0]);
  const [region, setRegion] = useState(REGIONS[0].value);
  const [month, setMonth] = useState(MONTHS[0]);
  const [adults, setAdults] = useState(2);
  const [dur, setDur] = useState<Dur>('any');
  const [diff, setDiff] = useState<Diff>('any');
  const [sheet, setSheet] = useState<null | 'from' | 'region' | 'month' | 'pax'>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays update in place; `version` signals the change
  const best = useMemo(() => [...tours].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews).slice(0, 8), [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const short = useMemo(() => tours.filter((t) => t.days <= 5).slice(0, 6), [version]);

  const r = REGIONS.find((x) => x.value === region)!;
  const summary = `${from.toUpperCase()} – ${region.toUpperCase()}\n${month.toUpperCase()} | ${adults} ADULTS`;
  const search = () =>
    router.navigate({ pathname: '/explore', params: { q: r.q, days: dur === 'short' ? 'u5' : dur === 'mid' ? '6-12' : dur === 'long' ? '13p' : '', level: diff === 'any' ? '' : diff } });

  return (
    <ServicePage
      title="Treks & Tours"
      subtitle="Nepal and the Himalayas"
      summary={summary}
      onSearch={search}
      searchLabel="SEARCH"
      form={
        <FormCard>
          <Box icon={MapPinIcon} label="Starting from" value={from} onPress={() => setSheet('from')} />
          <Box icon={MapPinIcon} label="Trek region / destination" value={region} sub={r.sub} onPress={() => setSheet('region')} accent />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Box style={{ flex: 1 }} label="Starting month" value={month === 'Flexible' ? 'Flexible' : month.split(' ')[0]} sub={month === 'Flexible' ? 'Any month' : month.split(' ')[1]} onPress={() => setSheet('month')} />
            <Box style={{ flex: 1 }} label="Travellers" value={`${adults} Adult${adults > 1 ? 's' : ''}`} sub="Private or group" onPress={() => setSheet('pax')} />
          </View>
          <OptionChips
            label="Choose filters (optional)"
            value={dur}
            onChange={setDur}
            options={[
              { value: 'any', label: 'Any duration' },
              { value: 'short', label: 'Up to 5 days' },
              { value: 'mid', label: '6–12 days' },
              { value: 'long', label: '13+ days' },
            ]}
          />
          <OptionChips value={diff} onChange={setDiff} options={[{ value: 'any', label: 'Any level' }, { value: 'Easy', label: 'Easy' }, { value: 'Moderate', label: 'Moderate' }, { value: 'Challenging', label: 'Challenging' }]} />
        </FormCard>
      }
    >
      <SectionTitle sub="The trails everyone is booking">Trending regions</SectionTitle>
      <Bubbles
        items={[
          { label: 'Everest', img: '/img/ebc.jpg', onPress: () => setRegion('Everest') },
          { label: 'Annapurna', img: '/img/annapurna.jpg', onPress: () => setRegion('Annapurna') },
          { label: 'Langtang', img: '/img/langtang.jpg', onPress: () => setRegion('Langtang') },
          { label: 'Manaslu', img: '/img/manaslu.jpg', onPress: () => setRegion('Manaslu') },
          { label: 'Mustang', img: '/img/mustang.jpg', onPress: () => setRegion('Mustang') },
          { label: 'Chitwan', img: '/img/chitwan.jpg', onPress: () => setRegion('Chitwan') },
        ]}
      />

      <SectionTitle sub="Our most-loved journeys">Best sellers</SectionTitle>
      <TopList items={best.map((t) => ({ place: t.region, title: t.title, price: `${t.days} days · from ${price(t.price)}`, img: t.img, onPress: () => router.push(`/tour/${t.slug}`) }))} />

      <SectionTitle>Trip styles</SectionTitle>
      <TileGrid
        items={[
          { label: 'Trekking', img: '/img/ebc.jpg', onPress: () => router.navigate({ pathname: '/explore', params: { cat: 'Trekking' } }) },
          { label: 'Peak climbing', img: '/img/climb.jpg', onPress: () => router.navigate({ pathname: '/explore', params: { cat: 'Peak Climbing' } }) },
          { label: 'Culture', img: '/img/kathmandu.jpg', onPress: () => router.navigate({ pathname: '/explore', params: { cat: 'Culture' } }) },
          { label: 'Wildlife', img: '/img/chitwan.jpg', onPress: () => router.navigate({ pathname: '/explore', params: { cat: 'Wildlife' } }) },
          { label: 'Adventure', img: '/img/paragliding.jpg', onPress: () => router.navigate({ pathname: '/explore', params: { cat: 'Adventure' } }) },
          { label: 'Heli tours', img: '/img/heli.jpg', onPress: () => router.navigate({ pathname: '/explore', params: { cat: 'Heli Tours' } }) },
        ]}
      />

      {short.length ? (
        <>
          <SectionTitle sub="Five days or less">Short on time?</SectionTitle>
          <HRow gap={12}>
            {short.map((t) => (
              <Pressable key={t.slug} onPress={() => router.push(`/tour/${t.slug}`)} style={styles.short} accessibilityRole="button" accessibilityLabel={t.title}>
                <Image source={img(t.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(7,13,24,0.85)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
                <View style={{ padding: 12 }}>
                  <Text style={styles.shortTitle} numberOfLines={2}>{t.title}</Text>
                  <Text style={styles.shortSub}>{t.days} day{t.days > 1 ? 's' : ''} · from {price(t.price)}</Text>
                </View>
              </Pressable>
            ))}
          </HRow>
        </>
      ) : null}

      <View style={{ paddingHorizontal: G, marginTop: 26 }}>
        <Pressable onPress={() => router.push('/plan')} style={styles.custom} accessibilityRole="button" accessibilityLabel="Customise my trip">
          <ChatCircleDotsIcon size={26} color="#fff" weight="fill" />
          <View style={{ flex: 1 }}>
            <Text style={styles.customTitle}>Customise my trip</Text>
            <Text style={styles.customSub}>Tell us your days and budget — we build it for you, free</Text>
          </View>
        </Pressable>
      </View>

      <TrustStrip big="25+" text="years guiding treks with licensed, first-aid trained guides" />

      <SectionTitle>FAQs</SectionTitle>
      <Faqs
        items={[
          { q: 'What is included in a trek?', a: 'Guide, porters, teahouse rooms, three meals a day on the trail, permits and airport transfers. Flights to Lukla are added where needed.' },
          { q: 'When is the best time to trek?', a: 'Spring (March–May) and autumn (late September–November) have the clearest weather. Lower treks like Poon Hill also work in winter.' },
          { q: 'Can I change the itinerary?', a: 'Yes — every trip can be customised for pace, comfort and budget. Tap “Customise my trip”.' },
        ]}
      />

      <ChoiceSheet visible={sheet === 'from'} title="Starting from" value={from} options={FROM} onPick={setFrom} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'region'} title="Where do you want to go?" value={region} options={REGIONS.map((x) => ({ value: x.value, sub: x.sub }))} onPick={setRegion} onClose={() => setSheet(null)} />
      <ChoiceSheet visible={sheet === 'month'} title="When do you want to start?" value={month} options={MONTHS} onPick={setMonth} onClose={() => setSheet(null)} />
      <Sheet visible={sheet === 'pax'} title="Travellers" onClose={() => setSheet(null)}>
        <Stepper label="Adults" value={adults} onChange={setAdults} min={1} max={30} />
      </Sheet>
    </ServicePage>
  );
}

const styles = StyleSheet.create({
  short: { width: 200, height: 150, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end' },
  shortTitle: { fontFamily: fonts.sansBold, fontSize: 14.5, lineHeight: 18, color: '#fff' },
  shortSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  custom: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.secondary, borderRadius: radius.lg, padding: 16 },
  customTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: '#fff' },
  customSub: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
});
