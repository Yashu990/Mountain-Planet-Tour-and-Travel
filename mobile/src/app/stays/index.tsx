import { useI18n } from '@/lib/i18n';
import { MAX_CONTENT_WIDTH } from '@/lib/layout';
import { useStayPrice } from '@/lib/stayPrice';
import { addRecentSearch } from '@/lib/recent';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, space, squircle, type } from '@/theme';
import { stays, type Stay, type StayKind } from '@/data/stays';
import { useContent } from '@/lib/content';
import { img } from '@/lib/images';
import { BadgePill, Card, CardGrid, Gutter, Kicker, PrimaryButton, Screen, SoftButton, Tap } from '@/components/ui';
import { SelectField, Stepper } from '@/components/form';
import { DateField, isoDay } from '@/components/DateField';
import { FilterBar, FilterSheet, QuickChip, SortSheet, countActive, type FilterGroup, type FilterValues } from '@/components/filters';
import { BackHeader } from '@/components/BackHeader';
import { BedIcon, CalendarBlankIcon, CheckIcon, MagnifyingGlassIcon, StarIcon, UsersIcon, XIcon } from '@/components/icons';

const SORTS = [
  { value: 'best', label: 'Best match' },
  { value: 'price', label: 'Lowest price first' },
  { value: 'rating', label: 'Top reviewed' },
  { value: 'space', label: 'Most space' },
];
const PRICE: Record<string, [number, number]> = { u50: [0, 50], '50-100': [50, 100], '100-200': [100, 200], '200p': [200, Infinity] };
const short = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export interface StaySearch {
  where: string; // '' = anywhere
  checkIn: Date | null;
  checkOut: Date | null;
  adults: number;
  children: number;
  rooms: number;
}

/** Apply search + filters (shared by the list and the live "Show N" count). */
type UsdOf = (s: Stay) => number | null;

function apply(list: Stay[], s: StaySearch, f: FilterValues, usdOf: UsdOf) {
  const guests = s.adults + s.children;
  const has = (k: string) => (f[k] ?? []).length > 0;
  return list.filter((x) => {
    if (s.where && x.city !== s.where) return false;
    if (x.maxGuests * Math.max(1, s.rooms) < guests) return false;
    if (has('type') && !f.type.includes(x.kind)) return false;
    if (has('city') && !f.city.includes(x.city)) return false;
    if (has('price')) {
      const p = usdOf(x);
      if (p === null) return false;
      const [lo, hi] = PRICE[f.price[0]];
      if (p < lo || p >= hi) return false;
    }
    if (has('stars') && (x.starRating === null || !f.stars.includes(String(x.starRating)))) return false;
    if (has('review') && (x.rating === null || x.rating < Number(f.review[0]))) return false;
    if ((f.deals ?? []).includes('free') && !x.freeCancellation) return false;
    if ((f.deals ?? []).includes('breakfast') && !x.breakfastIncluded) return false;
    if (has('rooms') && x.bedrooms < Number(f.rooms[0])) return false;
    if (has('facilities') && !f.facilities.every((a) => x.amenities.includes(a))) return false;
    return true;
  });
}

function sortList(list: Stay[], by: string, usdOf: UsdOf) {
  const r = [...list];
  const nullsLast = (a: number | null, b: number | null, dir: 1 | -1) => (a === null ? 1 : b === null ? -1 : (a - b) * dir);
  if (by === 'price') r.sort((a, b) => nullsLast(usdOf(a), usdOf(b), 1));
  if (by === 'rating') r.sort((a, b) => nullsLast(a.rating, b.rating, -1));
  if (by === 'space') r.sort((a, b) => b.maxGuests - a.maxGuests);
  return r;
}

