// Home — travel-app layout (modelled on large OTA apps), styled with degine.md tokens:
// top bar · pinned AI search · 4 big tiles · more-services card · recent searches · trek regions ·
// stay collections · "for your stay" hotels · what's new · hosting banner · where-to-go grid.
import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, fonts, radius, squircle } from '@/theme';
import { useContent } from '@/lib/content';
import { useCurrency } from '@/lib/currency';
import { useStayPrice } from '@/lib/stayPrice';
import { useLayoutWidth } from '@/lib/layout';
import { useRecentSearches } from '@/lib/recent';
import { brand, img } from '@/lib/images';
import { tours } from '@/data/tours';
import { destinations, slug as destSlug } from '@/data/destinations';
import { stays, type Stay } from '@/data/stays';
import { Screen, Tap } from '@/components/ui';
import { AskAIButton } from '@/components/AskAIButton';
import {
  AirplaneTiltIcon,
  BedIcon,
  BookOpenTextIcon,
  CaretDownIcon,
  CaretRightIcon,
  CaretUpIcon,
  CarIcon,
  CompassIcon,
  FirstAidIcon,
  GlobeHemisphereEastIcon,
  HeartIcon,
  HouseLineIcon,
  InfoIcon,
  ListIcon,
  MapPinIcon,
  MicrophoneIcon,
  MountainsIcon,
  SparkleIcon,
  StarIcon,
  StorefrontIcon,
  SuitcaseRollingIcon,
  SunIcon,
  TaxiIcon,
  TicketIcon,
  TreeIcon,
  type Icon,
} from '@/components/icons';

const CARD = '#FFFFFF';
const PAGE = colors.surfaceAlt;
const G = 16;

type Service = { icon: Icon; label: string; go: () => void };
const primary: (Service & { tint: string; color: string })[] = [
  { icon: BedIcon, label: 'Hotels', go: () => router.push({ pathname: '/hotels', params: { kind: 'hotel' } }), tint: 'rgba(217,90,64,0.12)', color: colors.primary },
  { icon: MountainsIcon, label: 'Treks &\nTours', go: () => router.push('/treks'), tint: 'rgba(90,107,65,0.14)', color: colors.secondary },
  { icon: AirplaneTiltIcon, label: 'Flights', go: () => router.push('/book/flight'), tint: 'rgba(62,107,154,0.13)', color: '#3E6B9A' },
  { icon: TaxiIcon, label: 'Cabs', go: () => router.push('/book/cab'), tint: 'rgba(169,116,28,0.15)', color: '#A9741C' },
];
const secondary: Service[] = [
  { icon: HouseLineIcon, label: 'Homestays\n& Villages', go: () => router.push({ pathname: '/hotels', params: { kind: 'homestay' } }) },
  { icon: TicketIcon, label: 'Activities\n& Tickets', go: () => router.push('/book/ticket') },
  { icon: CarIcon, label: 'Airport\nPickup', go: () => router.push('/book/cab') },
  { icon: SunIcon, label: 'Trek Tools\n& Weather', go: () => router.push('/tools') },
  { icon: MapPinIcon, label: 'Map', go: () => router.push('/map') },
  { icon: CompassIcon, label: 'Plan a\nTrip', go: () => router.push('/plan') },
  { icon: GlobeHemisphereEastIcon, label: 'Destinations', go: () => router.push('/destinations') },
  { icon: BookOpenTextIcon, label: 'Traveller\nStories', go: () => router.push('/stories') },
  { icon: SuitcaseRollingIcon, label: 'My Trip\nHub', go: () => router.push('/trip') },
  { icon: FirstAidIcon, label: 'Emergency\nHelp', go: () => router.push('/tools') },
  { icon: StorefrontIcon, label: 'Partner\nwith Us', go: () => router.push('/partner') },
  { icon: InfoIcon, label: 'About\nUs', go: () => router.push('/about') },
];

