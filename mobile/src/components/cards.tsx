import { useCurrency } from '@/lib/currency';
import { useStayPrice } from '@/lib/stayPrice';
import { useLayoutWidth } from '@/lib/layout';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { colors, fonts, radius, shadow, space, squircle, type } from '@/theme';
import { img } from '@/lib/images';
import { useStore } from '@/lib/store';
import type { Guide, Tour } from '@/data/tours';
import { slug as destSlug, type Destination } from '@/data/destinations';
import type { Story } from '@/lib/stories';
import type { Stay } from '@/data/stays';
import { BadgePill, Meta, Stars, Tap, TextButton } from './ui';
import { BookmarkSimpleIcon, ClockIcon, MountainsIcon, StarIcon, BookOpenIcon, CalendarBlankIcon } from './icons';

const days = (d: number) => (d === 1 ? '1 day' : `${d} days`);

/** Hero feed card: full-width, 256 tall, 32 radius, bottom gradient with white serif title. */
export function HeroTourCard({ tour, badge = "Editor's pick", style }: { tour: Tour; badge?: string; style?: StyleProp<ViewStyle> }) {
  const { isSaved, toggleSave } = useStore();
  const saved = isSaved(tour.slug);
  return (
    <Tap onPress={() => router.push(`/tour/${tour.slug}`)} style={[styles.hero, style]} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={tour.title}>
      <Image source={img(tour.img)} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityLabel={tour.title} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.20)', 'rgba(0,0,0,0.80)']} locations={[0.4, 0.62, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.heroTop}>
        <BadgePill label={badge} />
        <Pressable onPress={() => toggleSave(tour.slug)} hitSlop={10} style={styles.heroSave} accessibilityLabel={saved ? 'Remove from saved' : 'Save'}>
          <BookmarkSimpleIcon size={20} color="#fff" weight={saved ? 'fill' : 'bold'} />
        </Pressable>
      </View>
      <View style={styles.heroBottom}>
        <Text style={[type.headlineMd, { color: '#fff' }]} numberOfLines={2}>{tour.title}</Text>
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 8 }}>
          <Meta icon={ClockIcon} light>{days(tour.days)}</Meta>
          <Meta icon={MountainsIcon} light>{tour.maxAlt.toLocaleString('en-US')} m</Meta>
          <Meta icon={StarIcon} light fill>{tour.rating.toFixed(1)}</Meta>
        </View>
      </View>
    </Tap>
  );
}

/** List row: 128 square thumb on the left, serif title / metadata / inline link on the right. */
export function TourRow({ tour, action = 'View journey' }: { tour: Tour; action?: string }) {
  const { price } = useCurrency();
  const go = () => router.push(`/tour/${tour.slug}`);
  return (
    <Pressable onPress={go} style={styles.row} accessibilityRole="button" accessibilityLabel={tour.title}>
      <Image source={img(tour.img)} style={styles.rowThumb} contentFit="cover" transition={200} accessibilityLabel={tour.title} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[type.labelUpper, { marginBottom: 4 }]}>{tour.category} · {tour.region}</Text>
        <Text style={[type.headlineMd, { marginBottom: 8 }]} numberOfLines={2}>{tour.title}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <Meta icon={ClockIcon}>{days(tour.days)}</Meta>
          <Meta icon={StarIcon} fill>{tour.rating.toFixed(1)}</Meta>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>from {price(tour.price)}</Text>
        </View>
        <TextButton label={action} onPress={go} style={{ alignSelf: 'flex-start', marginLeft: -4 }} />
      </View>
    </Pressable>
  );
}

/** Square grid thumbnail (recently-viewed style). */
export function TourTile({ tour, width }: { tour: Tour; width: number }) {
  const { price } = useCurrency();
  return (
    <Tap onPress={() => router.push(`/tour/${tour.slug}`)} style={{ width }} accessibilityRole="button" accessibilityLabel={tour.title}>
      <Image source={img(tour.img)} style={[styles.tileImg, { width, height: width }]} contentFit="cover" transition={200} accessibilityLabel={tour.title} />
      <Text style={[type.headlineSm, { marginTop: 10, fontSize: 16, lineHeight: 20 }]} numberOfLines={2}>{tour.title}</Text>
      <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{days(tour.days)} · {price(tour.price)}</Text>
    </Tap>
  );
}

