import { useI18n } from '@/lib/i18n';
import { useLayoutWidth } from '@/lib/layout';
import { Avatar } from '@/components/Avatar';
import { useCurrency } from '@/lib/currency';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius, shadow, space, squircle, type } from '@/theme';
import { tours, guides, boards, CONTACT } from '@/data/tours';
import { destinations } from '@/data/destinations';
import { categories, type CatName } from '@/lib/categories';
import { askAgent } from '@/lib/store';
import { useStories } from '@/lib/stories';
import { useContent } from '@/lib/content';
import { useAuth } from '@/lib/auth';
import { brand, img } from '@/lib/images';
import { stays } from '@/data/stays';
import {
  Card,
  Chip,
  ChipRow,
  Gutter,
  Hairline,
  Kicker,
  PrimaryButton,
  Screen,
  Section,
  SectionHeader,
  SoftButton,
  StepNumeral,
  Tap,
  TextButton,
  Carousel,
  useCardWidth,
  useHalfCardWidth,
} from '@/components/ui';
import { BoardCard, DestinationCard, GuideCard, HeroTourCard, StayCard, StoryCard, TourRow } from '@/components/cards';
import {
  AirplaneTiltIcon,
  BedIcon,
  CameraPlusIcon,
  CompassIcon,
  EnvelopeSimpleIcon,
  HandshakeIcon,
  HouseLineIcon,
  LeafIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MountainsIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  SparkleIcon,
  SunIcon,
  TaxiIcon,
  TicketIcon,
  UsersIcon,
  type Icon,
} from '@/components/icons';

const ladder = [
  { name: 'Everest Base Camp', m: 5364, q: 'everest' },
  { name: 'Annapurna Base Camp', m: 4130, q: 'annapurna' },
  { name: 'Poon Hill', m: 3210, q: 'poon-hill' },
  { name: 'Kathmandu', m: 1400, q: 'kathmandu' },
  { name: 'Pokhara', m: 822, q: 'pokhara' },
];

type GridKey = 'grid.hotels' | 'grid.homestays' | 'grid.flights' | 'grid.cabs' | 'grid.treks' | 'grid.activities' | 'grid.map' | 'grid.plan';

// Services grid on the hero (reference layout).
const quick: { icon: Icon; label: GridKey; go: () => void }[] = [
  { icon: BedIcon, label: 'grid.hotels', go: () => router.push({ pathname: '/stays', params: { kind: 'hotel' } }) },
  { icon: HouseLineIcon, label: 'grid.homestays', go: () => router.push({ pathname: '/stays', params: { kind: 'homestay' } }) },
  { icon: AirplaneTiltIcon, label: 'grid.flights', go: () => router.push('/book/flight') },
  { icon: TaxiIcon, label: 'grid.cabs', go: () => router.push('/book/cab') },
  { icon: MountainsIcon, label: 'grid.treks', go: () => router.navigate('/explore') },
  { icon: TicketIcon, label: 'grid.activities', go: () => router.push('/book/ticket') },
  { icon: MapPinIcon, label: 'grid.map', go: () => router.push('/map') },
  { icon: CompassIcon, label: 'grid.plan', go: () => router.push('/plan') },
];

const steps = [
  ['Airport pickup', 'We meet you at Tribhuvan International Airport and take you to your hotel.'],
  ['Hotel in Kathmandu', 'Hand-picked stays, with a trip briefing and gear check.'],
  ['Permits sorted', 'TIMS cards, national park and restricted-area permits are arranged for you.'],
  ['Flights and transport', 'Domestic flights to Lukla, Pokhara or Jomsom, plus private vehicles.'],
  ['Your journey', 'A licensed guide and porters take you through the trek, tour or safari.'],
  ['Farewell', 'A farewell dinner and a transfer back to the airport.'],
];

const why: { icon: Icon; h: string; p: string }[] = [
  { icon: ShieldCheckIcon, h: 'Licensed & insured', p: 'Government-registered agency with certified, first-aid trained guides.' },
  { icon: UsersIcon, h: 'Small groups', p: 'Private or small-group trips with flexible dates that fit you.' },
  { icon: LeafIcon, h: 'Responsible travel', p: 'Fair wages, porter welfare and leave-no-trace on every trail.' },
  { icon: HandshakeIcon, h: 'Tailor-made', p: 'Every itinerary can be customised — pace, comfort, budget.' },
];