const regions = [
  { name: 'Everest', img: '/img/ebc.jpg', q: 'everest' },
  { name: 'Annapurna', img: '/img/annapurna.jpg', q: 'annapurna' },
  { name: 'Langtang', img: '/img/langtang.jpg', q: 'langtang' },
  { name: 'Manaslu', img: '/img/manaslu.jpg', q: 'manaslu' },
  { name: 'Mustang', img: '/img/mustang.jpg', q: 'mustang' },
  { name: 'Gokyo', img: '/img/gokyo.jpg', q: 'gokyo' },
];

const collections: { title: string; img: string; icon: Icon; go: () => void }[] = [
  { title: 'Lakeside Pokhara', img: '/img/pokhara.jpg', icon: BedIcon, go: () => router.push({ pathname: '/stays', params: { where: 'Pokhara' } }) },
  { title: 'Kathmandu Heritage', img: '/img/kathmandu.jpg', icon: BedIcon, go: () => router.push({ pathname: '/stays', params: { where: 'Kathmandu' } }) },
  { title: 'Village Homestays', img: '/img/people.jpg', icon: HouseLineIcon, go: () => router.push({ pathname: '/stays', params: { kind: 'homestay' } }) },
  { title: 'Jungle Lodges', img: '/img/chitwan.jpg', icon: TreeIcon, go: () => router.push({ pathname: '/stays', params: { where: 'Chitwan' } }) },
];

const whatsNew: { label: string; img: string; go: () => void }[] = [
  { label: 'AI Trip\nPlanner', img: '/img/hero.jpg', go: () => router.push('/ai') },
  { label: 'Live Mountain\nWeather', img: '/img/amadablam.jpg', go: () => router.push('/tools') },
  { label: 'Pay at the\nProperty', img: '/img/pokhara.jpg', go: () => router.push('/stays') },
  { label: 'Trek Route\nMaps', img: '/img/bridge.jpg', go: () => router.push('/map') },
  { label: 'Traveller\nStories', img: '/img/people.jpg', go: () => router.push('/stories') },
  { label: 'Heli\nTours', img: '/img/heli.jpg', go: () => router.push({ pathname: '/explore', params: { cat: 'Heli Tours' } }) },
];

const day = (s: string | null) => (s ? new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

function Title({ children, action, onAction }: { children: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.titleRow}>
      <Text style={styles.title}>{children}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} style={styles.viewAll} accessibilityRole="button">
          <Text style={styles.viewAllText}>{action}</Text>
          <View style={styles.viewAllDot}><CaretRightIcon size={10} color="#fff" weight="bold" /></View>
        </Pressable>
      ) : null}
    </View>
  );
}

function HScroll({ children, gap = 10 }: { children: ReactNode; gap?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: G, gap }}>
      {children}
    </ScrollView>
  );
}