/** Two-column grid of tiles inside the 24px gutter. */
export function TourGrid({ tours }: { tours: Tour[] }) {
  const width = useLayoutWidth();
  const w = (width - space.gutter * 2 - space.md) / 2;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, rowGap: space.lg, paddingHorizontal: space.gutter }}>
      {tours.map((t) => <TourTile key={t.slug} tour={t} width={w} />)}
    </View>
  );
}

/** Tall destination card for horizontal carousels. */
export function DestinationCard({ d, width = 220, height = 280 }: { d: Destination; width?: number; height?: number }) {
  return (
    <Tap onPress={() => router.push(`/destinations/${destSlug(d.name)}`)} style={[styles.dest, { width, height }]} accessibilityRole="button" accessibilityLabel={d.name}>
      <Image source={img(d.img)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel={d.name} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', left: 18, right: 18, bottom: 18 }}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={[type.labelUpper, { color: 'rgba(255,255,255,0.8)' }]}>{d.area} · {d.alt}</Text>
        <Text style={[type.headlineMd, { color: '#fff', marginTop: 4 }]}>{d.name}</Text>
      </View>
    </Tap>
  );
}

/** Wide destination row card for the Destinations list. */
export function DestinationRow({ d }: { d: Destination }) {
  const go = () => router.push(`/destinations/${destSlug(d.name)}`);
  return (
    <Pressable onPress={go} style={styles.row} accessibilityRole="button" accessibilityLabel={d.name}>
      <Image source={img(d.img)} style={styles.rowThumb} contentFit="cover" transition={200} accessibilityLabel={d.name} />
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={[type.labelUpper, { marginBottom: 4 }]}>{d.area} · {d.alt}</Text>
        <Text style={[type.headlineMd, { marginBottom: 6 }]}>{d.name}</Text>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{d.fact}</Text>
        <View style={{ marginTop: 8 }}><Meta icon={CalendarBlankIcon}>{d.best}</Meta></View>
      </View>
    </Pressable>
  );
}

/** Curated board: a three-photo collage. */
export function BoardCard({ title, count, imgs, onPress, width = 240 }: { title: string; count: number; imgs: string[]; onPress: () => void; width?: number }) {
  const h = width * 0.72;
  return (
    <Tap onPress={onPress} style={{ width }} accessibilityRole="button" accessibilityLabel={title}>
      <View style={[styles.collage, { height: h }]}>
        <Image source={img(imgs[0])} style={{ flex: 2 }} contentFit="cover" />
        <View style={{ flex: 1, gap: 2 }}>
          <Image source={img(imgs[1])} style={{ flex: 1 }} contentFit="cover" />
          <Image source={img(imgs[2])} style={{ flex: 1 }} contentFit="cover" />
        </View>
      </View>
      <Text style={[type.headlineSm, { marginTop: 10 }]}>{title}</Text>
      <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{count} journeys · Mountain Planet</Text>
    </Tap>
  );
}

/** Guide (article) card — biscuit tile with photo header. */
export function GuideCard({ g, width }: { g: Guide; width?: number }) {
  return (
    <Tap onPress={() => router.push(`/guide/${g.slug}`)} style={[styles.guide, width ? { width } : null]} accessibilityRole="button" accessibilityLabel={g.title}>
      <Image source={img(g.img)} style={{ height: 150, width: '100%' }} contentFit="cover" transition={200} />
      <View style={{ padding: 20 }}>
        <Text style={[type.labelUpper, { color: colors.primary }]}>{g.kicker}</Text>
        <Text style={[type.headlineSm, { marginTop: 6 }]} numberOfLines={3}>{g.title}</Text>
        <View style={{ marginTop: 10 }}><Meta icon={BookOpenIcon}>{g.minutes} min read</Meta></View>
      </View>
    </Tap>
  );
}

/** Stay card (reference "Popular stays"): photo, rating or badge, name, place. */
export function StayCard({ stay, width }: { stay: Stay; width: number }) {
  const { label } = useStayPrice();
  const nightly = label(stay);
  return (
    <Tap onPress={() => router.push(`/stays/${stay.slug}`)} style={{ width }} accessibilityRole="button" accessibilityLabel={stay.name}>
      <View style={[styles.tileImg, { width, height: width * 0.82, overflow: 'hidden' }]}>
        <Image source={img(stay.images[0])} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} accessibilityLabel={stay.name} />
        {stay.isSample ? <BadgePill label="Sample" style={{ position: 'absolute', left: 10, top: 10 }} /> : null}
        {stay.partnerId ? <BadgePill label="Verified" style={{ position: 'absolute', left: 10, top: 10, backgroundColor: colors.secondary }} /> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 10 }}>
        {stay.rating !== null ? (
          <>
            <StarIcon size={13} color={colors.primary} weight="fill" />
            <Text style={[type.bodySm, { fontSize: 12 }]}>{stay.rating.toFixed(1)}</Text>
            <Text style={[type.bodySm, { fontSize: 12, color: colors.onSurfaceVariant }]}>({stay.reviews} reviews)</Text>
          </>
        ) : (
          <Text style={[type.labelUpper, { fontSize: 9 }]}>{stay.kind === 'homestay' ? 'Homestay' : 'Hotel'}</Text>
        )}
      </View>
      <Text style={[type.headlineSm, { fontSize: 16, lineHeight: 20, marginTop: 4 }]} numberOfLines={2}>{stay.name}</Text>
      <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]} numberOfLines={1}>
        {stay.city} · {nightly !== null ? `from ${nightly}/night` : 'price on request'}
      </Text>
    </Tap>
  );
}