/** Agoda-style result card: photo, name, stars, place, badges, price. */
function ResultCard({ stay, search }: { stay: Stay; search: StaySearch }) {
  const { label } = useStayPrice();
  const nightly = label(stay);
  const nights = search.checkIn && search.checkOut ? Math.round((search.checkOut.getTime() - search.checkIn.getTime()) / 86400000) : 0;
  const open = () =>
    router.push({
      pathname: '/stays/[slug]',
      params: {
        slug: stay.slug,
        ...(search.checkIn ? { ci: isoDay(search.checkIn) } : {}),
        ...(search.checkOut ? { co: isoDay(search.checkOut) } : {}),
        a: String(search.adults),
        c: String(search.children),
      },
    });
  return (
    <Tap onPress={open} style={styles.card} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={stay.name}>
      <View style={{ height: 190 }}>
        <Image source={img(stay.images[0])} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel={stay.name} />
        <View style={{ position: 'absolute', left: 12, top: 12, flexDirection: 'row', gap: 6 }}>
          {stay.isSample ? <BadgePill label="Sample" /> : null}
          {stay.partnerId ? <BadgePill label="Verified partner" style={{ backgroundColor: colors.secondary }} /> : null}
        </View>
        <View style={styles.count}>
          <Text style={[type.labelSm, { color: '#fff' }]}>1/{stay.images.length}</Text>
        </View>
      </View>
      <View style={{ padding: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Kicker>{stay.kind === 'homestay' ? 'Homestay' : 'Hotel'}</Kicker>
          {stay.starRating ? (
            <View style={{ flexDirection: 'row', gap: 1 }}>
              {Array.from({ length: stay.starRating }, (_, i) => <StarIcon key={i} size={11} color={colors.primary} weight="fill" />)}
            </View>
          ) : null}
        </View>
        <Text style={type.headlineMd} numberOfLines={2}>{stay.name}</Text>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
          {stay.partnerId
            ? `${stay.city} · up to ${stay.maxGuests} guests per room`
            : `${stay.city} · up to ${stay.maxGuests} guests · ${stay.bedrooms} ${stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`}
        </Text>
        {stay.rating !== null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.score}><Text style={[type.labelSm, { color: '#fff' }]}>{stay.rating.toFixed(1)}</Text></View>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{stay.reviews} reviews</Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 }}>
          {stay.breakfastIncluded ? <Perk label="Breakfast included" /> : null}
          {stay.freeCancellation ? <Perk label="Free cancellation" /> : null}
          <Perk label="No payment now" />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end', marginTop: 6 }}>
          {nightly !== null ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[type.headlineLg, { color: colors.primary }]}>
                {stay.partnerId ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>from </Text> : null}
                {nightly}
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}> /night</Text>
              </Text>
              {nights > 0 ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>{label(stay, nights * Math.max(1, search.rooms))} for {nights} {nights === 1 ? 'night' : 'nights'} · taxes extra</Text> : null}
            </View>
          ) : (
            <Text style={[type.headlineSm, { color: colors.onSurfaceVariant }]}>Price on request</Text>
          )}
        </View>
      </View>
    </Tap>
  );
}