export default function Home() {
  const { version } = useContent();
  const width = useLayoutWidth();
  const { currency } = useCurrency();
  const { label } = useStayPrice();
  const recent = useRecentSearches();
  const [showAll, setShowAll] = useState(false);

  const archW = Math.floor((width - G * 2 - 8 * 3) / 4);
  const halfW = Math.floor((width - G * 2 - 10) / 2);
  const hotelW = Math.round(width * 0.62);

  // content arrays update in place; `version` signals the change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const city = useMemo(() => stays.find((s) => s.partnerId)?.city ?? 'Pokhara', [version]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const forStay = useMemo(() => [...stays].sort((a, b) => Number(!!b.partnerId) - Number(!!a.partnerId)).slice(0, 6), [version]);
  const where = useMemo(() => {
    const places = destinations.slice(0, 6).map((d) => ({ key: 'd' + d.name, img: d.img, title: d.name, sub: d.fact, rating: null as number | null, go: () => router.push(`/destinations/${destSlug(d.name)}`) }));
    const trips = tours.slice(0, 6).map((t) => ({ key: 't' + t.slug, img: t.img, title: t.title, sub: `${t.days} days · ${t.region}`, rating: t.rating as number | null, go: () => router.push(`/tour/${t.slug}`) }));
    const mixed = places.flatMap((p, i) => (trips[i] ? [p, trips[i]] : [p]));
    return [mixed.filter((_, i) => i % 2 === 0), mixed.filter((_, i) => i % 2 === 1)];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays update in place; `version` signals the change
  }, [version]);

  return (
    <View style={{ flex: 1, backgroundColor: PAGE }}>
      <Screen tabs pinBelowStatusBar stickyHeaderIndices={[1]} style={{ backgroundColor: PAGE }} contentStyle={{ paddingTop: 0 }}>
        {/* 0 — top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.push('/menu')} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Open menu">
            <ListIcon size={26} color={colors.onSurface} />
          </Pressable>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <Image source={brand.mark} style={{ width: 34, height: 20 }} contentFit="contain" accessibilityIgnoresInvertColors />
            <Text style={styles.brand} numberOfLines={1}>Mountain Planet</Text>
          </View>
          <Pressable onPress={() => router.push('/account')} hitSlop={6} style={styles.currencyChip} accessibilityRole="button" accessibilityLabel={`Prices in ${currency}`}>
            <Text style={styles.currencyText}>{currency}</Text>
          </Pressable>
          <Pressable onPress={() => router.navigate('/saved')} hitSlop={10} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Wishlist">
            <HeartIcon size={24} color={colors.primary} weight="duotone" />
          </Pressable>
        </View>

        {/* 1 — AI search bar (pinned while scrolling) */}
        <View style={styles.stickyWrap}>
          <Pressable onPress={() => router.push('/ai')} style={styles.search} accessibilityRole="search" accessibilityLabel="Plan with Planet AI">
            <SparkleIcon size={22} color={colors.primary} weight="fill" />
            <Text style={styles.searchText} numberOfLines={2}>Plan your Himalayan adventure with Planet AI</Text>
            <View style={styles.micBtn}><MicrophoneIcon size={18} color={colors.primary} weight="bold" /></View>
          </Pressable>
        </View>

        {/* 2 — main services */}
        <View style={[styles.pad, styles.primaryRow]}>
          {primary.map((q) => (
            <Tap key={q.label} onPress={q.go} style={styles.primaryTile} scaleTo={0.95} accessibilityRole="button" accessibilityLabel={q.label.replace('\n', ' ')}>
              <View style={[styles.primaryIcon, { backgroundColor: q.tint }]}><q.icon size={34} color={q.color} weight="duotone" /></View>
              <Text style={styles.primaryLabel} numberOfLines={2}>{q.label}</Text>
            </Tap>
          ))}
        </View>

        {/* 3 — more services, with a tab to expand */}
        <View style={[styles.pad, { marginTop: 10 }]}>
          <View style={styles.moreCard}>
            {(showAll ? secondary : secondary.slice(0, 8)).map((q) => (
              <Pressable key={q.label} onPress={q.go} style={({ pressed }) => [styles.moreItem, pressed && { opacity: 0.55 }]} accessibilityRole="button" accessibilityLabel={q.label.replace('\n', ' ')}>
                <q.icon size={30} color={colors.secondary} weight="duotone" />
                <Text style={styles.moreLabel} numberOfLines={2}>{q.label}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => setShowAll((v) => !v)} style={styles.moreTab} hitSlop={8} accessibilityRole="button" accessibilityLabel={showAll ? 'Show fewer services' : 'Show more services'}>
            {showAll ? <CaretUpIcon size={18} color={colors.primary} weight="bold" /> : <CaretDownIcon size={18} color={colors.primary} weight="bold" />}
          </Pressable>
        </View>

        {/* 4 — recent searches */}
        {recent.length ? (
          <View style={styles.section}>
            <Title>Recent Searches</Title>
            <View style={styles.hRow}>
              {recent.slice(0, 3).map((r) => (
                <Pressable key={r.at} onPress={() => router.push({ pathname: '/stays', params: { where: r.where, ...(r.checkIn ? { ci: r.checkIn } : {}), ...(r.checkOut ? { co: r.checkOut } : {}) } })} style={styles.recent} accessibilityRole="button">
                  <Text style={styles.recentKind}>Hotel</Text>
                  <Text style={styles.recentWhere} numberOfLines={1}>{r.where || 'Anywhere in Nepal'}</Text>
                  <Text style={styles.recentMeta}>{r.rooms} room, {r.guests} guests</Text>
                  {r.checkIn ? <Text style={styles.recentMeta}>{day(r.checkIn)}{r.checkOut ? ` – ${day(r.checkOut)}` : ''}</Text> : null}
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* 5 — trek regions (arch cards) */}
        <View style={styles.section}>
          <Title action="View All" onAction={() => router.push('/destinations')}>Trek Regions</Title>
          <HScroll gap={8}>
            {regions.map((r) => (
              <Tap key={r.name} onPress={() => router.push({ pathname: '/explore', params: { q: r.q } })} style={[styles.arch, { width: archW, height: Math.round(archW * 1.7), borderTopLeftRadius: archW / 2, borderTopRightRadius: archW / 2 }]} scaleTo={0.96} accessibilityRole="button" accessibilityLabel={`${r.name} treks`}>
                <Image source={img(r.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['rgba(7,13,24,0.72)', 'rgba(7,13,24,0.05)', 'rgba(7,13,24,0.35)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
                <Text style={styles.archName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{r.name}</Text>
              </Tap>
            ))}
          </HScroll>
        </View>

        {/* 6 — stay collections (2×2) */}
        <View style={styles.section}>
          <Title action="View All" onAction={() => router.push('/stays')}>Stay Collections</Title>
          <View style={[styles.pad, { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }]}>
            {collections.map((c) => (
              <Tap key={c.title} onPress={c.go} style={[styles.collection, { width: halfW }]} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={c.title}>
                <Image source={img(c.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(7,13,24,0.8)']} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
                <View style={styles.collectionBadge}><c.icon size={18} color={colors.primary} weight="duotone" /></View>
                <Text style={styles.collectionTitle} numberOfLines={2}>{c.title}</Text>
              </Tap>
            ))}
          </View>
        </View>

        {/* 7 — for your stay */}
        <View style={styles.section}>
          <Title action="View All" onAction={() => router.push({ pathname: '/stays', params: { where: city } })}>{`For your stay in ${city}`}</Title>
          <Text style={styles.subTitle}>Hand-picked hotels & homestays · verified partners first</Text>
          <View style={{ marginTop: 12 }}>
            <HScroll gap={12}>
              {forStay.map((s) => <HotelCard key={s.slug} s={s} width={hotelW} price={label(s)} />)}
            </HScroll>
          </View>
        </View>

        {/* 8 — what's new */}
        <View style={styles.section}>
          <Title>What&apos;s New</Title>
          <HScroll gap={14}>
            {whatsNew.map((w) => (
              <Pressable key={w.label} onPress={w.go} style={{ width: 80, alignItems: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel={w.label.replace('\n', ' ')}>
                <LinearGradient colors={[colors.primary, '#E9A27E', colors.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bubbleRing}>
                  <View style={styles.bubbleInner}><Image source={img(w.img)} style={{ width: 64, height: 64, borderRadius: 32 }} contentFit="cover" /></View>
                </LinearGradient>
                <Text style={styles.bubbleLabel} numberOfLines={2}>{w.label}</Text>
              </Pressable>
            ))}
          </HScroll>
        </View>

        {/* 9 — hosting */}
        <View style={styles.section}>
          <Title>Explore the world of hosting</Title>
          <View style={styles.pad}>
            <Tap onPress={() => router.push('/partner')} style={styles.hostBanner} scaleTo={0.98} accessibilityRole="button" accessibilityLabel="List your property and earn extra income">
              <Image source={img('/img/bhaktapur.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['transparent', 'rgba(36,52,30,0.94)']} locations={[0.15, 1]} style={StyleSheet.absoluteFill} />
              <View style={styles.hostRow}>
                <Text style={styles.hostText}>List your property & earn extra income</Text>
                <CaretRightIcon size={20} color="#fff" weight="bold" />
              </View>
            </Tap>
          </View>
        </View>

        {/* 10 — where to go (staggered 2-column grid) */}
        <View style={styles.section}>
          <Title action="View All" onAction={() => router.push('/destinations')}>Where to Go</Title>
          <View style={[styles.pad, { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }]}>
            {where.map((col, ci) => (
              <View key={ci} style={{ flex: 1, gap: 10 }}>
                {col.map((x, i) => (
                  <Tap key={x.key} onPress={x.go} style={[styles.whereCard, { height: (i + ci) % 2 === 0 ? 260 : 200 }]} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={x.title}>
                    <Image source={img(x.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <LinearGradient colors={['transparent', 'rgba(7,13,24,0.86)']} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
                    {x.rating ? (
                      <View style={styles.rateBadge}><StarIcon size={11} color="#fff" weight="fill" /><Text style={styles.rateText}>{x.rating.toFixed(1)}</Text></View>
                    ) : null}
                    <View style={{ padding: 12, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MapPinIcon size={13} color="#fff" weight="fill" />
                        <Text style={styles.whereTitle} numberOfLines={2}>{x.title}</Text>
                      </View>
                      <Text style={styles.whereSub} numberOfLines={2}>{x.sub}</Text>
                    </View>
                  </Tap>
                ))}
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.footer}>Mountain Planet Nepal · Treks, stays, rides and flights — one Kathmandu team</Text>
      </Screen>
      <AskAIButton />
    </View>
  );
}

function HotelCard({ s, width, price }: { s: Stay; width: number; price: string | null }) {
  return (
    <Tap onPress={() => router.push(`/stays/${s.slug}`)} style={[styles.hotel, { width }]} scaleTo={0.97} accessibilityRole="button" accessibilityLabel={s.name}>
      <View style={{ height: Math.round(width * 0.62) }}>
        <Image source={img(s.images[0])} style={StyleSheet.absoluteFill} contentFit="cover" />
        {s.rating != null ? (
          <View style={styles.hotelRating}><Text style={styles.rateText}>{s.rating.toFixed(1)}/5</Text></View>
        ) : s.partnerId ? (
          <View style={[styles.hotelRating, { backgroundColor: colors.secondary }]}><Text style={styles.rateText}>Verified</Text></View>
        ) : null}
      </View>
      <View style={{ padding: 12, gap: 3 }}>
        {s.starRating ? (
          <View style={{ flexDirection: 'row', gap: 1 }}>{Array.from({ length: s.starRating }, (_, i) => <StarIcon key={i} size={11} color={colors.onSurface} weight="fill" />)}</View>
        ) : (
          <Text style={styles.hotelKind}>{s.kind === 'homestay' ? 'HOMESTAY' : 'HOTEL'}</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <Text style={styles.hotelName} numberOfLines={1}>{s.name}</Text>
          {price ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.hotelPrice}>{price}</Text>
              <Text style={styles.hotelPer}>Per Night</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.hotelCity} numberOfLines={1}>{s.city}</Text>
        {s.freeCancellation ? (
          <View style={styles.dealTag}><Text style={styles.dealText}>Free cancellation</Text></View>
        ) : s.partnerId ? (
          <View style={styles.dealTag}><Text style={styles.dealText}>Pay at property</Text></View>
        ) : (
          <View style={styles.dealTag}><Text style={styles.dealText}>Price on request</Text></View>
        )}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  pad: { paddingHorizontal: G },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingTop: 4, backgroundColor: PAGE },
  iconBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: fonts.serif, fontSize: 18, color: colors.onSurface },
  currencyChip: { borderWidth: 1, borderColor: colors.border, backgroundColor: CARD, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  currencyText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.onSurface },
  stickyWrap: { backgroundColor: PAGE, paddingHorizontal: G, paddingTop: 8, paddingBottom: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: CARD, borderRadius: radius.lg, paddingLeft: 16, paddingRight: 10, paddingVertical: 12, borderWidth: 1.5, borderColor: 'rgba(217,90,64,0.55)', ...squircle, boxShadow: '0 6px 18px rgba(217,90,64,0.14)' },
  searchText: { flex: 1, fontFamily: fonts.sans, fontSize: 16, lineHeight: 21, color: colors.onSurfaceVariant },
  micBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(217,90,64,0.45)', alignItems: 'center', justifyContent: 'center' },
  primaryRow: { flexDirection: 'row', gap: 8 },
  primaryTile: { flex: 1, minWidth: 0, backgroundColor: CARD, borderRadius: radius.lg, paddingTop: 12, paddingBottom: 10, alignItems: 'center', gap: 6, ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.06)' },
  primaryIcon: { width: 58, height: 58, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', ...squircle },
  primaryLabel: { fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 17, color: colors.onSurface, textAlign: 'center' },
  moreCard: { backgroundColor: CARD, borderRadius: radius.lg, paddingTop: 18, paddingBottom: 16, flexDirection: 'row', flexWrap: 'wrap', rowGap: 18, ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.06)' },
  moreItem: { width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  moreLabel: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 16, color: colors.onSurface, textAlign: 'center' },
  moreTab: { alignSelf: 'center', width: 64, height: 24, backgroundColor: CARD, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 26 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: G, marginBottom: 12, gap: 12 },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 21, lineHeight: 26, color: colors.onSurface },
  subTitle: { paddingHorizontal: G, marginTop: -8, fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceVariant },
  viewAll: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  viewAllText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  viewAllDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hRow: { flexDirection: 'row', paddingHorizontal: G, gap: 10 },
  recent: { flex: 1, maxWidth: 170, backgroundColor: CARD, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, padding: 10, gap: 2 },
  recentKind: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary },
  recentWhere: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.onSurface },
  recentMeta: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant },
  arch: { overflow: 'hidden', borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, borderWidth: 2, borderColor: 'rgba(255,255,255,0.9)', backgroundColor: colors.surface, alignItems: 'center' },
  archName: { marginTop: '30%', paddingHorizontal: 6, fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 17, color: '#fff', textAlign: 'center' },
  collection: { height: 124, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', ...squircle },
  collectionBadge: { position: 'absolute', left: 10, top: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  collectionTitle: { padding: 12, fontFamily: fonts.sansBold, fontSize: 15, lineHeight: 19, color: '#fff' },
  hotel: { backgroundColor: CARD, borderRadius: radius.lg, overflow: 'hidden', ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.07)' },
  hotelRating: { position: 'absolute', right: 8, bottom: 8, backgroundColor: '#2F5B8F', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  hotelKind: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, color: colors.onSurfaceVariant },
  hotelName: { flex: 1, fontFamily: fonts.sansBold, fontSize: 15, color: colors.onSurface },
  hotelPrice: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.onSurface },
  hotelPer: { fontFamily: fonts.sans, fontSize: 11, color: colors.onSurfaceVariant },
  hotelCity: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceVariant },
  dealTag: { alignSelf: 'flex-start', marginTop: 4, borderWidth: 1, borderColor: colors.secondary, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  dealText: { fontFamily: fonts.sansSemi, fontSize: 11.5, color: colors.secondary },
  bubbleRing: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' },
  bubbleInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  bubbleLabel: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 15, color: colors.onSurface, textAlign: 'center' },
  hostBanner: { height: 170, borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', ...squircle },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 },
  hostText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 17, color: '#fff' },
  whereCard: { borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', ...squircle },
  whereTitle: { flex: 1, fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
  whereSub: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 16, color: 'rgba(255,255,255,0.88)' },
  rateBadge: { position: 'absolute', left: 10, top: 10, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#2F5B8F', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  rateText: { fontFamily: fonts.sansBold, fontSize: 11.5, color: '#fff' },
  footer: { marginTop: 28, marginBottom: 8, paddingHorizontal: G, textAlign: 'center', fontFamily: fonts.sans, fontSize: 12, color: colors.onSurfaceVariant },
});