/** Traveller story card — photo, quote, stars, name. */
export function StoryCard({ story, onPress, width }: { story: Story; onPress: () => void; width: number }) {
  const cover = story.photos[0];
  const h = Math.round(width * (story.text.length % 3 === 0 ? 1.25 : story.text.length % 3 === 1 ? 1 : 1.12));
  return (
    <Tap onPress={onPress} style={{ width, marginBottom: space.lg }} accessibilityRole="button" accessibilityLabel={`Story by ${story.name}`}>
      <View style={[styles.storyImg, { height: h }]}>
        {cover ? <Image source={img(cover)} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
        {story.photos.length > 1 ? (
          <View style={styles.photoCount}><Text style={[type.labelSm, { color: '#fff' }]}>+{story.photos.length - 1}</Text></View>
        ) : null}
        {story.mine || story.pending ? <BadgePill label={story.pending ? 'Awaiting approval' : 'Yours'} style={{ position: 'absolute', left: 10, top: 10 }} /> : null}
      </View>
      <View style={{ marginTop: 10 }}><Stars n={story.rating} size={12} /></View>
      <Text style={[type.bodySm, { marginTop: 6 }]} numberOfLines={4}>“{story.text}”</Text>
      <Text style={[type.labelMd, { marginTop: 8, fontFamily: fonts.sansSemi }]}>{story.name}</Text>
      {story.country ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>{story.country}</Text> : null}
    </Tap>
  );
}

const styles = StyleSheet.create({
  hero: { height: 256, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle, ...shadow.sm },
  heroTop: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroSave: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center', ...shadow.glass },
  heroBottom: { position: 'absolute', left: 20, right: 20, bottom: 20 },
  row: { flexDirection: 'row', gap: space.md },
  rowThumb: { width: 128, height: 128, borderRadius: radius.xl, backgroundColor: colors.surfaceAlt, ...squircle },
  tileImg: { borderRadius: radius.xl, backgroundColor: colors.surfaceAlt, ...squircle, ...shadow.sm },
  dest: { borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle, ...shadow.sm },
  collage: { flexDirection: 'row', gap: 2, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle },
  guide: { backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, overflow: 'hidden', ...squircle, ...shadow.hairline },
  storyImg: { borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle, ...shadow.sm },
  photoCount: { position: 'absolute', right: 10, bottom: 10, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 },
});