export default function Home() {
  const { version } = useContent();
  const width = useLayoutWidth();
  const [cat, setCat] = useState<CatName>('All');
  const { stories, loading } = useStories();
  const featured = tours[0];
  const { enabled, user } = useAuth();
  const { price } = useCurrency();
  const { t } = useI18n();
  const fromLabel = t('common.from');
  const firstName = String(user?.user_metadata?.full_name ?? '').trim().split(' ')[0];
  // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  const deals = useMemo(() => [...tours].filter((t) => t.category === 'Trekking').sort((a, b) => a.price - b.price).slice(0, 6), [version]);

  // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  const feed = useMemo(() => tours.filter((t) => t.slug !== featured.slug && (cat === 'All' || cat === 'Guides' || t.category === cat)), [cat, featured.slug, version]);
  const storyW = Math.min(200, width * 0.48);
  const cardW = useCardWidth(0.88);
  const halfW = useHalfCardWidth();

  return (
    <Screen tabs>
      {/* header: greeting + account, bookings and Planet AI */}
      <Gutter style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <View style={styles.avatar}>
            <Image source={brand.mark} style={{ width: 30, height: 18 }} contentFit="contain" accessibilityIgnoresInvertColors />
          </View>
          <View style={{ flex: 1 }}>
            <Kicker>{t('home.namaste')}</Kicker>
            <Text style={[type.headlineMd, { marginTop: 2 }]} numberOfLines={1}>{t('home.hi', { name: firstName || t('home.traveller') })}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Tap onPress={() => router.push('/bookings')} style={styles.roundBtn} accessibilityRole="button" accessibilityLabel="My bookings">
            <ReceiptIcon size={20} color={colors.onSurface} />
          </Tap>
          <Tap onPress={() => askAgent()} style={[styles.roundBtn, { backgroundColor: colors.primarySoft }]} accessibilityRole="button" accessibilityLabel="Open Planet AI trip planner">
            <SparkleIcon size={20} color={colors.primary} weight="duotone" />
          </Tap>
          {/* profile: photo / initial / person icon — opens Account (sign in, details, photo) */}
          <Tap onPress={() => router.push('/account')} scaleTo={0.92} accessibilityRole="button" accessibilityLabel={user ? 'Your profile' : enabled ? 'Sign in' : 'Settings'}>
            <Avatar size={44} />
          </Tap>
        </View>
      </Gutter>

      <Gutter style={{ marginTop: space.lg }}>
        <Pressable onPress={() => router.push({ pathname: '/explore', params: { focus: '1' } })} style={styles.fakeSearch} accessibilityRole="search" accessibilityLabel="Search journeys">
          <MagnifyingGlassIcon size={20} color={colors.onSurfaceVariant} />
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>{t('home.search')}</Text>
        </Pressable>
      </Gutter>

      {/* hero with overlapping services grid */}
      <Gutter style={{ marginTop: space.lg }}>
        <View style={styles.heroBox}>
          <Image source={img('/img/hero.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Himalayan peaks at sunrise" />
          <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'transparent']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ padding: 22 }}>
            <Text style={[type.displayMd, { color: '#fff' }]}>{t('home.headline')}</Text>
            <Text style={[type.bodySm, { color: 'rgba(255,255,255,0.88)', marginTop: 8 }]}>{t('home.sub')}</Text>
          </View>
        </View>
        <View style={styles.gridCard}>
          {quick.map((q) => (
            <Pressable key={q.label} onPress={q.go} style={({ pressed }) => [styles.gridItem, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={t(q.label)}>
              <View style={styles.gridIcon}><q.icon size={24} color={colors.secondary} weight="duotone" /></View>
              <Text style={[type.labelSm, { textAlign: 'center' }]} numberOfLines={1}>{t(q.label)}</Text>
            </Pressable>
          ))}
        </View>
      </Gutter>

      {/* trek deals */}
      <Section>
        <SectionHeader kicker={t('home.dealsKicker')} title={t('home.deals')} action={t('common.seeAll')} onAction={() => router.push({ pathname: '/explore', params: { sort: 'price' } })} />
        <Carousel itemWidth={cardW}>
          {deals.map((t) => (
            <Tap key={t.slug} onPress={() => router.push(`/tour/${t.slug}`)} style={[styles.deal, { width: cardW }]} accessibilityRole="button" accessibilityLabel={`${t.title}, from $${t.price}`}>
              <Image source={img(t.img)} style={{ height: 150, width: '100%' }} contentFit="cover" />
              <View style={{ padding: 16, flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.headlineSm, { fontSize: 16, lineHeight: 20 }]} numberOfLines={2}>{t.title}</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{t.days === 1 ? '1 day' : `${t.days} days`} · {t.difficulty}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>{fromLabel}</Text>
                  <Text style={[type.headlineMd, { color: colors.primary }]}>{price(t.price)}</Text>
                </View>
              </View>
            </Tap>
          ))}
        </Carousel>
      </Section>

      {/* trek tools */}
      <Section>
        <Gutter>
          <Pressable onPress={() => router.push('/tools')} accessibilityRole="button" accessibilityLabel="Open trek tools">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={styles.gridIcon}><SunIcon size={24} color={colors.secondary} weight="duotone" /></View>
              <View style={{ flex: 1 }}>
                <Text style={[type.headlineSm, { fontSize: 17 }]}>{t('home.tools')}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{t('home.toolsSub')}</Text>
              </View>
              <CompassIcon size={18} color={colors.onSurfaceVariant} />
            </Card>
          </Pressable>
        </Gutter>
      </Section>

      {/* popular stays */}
      {stays.length > 0 ? (
        <Section>
          <SectionHeader kicker="Hotels & homestays" title={t('home.stays')} action={t('common.seeAll')} onAction={() => router.push('/stays')} />
          <Gutter style={{ flexDirection: 'row', gap: space.md }}>
            {stays.slice(0, 2).map((s) => <StayCard key={s.slug} stay={s} width={(width - space.gutter * 2 - space.md) / 2} />)}
          </Gutter>
        </Section>
      ) : null}

      {/* featured */}
      <Section>
        <SectionHeader kicker="Editor’s pick" title="The classic Himalayan trek" />
        <Gutter>
          <HeroTourCard tour={featured} />
        </Gutter>
      </Section>

      {/* altitude ladder */}
      <Section>
        <SectionHeader kicker="Real places, real heights" title="Climb the ladder" />
        <Gutter>
          <Card style={{ gap: 18 }}>
            {ladder.map((l) => (
              <Pressable key={l.name} onPress={() => router.push(`/destinations/${l.q}`)} accessibilityRole="button" accessibilityLabel={`${l.name}, ${l.m} metres`}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={[type.headlineSm, { fontSize: 16 }]}>{l.name}</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontVariant: ['tabular-nums'] }]}>{l.m.toLocaleString('en-US')} m</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(l.m / 5364) * 100}%` }]} />
                </View>
              </Pressable>
            ))}
          </Card>
        </Gutter>
      </Section>

      {/* feed */}
      <Section>
        <SectionHeader kicker="Ideas for you" title="Pin your Himalayan dreams" action="See all" onAction={() => router.push({ pathname: '/explore', params: cat === 'All' ? {} : { cat } })} />
        <ChipRow>
          {categories.map((c) => <Chip key={c.name} label={c.name} icon={c.icon} active={cat === c.name} onPress={() => setCat(c.name)} />)}
        </ChipRow>
        {cat === 'Guides' ? (
          <Carousel itemWidth={cardW} style={{ marginTop: space.lg }}>
            {guides.map((g) => <GuideCard key={g.slug} g={g} width={cardW} />)}
          </Carousel>
        ) : (
          <Gutter style={{ marginTop: space.lg, gap: space.xl }}>
            {feed.slice(0, 5).map((t) => <TourRow key={t.slug} tour={t} />)}
            {feed.length === 0 ? <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>No journeys in this category yet.</Text> : null}
          </Gutter>
        )}
      </Section>

      {/* destinations */}
      <Section>
        <SectionHeader kicker="Destinations" title="Where we take you" action="See all" onAction={() => router.push('/destinations')} />
        <Carousel itemWidth={halfW}>
          {destinations.slice(0, 8).map((d) => <DestinationCard key={d.name} d={d} width={halfW} height={Math.round(halfW * 1.3)} />)}
        </Carousel>
      </Section>

      {/* boards */}
      <Section>
        <SectionHeader kicker="Curated boards" title="Collections by our guides" />
        <Carousel itemWidth={cardW}>
          {boards.map((b) => {
            const items = tours.filter(b.match);
            const imgs = items.slice(0, 3).map((t) => t.img);
            while (imgs.length < 3) imgs.push(items[0]?.img ?? '/img/hero.jpg');
            return <BoardCard key={b.id} title={b.title} count={items.length} imgs={imgs} width={cardW} onPress={() => router.push({ pathname: '/explore', params: { board: b.id } })} />;
          })}
        </Carousel>
      </Section>

      {/* journey steps */}
      <Section>
        <SectionHeader kicker="How it works" title="From airport to airport" />
        <Gutter style={{ gap: space.lg }}>
          {steps.map(([h, p], i) => (
            <View key={h} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <StepNumeral n={i + 1} />
              <View style={{ flex: 1, paddingTop: 8 }}>
                <Text style={type.headlineSm}>{h}</Text>
                <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{p}</Text>
              </View>
            </View>
          ))}
        </Gutter>
      </Section>

      {/* why us */}
      <Section>
        <SectionHeader kicker="Local hearts" title="Himalayan expertise" />
        <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
          {why.map((w) => (
            <Card key={w.h} style={{ width: (width - space.gutter * 2 - space.md) / 2, padding: 20 }}>
              <w.icon size={24} color={colors.secondary} weight="duotone" />
              <Text style={[type.headlineSm, { marginTop: 12, fontSize: 16 }]}>{w.h}</Text>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{w.p}</Text>
            </Card>
          ))}
        </Gutter>
        <Gutter style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg }}>
          {[
            ['20+', 'Journeys'],
            ['4.9', 'Traveller rating'],
            ['24/7', 'On-trip support'],
          ].map(([n, l]) => (
            <View key={l}>
              <Kicker>{l}</Kicker>
              <Text style={[type.displayMd, { marginTop: 4 }]}>{n}</Text>
            </View>
          ))}
        </Gutter>
      </Section>

      {/* stories */}
      <Section>
        <SectionHeader kicker="Traveller stories" title="Pinned to their hearts" action="See all" onAction={() => router.push('/stories')} />
        {!loading && (
          <ChipRow>
            {stories.slice(0, 6).map((s) => <StoryCard key={s.id} story={s} width={storyW} onPress={() => router.push(`/story/${s.id}`)} />)}
          </ChipRow>
        )}
        <Gutter>
          <SoftButton label="Share your story" icon={CameraPlusIcon} onPress={() => router.push('/share-story')} />
        </Gutter>
      </Section>

      {/* CTA */}
      <Section>
        <Gutter>
          <Card style={{ alignItems: 'flex-start', gap: 14 }}>
            <SparkleIcon size={28} color={colors.primary} weight="duotone" />
            <Text style={type.headlineLg}>Not sure where to start?</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
              Tell Planet AI your days, budget and dream — get instant trip matches, seasonal advice and permit info. Then our team turns it into a real itinerary.
            </Text>
            <SoftButton label="Chat with Planet AI" icon={SparkleIcon} onPress={() => askAgent()} />
          </Card>
          <PrimaryButton label="Request a free quote" onPress={() => router.push('/plan')} style={{ marginTop: space.lg }} />
        </Gutter>
      </Section>

      {/* footer */}
      <Section>
        <Gutter style={{ gap: 10 }}>
          <Hairline style={{ marginBottom: space.md }} />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <MapPinIcon size={16} color={colors.onSurfaceVariant} />
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>{CONTACT.address}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <EnvelopeSimpleIcon size={16} color={colors.onSurfaceVariant} />
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{CONTACT.email}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={[type.bodySm, { fontFamily: fonts.serif, color: colors.onSurfaceVariant }]}>Heaven is a myth, Himalayas are real</Text>
            <TextButton label="About us" onPress={() => router.push('/about')} />
          </View>
        </Gutter>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', ...shadow.hairline },
  roundBtn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  heroBox: { height: 290, borderRadius: radius.hero, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle },
  gridCard: {
    marginTop: -78,
    marginHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 6,
    ...squircle,
    boxShadow: '0 16px 40px rgba(45,43,38,0.12)',
  },
  gridItem: { width: '25%', alignItems: 'center', gap: 6, paddingVertical: 6 },
  gridIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', ...squircle },
  deal: { width: 270, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle, ...shadow.hairline },
  fakeSearch: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 16, ...squircle },
  barTrack: { height: 6, borderRadius: radius.full, backgroundColor: colors.border, marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.full, backgroundColor: colors.accent },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  serviceIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...squircle },
});
