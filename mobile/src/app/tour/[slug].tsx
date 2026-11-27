import { routeFor } from '@/lib/geo';
import { ReviewsSection } from '@/components/ReviewsSection';
import { useCurrency } from '@/lib/currency';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, space, type } from '@/theme';
import { getTour, tours } from '@/data/tours';
import { askAgent, shareLink, useStore } from '@/lib/store';
import { DetailLayout } from '@/components/DetailLayout';
import { Card, Gutter, Hairline, Kicker, Meta, PrimaryButton, Section, SectionHeader, SoftButton, StepNumeral, TagChip, Carousel, useHalfCardWidth } from '@/components/ui';
import { TourTile } from '@/components/cards';
import { BookmarkSimpleIcon, CheckIcon, ShareNetworkIcon, SparkleIcon, StarIcon, MapPinIcon, SunIcon } from '@/components/icons';
import NotFound from '@/components/NotFound';
import { useContent } from '@/lib/content';

export default function TourDetail() {
  const halfW = useHalfCardWidth();
  useContent();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const tour = getTour(slug ?? '');
  const { isSaved, toggleSave } = useStore();
  const { price } = useCurrency();
  if (!tour) return <NotFound />;

  const saved = isSaved(tour.slug);
  const similar = tours
    .filter((t) => t.slug !== tour.slug)
    .map((t) => ({ t, s: (t.category === tour.category ? 2 : 0) + (t.region === tour.region ? 3 : 0) + t.rating / 10 }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map((x) => x.t);

  const stats = [
    ['Days', String(tour.days)],
    ['Level', tour.difficulty],
    ['Max alt', `${tour.maxAlt.toLocaleString('en-US')}m`],
    ['Group', tour.groupSize],
  ];

  return (
    <DetailLayout
      image={tour.img}
      imageLabel={tour.title}
      actions={[
        { icon: ShareNetworkIcon, label: 'Share', onPress: () => shareLink(`/tour/${tour.slug}`, tour.title) },
        { icon: BookmarkSimpleIcon, label: saved ? 'Remove from saved' : 'Save', onPress: () => toggleSave(tour.slug), active: saved },
      ]}
      footerHeight={96}
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ flexShrink: 1 }}>
            <Kicker style={{ fontSize: 9 }}>From, per person</Kicker>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[type.headlineLg, { marginTop: 2 }]}>{price(tour.price)}</Text>
          </View>
          <PrimaryButton label="Enquire now" onPress={() => router.push({ pathname: '/plan', params: { tour: tour.slug } })} style={{ flex: 1, minWidth: 150, paddingVertical: 16, paddingHorizontal: 16 }} />
        </View>
      }
    >
      <Gutter>
        <Kicker style={{ color: colors.primary }}>{tour.category} · {tour.region}</Kicker>
        <Text style={[type.displayLg, { marginTop: 10 }]}>{tour.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <StarIcon size={16} color={colors.primary} weight="fill" />
          <Text style={[type.labelMd, { fontFamily: fonts.sansSemi }]}>{tour.rating.toFixed(1)}</Text>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>({tour.reviews} reviews)</Text>
        </View>

        {/* kicker stat strip */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg }}>
          {stats.map(([k, v]) => (
            <View key={k} style={{ flexShrink: 1 }}>
              <Kicker>{k}</Kicker>
              <Text style={[type.headlineSm, { marginTop: 4, fontSize: 16 }]} numberOfLines={1}>{v}</Text>
            </View>
          ))}
        </View>
        <Hairline style={{ marginTop: space.lg }} />

        <Text style={[type.bodyMd, { marginTop: space.lg }]}>{tour.summary}</Text>
        <View style={{ gap: 8, marginTop: space.md }}>
          <Meta icon={SunIcon}>Best season: {tour.season}</Meta>
          <Meta icon={MapPinIcon}>{tour.region}</Meta>
        </View>
        {routeFor(tour.slug) ? <SoftButton label="See the route on a map" icon={MapPinIcon} onPress={() => router.push({ pathname: '/map', params: { route: tour.slug } })} style={{ marginTop: space.lg }} /> : null}
        <SoftButton label="Ask Planet AI about this trip" icon={SparkleIcon} onPress={() => askAgent(`Tell me about ${tour.title}`)} style={{ marginTop: space.lg }} />
      </Gutter>

      <Section>
        <Gutter>
          <Card>
            <Text style={[type.headlineMd, { marginBottom: space.md }]}>Highlights</Text>
            <View style={{ gap: 12 }}>
              {tour.highlights.map((h) => (
                <View key={h} style={{ flexDirection: 'row', gap: 10 }}>
                  <CheckIcon size={18} color={colors.secondary} weight="bold" style={{ marginTop: 3 }} />
                  <Text style={[type.bodyMd, { flex: 1 }]}>{h}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Gutter>
      </Section>

      <Section>
        <SectionHeader kicker="Day by day" title="Itinerary at a glance" />
        <Gutter style={{ gap: space.lg }}>
          {tour.itinerary.map((d, i) => (
            <View key={d.day} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <StepNumeral n={i + 1} />
              <View style={{ flex: 1, paddingTop: 6 }}>
                <Kicker>{d.day}</Kicker>
                <Text style={[type.bodyMd, { marginTop: 4 }]}>{d.title}</Text>
              </View>
            </View>
          ))}
        </Gutter>
      </Section>

      <Section>
        <SectionHeader kicker="Taken care of" title="What’s included" />
        <Gutter style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {tour.includes.map((x) => <TagChip key={x} label={x} />)}
        </Gutter>
      </Section>

      <ReviewsSection tour={tour.slug} />

      <Section>
        <SectionHeader kicker="You may also like" title="More like this" />
        <Carousel itemWidth={halfW}>
          {similar.map((t) => <TourTile key={t.slug} tour={t} width={halfW} />)}
        </Carousel>
      </Section>
    </DetailLayout>
  );
}