const Perk = ({ label }: { label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
    <CheckIcon size={13} color={colors.secondary} weight="bold" />
    <Text style={[type.bodySm, { color: colors.secondary, fontFamily: fonts.sansMedium, fontSize: 13 }]}>{label}</Text>
  </View>
);

/** Agoda-style search: destination, dates, rooms & guests. */
function SearchSheet({ visible, onClose, value, onApply, cities }: { visible: boolean; onClose: () => void; value: StaySearch; onApply: (s: StaySearch) => void; cities: string[] }) {
  const insets = useSafeAreaInsets();
  const [d, setD] = useState(value);
  const [synced, setSynced] = useState<StaySearch | null>(null);
  if (visible && synced !== value) {
    setSynced(value);
    setD(value);
  }
  if (!visible && synced !== null) setSynced(null);
  const today = new Date();
  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(45,43,38,0.35)' }} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: space.gutter, gap: space.lg, paddingBottom: space.md }} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[type.headlineLg, { flex: 1 }]}>Search stays</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="Close"><XIcon size={18} color={colors.onSurface} weight="bold" /></Pressable>
          </View>
          <SelectField label="Destination" value={d.where || 'Anywhere in Nepal'} options={['Anywhere in Nepal', ...cities]} onChange={(v) => setD({ ...d, where: v === 'Anywhere in Nepal' ? '' : v })} icon={MagnifyingGlassIcon} />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <DateField label="Check-in" value={d.checkIn} onChange={(v) => setD({ ...d, checkIn: v, checkOut: d.checkOut && d.checkOut <= v ? null : d.checkOut })} minimumDate={today} placeholder="Add date" />
            <DateField label="Check-out" value={d.checkOut} onChange={(v) => setD({ ...d, checkOut: v })} minimumDate={d.checkIn ? new Date(d.checkIn.getTime() + 86400000) : today} placeholder="Add date" />
          </View>
          <View>
            <Kicker>Rooms & guests</Kicker>
            <Stepper label="Rooms" value={d.rooms} onChange={(n) => setD({ ...d, rooms: n })} min={1} max={10} />
            <Stepper label="Adults" value={d.adults} onChange={(n) => setD({ ...d, adults: n })} min={1} max={30} />
            <Stepper label="Children" hint="Under 12" value={d.children} onChange={(n) => setD({ ...d, children: n })} max={10} />
          </View>
          <PrimaryButton label="Search" icon={MagnifyingGlassIcon} onPress={() => { onApply(d); onClose(); }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function Stays() {
  const { version } = useContent();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ kind?: StayKind; where?: string }>();
  const [search, setSearch] = useState<StaySearch>({ where: params.where ?? '', checkIn: null, checkOut: null, adults: 2, children: 0, rooms: 1 });
  const [filters, setFilters] = useState<FilterValues>(params.kind ? { type: [params.kind] } : {});
  const [sort, setSort] = useState('best');
  const [sheet, setSheet] = useState<null | 'search' | 'filters' | 'sort'>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  const all = useMemo(() => [...stays], [version]);
  const cities = useMemo(() => Array.from(new Set(all.map((s) => s.city))), [all]);
  const amenities = useMemo(() => Array.from(new Set(all.flatMap((s) => s.amenities))).sort(), [all]);
  const { usd } = useStayPrice();
  const results = useMemo(() => sortList(apply(all, search, filters, usd), sort, usd), [all, search, filters, sort, usd]);

  const groups: FilterGroup[] = [
    { key: 'type', title: 'Property type', mode: 'multi', options: [{ value: 'hotel', label: 'Hotel' }, { value: 'homestay', label: 'Homestay' }] },
    { key: 'price', title: 'Price per night', mode: 'single', options: [{ value: 'u50', label: 'Under $50' }, { value: '50-100', label: '$50 – $100' }, { value: '100-200', label: '$100 – $200' }, { value: '200p', label: '$200+' }] },
    { key: 'deals', title: 'Booking options', mode: 'multi', options: [{ value: 'free', label: 'Free cancellation' }, { value: 'breakfast', label: 'Breakfast included' }] },
    { key: 'stars', title: 'Star rating', mode: 'multi', options: ['5', '4', '3', '2'].map((s) => ({ value: s, label: `${s} stars` })) },
    { key: 'review', title: 'Guest rating', mode: 'single', options: [{ value: '4.5', label: '4.5+ Exceptional' }, { value: '4', label: '4+ Excellent' }, { value: '3.5', label: '3.5+ Very good' }] },
    { key: 'city', title: 'Location', mode: 'multi', options: cities.map((c) => ({ value: c, label: c })) },
    { key: 'rooms', title: 'Bedrooms', mode: 'single', options: [{ value: '1', label: '1+' }, { value: '2', label: '2+' }, { value: '3', label: '3+' }] },
    { key: 'facilities', title: 'Facilities', mode: 'multi', options: amenities.map((a) => ({ value: a, label: a })) },
  ];

  const toggleQuick = (key: string, v: string) =>
    setFilters((f) => {
      const cur = f[key] ?? [];
      return { ...f, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] };
    });
  const on = (key: string, v: string) => (filters[key] ?? []).includes(v);
  const guests = search.adults + search.children;
  const when = search.checkIn && search.checkOut ? `${short(search.checkIn)} – ${short(search.checkOut)}` : 'Any dates';
  const anySample = results.some((s) => s.isSample);

  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.sm }}>
        <Kicker>Hotels & homestays</Kicker>
        <Text style={[type.displayMd, { marginTop: 6 }]}>{t('stays.title')}</Text>
        {/* search summary (tap to edit) */}
        <Pressable onPress={() => setSheet('search')} style={styles.summary} accessibilityRole="search" accessibilityLabel="Edit search">
          <MagnifyingGlassIcon size={20} color={colors.onSurfaceVariant} />
          <View style={{ flex: 1 }}>
            <Text style={[type.labelMd, { fontFamily: fonts.sansSemi }]} numberOfLines={1}>{search.where || t('stays.anywhere')}</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}><CalendarBlankIcon size={12} color={colors.onSurfaceVariant} /> {when}</Text>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}><UsersIcon size={12} color={colors.onSurfaceVariant} /> {search.rooms} {search.rooms === 1 ? 'room' : 'rooms'} · {guests} {guests === 1 ? 'guest' : 'guests'}</Text>
            </View>
          </View>
          <Text style={[type.labelMd, { color: colors.primary, fontFamily: fonts.sansSemi }]}>Edit</Text>
        </Pressable>
      </Gutter>

      <View style={{ marginTop: space.md }}>
        <FilterBar active={countActive(filters)} onOpenFilters={() => setSheet('filters')} sortLabel={SORTS.find((s) => s.value === sort)!.label} onOpenSort={() => setSheet('sort')}>
          <QuickChip label="Map view" on={false} onPress={() => router.push({ pathname: '/map', params: { layer: 'stays' } })} />
          <QuickChip label="Homestays" on={on('type', 'homestay')} onPress={() => toggleQuick('type', 'homestay')} />
          <QuickChip label="Breakfast included" on={on('deals', 'breakfast')} onPress={() => toggleQuick('deals', 'breakfast')} />
          <QuickChip label="Free cancellation" on={on('deals', 'free')} onPress={() => toggleQuick('deals', 'free')} />
        </FilterBar>
      </View>

      <Gutter style={{ marginTop: space.md }}>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
          {results.length} {results.length === 1 ? 'property' : 'properties'}{search.where ? ` in ${search.where}` : ''}
          {anySample ? ' · “Sample” = example of what we arrange' : ''}
        </Text>
      </Gutter>

      {results.length === 0 ? (
        <Gutter style={{ marginTop: space.lg }}>
          <Card style={{ alignItems: 'center', paddingVertical: space.xxl, gap: 8 }}>
            <BedIcon size={40} color={colors.onSurfaceVariant} weight="duotone" />
            <Text style={[type.headlineMd, { marginTop: space.sm }]}>No stays match</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Try fewer filters — or tell us what you need and we’ll find it.</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: space.md }}>
              <SoftButton label="Clear filters" onPress={() => setFilters({})} />
            </View>
          </Card>
        </Gutter>
      ) : (
        <CardGrid style={{ marginTop: space.md }}>
          {results.map((s) => <ResultCard key={s.slug} stay={s} search={search} />)}
        </CardGrid>
      )}

      <Gutter style={{ marginTop: space.section }}>
        <Card style={{ gap: 12, alignItems: 'flex-start' }}>
          <Text style={type.headlineMd}>Can’t find what you need?</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>Tell us the place, dates and comfort level, and we’ll send you options.</Text>
          <SoftButton
            label="Request a stay"
            icon={BedIcon}
            onPress={() =>
              router.push({
                pathname: '/book/stay',
                params: {
                  ...(on('type', 'homestay') && !on('type', 'hotel') ? { kind: 'homestay' } : {}),
                  ...(search.where ? { where: search.where } : {}),
                  ...(search.checkIn ? { ci: isoDay(search.checkIn) } : {}),
                  ...(search.checkOut ? { co: isoDay(search.checkOut) } : {}),
                  a: String(search.adults),
                  c: String(search.children),
                },
              })
            }
          />
        </Card>
      </Gutter>

      <SearchSheet visible={sheet === 'search'} onClose={() => setSheet(null)} value={search} onApply={(v) => { setSearch(v); addRecentSearch({ kind: 'stay', where: v.where, checkIn: v.checkIn ? isoDay(v.checkIn) : null, checkOut: v.checkOut ? isoDay(v.checkOut) : null, rooms: v.rooms, guests: v.adults + v.children }); }} cities={cities} />
      <FilterSheet visible={sheet === 'filters'} onClose={() => setSheet(null)} groups={groups} value={filters} onApply={setFilters} countFor={(f) => apply(all, search, f, usd).length} noun="properties" />
      <SortSheet visible={sheet === 'sort'} onClose={() => setSheet(null)} options={SORTS} value={sort} onChange={setSort} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { marginTop: space.md, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 12, ...squircle },
  card: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle, ...shadow.hairline },
  count: { position: 'absolute', right: 12, bottom: 12, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  score: { backgroundColor: colors.secondary, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  sheet: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderCurve: 'continuous', paddingTop: 10, maxHeight: '92%', ...shadow.sheet },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 },
  close: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
