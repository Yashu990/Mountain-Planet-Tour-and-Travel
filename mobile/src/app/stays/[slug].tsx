import { ReviewsSection } from '@/components/ReviewsSection';
import { useLayoutWidth } from '@/lib/layout';
import { useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, space, squircle, type } from '@/theme';
import { getStay } from '@/data/stays';
import { useContent } from '@/lib/content';
import { img } from '@/lib/images';
import { shareLink } from '@/lib/store';
import { BadgePill, Callout, GlassButton, Gutter, Hairline, Kicker, PrimaryButton, Section, TagChip, TextButton, Tap } from '@/components/ui';
import NotFound from '@/components/NotFound';
import { useStayPrice } from '@/lib/stayPrice';
import { RoomsSection, useRooms } from '@/components/RoomsSection';
import { ArrowLeftIcon, InfoIcon, MapPinIcon, ShareNetworkIcon, StarIcon } from '@/components/icons';

const HERO = 380;

/** Stay detail (reference hotel screen): gallery with counter, rating, facts, thumbnails, location, Reserve bar. */
export default function StayDetail() {
  useContent();
  const { slug, ci, co, a, c } = useLocalSearchParams<{ slug: string; ci?: string; co?: string; a?: string; c?: string }>();
  const stay = getStay(slug ?? '');
  const width = useLayoutWidth();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);
  const { label } = useStayPrice();
  const rooms = useRooms(slug ?? '', !!stay?.partnerId);
  const pager = useRef<React.ComponentRef<typeof ScrollView>>(null);
  if (!stay) return <NotFound />;

  const goTo = (i: number) => {
    pager.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };
  const facts = stay.partnerId
    ? [
        `${rooms?.length ?? '…'} room ${rooms?.length === 1 ? 'type' : 'types'}`,
        `up to ${stay.maxGuests} guests per room`,
        ...(stay.checkInTime ? [`check-in ${stay.checkInTime}`] : []),
      ]
    : [
    `${stay.maxGuests} ${stay.maxGuests === 1 ? 'guest' : 'guests'}`,
    `${stay.bedrooms} ${stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`,
    `${stay.beds} ${stay.beds === 1 ? 'bed' : 'beds'}`,
    `${stay.baths} ${stay.baths === 1 ? 'bath' : 'baths'}`,
      ];
  const mapUrl =
    stay.lat !== undefined && stay.lng !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${stay.lat},${stay.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${stay.address || stay.city}, Nepal`)}`;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/stays'));
  const reserve = (room?: string) =>
    router.push({ pathname: '/book/stay', params: { stay: stay.slug, ...(room ? { room } : {}), ...(ci ? { ci } : {}), ...(co ? { co } : {}), ...(a ? { a } : {}), ...(c ? { c } : {}) } });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* gallery */}
        <View style={{ height: HERO }}>
          <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {stay.images.map((p, i) => (
              <Image key={i} source={img(p)} style={{ width, height: HERO }} contentFit="cover" accessibilityLabel={`${stay.name}, photo ${i + 1}`} />
            ))}
          </ScrollView>
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent']} locations={[0, 0.4]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.counter} pointerEvents="none">
            <Text style={[type.labelSm, { color: '#fff' }]}>{page + 1}/{stay.images.length}</Text>
          </View>
        </View>

        <Gutter style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {stay.rating !== null ? (
              <>
                <StarIcon size={16} color={colors.primary} weight="fill" />
                <Text style={[type.labelMd, { fontFamily: fonts.sansSemi }]}>{stay.rating.toFixed(1)}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>({stay.reviews} reviews)</Text>
              </>
            ) : (
              <Kicker style={{ color: colors.primary }}>{stay.kind === 'homestay' ? 'Homestay' : 'Hotel'} · {stay.city}</Kicker>
            )}
            {stay.isSample ? <BadgePill label="Sample" /> : null}
            {stay.partnerId ? <BadgePill label="Verified partner" style={{ backgroundColor: colors.secondary }} /> : null}
          </View>
          <Text style={[type.displayMd, { marginTop: 10 }]}>{stay.name}</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 8 }]}>{facts.join('  ·  ')}</Text>
        </Gutter>

        {stay.images.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: space.gutter, marginTop: space.lg }}>
            {stay.images.map((p, i) => (
              <Tap key={i} onPress={() => goTo(i)} accessibilityRole="button" accessibilityLabel={`Show photo ${i + 1}`} style={[styles.thumb, i === page && { borderColor: colors.secondary }]}>
                <Image source={img(p)} style={StyleSheet.absoluteFill} contentFit="cover" />
              </Tap>
            ))}
          </ScrollView>
        ) : null}

        <Gutter style={{ marginTop: space.lg }}>
          <Hairline />
          <Text style={[type.bodyMd, { marginTop: space.lg }]}>{stay.description}</Text>
          {stay.isSample ? (
            <View style={{ marginTop: space.lg }}>
              <Callout icon={InfoIcon}>This is a sample listing that shows the kind of stay we arrange. When you reserve, our team confirms a real property, availability and price before you pay anything.</Callout>
            </View>
          ) : null}
        </Gutter>

        {rooms ? <RoomsSection rooms={rooms} onChoose={(r) => reserve(r.id)} /> : null}

        {stay.checkInTime || stay.checkOutTime || stay.houseRules ? (
          <Section>
            <Gutter style={{ gap: 8 }}>
              <Text style={type.headlineMd}>Good to know</Text>
              {stay.checkInTime ? <Text style={type.bodyMd}>Check-in from {stay.checkInTime}</Text> : null}
              {stay.checkOutTime ? <Text style={type.bodyMd}>Check-out by {stay.checkOutTime}</Text> : null}
              {stay.houseRules ? <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>{stay.houseRules}</Text> : null}
            </Gutter>
          </Section>
        ) : null}

        <ReviewsSection stay={stay.slug} />

        {stay.amenities.length ? (
          <Section>
            <Gutter>
              <Text style={[type.headlineMd, { marginBottom: space.md }]}>What’s included</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>{stay.amenities.map((a) => <TagChip key={a} label={a} />)}</View>
            </Gutter>
          </Section>
        ) : null}

        <Section>
          <Gutter>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Text style={type.headlineMd}>Location</Text>
              <TextButton label="See on map" onPress={() => Linking.openURL(mapUrl)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <MapPinIcon size={18} color={colors.onSurfaceVariant} />
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, flex: 1 }]}>{stay.address || stay.city}</Text>
            </View>
          </Gutter>
        </Section>
      </ScrollView>

      {/* floating top bar */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <GlassButton icon={ArrowLeftIcon} label="Back" onPress={back} />
        <GlassButton icon={ShareNetworkIcon} label="Share" onPress={() => shareLink(`/stays/${stay.slug}`, stay.name)} />
      </View>

      {/* reserve bar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Kicker>{label(stay) !== null ? 'Start from' : 'Price'}</Kicker>
          {label(stay) !== null ? (
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[type.headlineLg, { marginTop: 2 }]}>
              {label(stay)}
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>/night</Text>
            </Text>
          ) : (
            <Text style={[type.headlineSm, { marginTop: 4 }]}>On request</Text>
          )}
        </View>
        <PrimaryButton label="Reserve" onPress={() => reserve()} style={{ flex: 1.2, paddingVertical: 16 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: { position: 'absolute', right: space.gutter, bottom: 16, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  thumb: { width: 76, height: 76, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.surfaceAlt, ...squircle },
  topBar: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', justifyContent: 'space-between' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.gutter, paddingTop: 12, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: colors.border },
});
