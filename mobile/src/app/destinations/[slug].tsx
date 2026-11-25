import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { destinations, slug as toSlug } from '@/data/destinations';
import { stories } from '@/data/placeStories';
import { tours } from '@/data/tours';
import { shareLink } from '@/lib/store';
import { DetailLayout } from '@/components/DetailLayout';
import { Card, ChipRow, Gutter, Hairline, Kicker, PrimaryButton, Section, SectionHeader } from '@/components/ui';
import { DestinationCard, TourRow } from '@/components/cards';
import { CheckIcon, ShareNetworkIcon } from '@/components/icons';
import NotFound from '@/components/NotFound';
import { useContent } from '@/lib/content';

export default function Place() {
  useContent();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const d = destinations.find((x) => toSlug(x.name) === slug);
  if (!d) return <NotFound />;

  const info = stories[d.name];
  const here = tours.filter((t) => `${t.title} ${t.region} ${t.tags.join(' ')}`.toLowerCase().includes(d.q));
  const more = destinations.filter((x) => x.name !== d.name && x.area === d.area);

  return (
    <DetailLayout image={d.img} imageLabel={d.name} actions={[{ icon: ShareNetworkIcon, label: 'Share', onPress: () => shareLink(`/destinations/${slug}`, d.name) }]}>
      <Gutter>
        <Kicker style={{ color: colors.primary }}>{d.area}</Kicker>
        <Text style={[type.displayLg, { marginTop: 10 }]}>{d.name}</Text>

        <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.lg }}>
          <View>
            <Kicker>High point</Kicker>
            <Text style={[type.headlineSm, { marginTop: 4 }]}>{d.alt}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Kicker>Best time</Kicker>
            <Text style={[type.headlineSm, { marginTop: 4 }]}>{d.best}</Text>
          </View>
        </View>
        <Hairline style={{ marginTop: space.lg }} />

        <Text style={[type.headlineMd, { marginTop: space.lg }]}>The story</Text>
        <Text style={[type.bodyMd, { marginTop: 8 }]}>{info?.story ?? d.fact}</Text>
      </Gutter>

      {info?.highlights?.length ? (
        <Section>
          <Gutter>
            <Card>
              <Text style={[type.headlineMd, { marginBottom: space.md }]}>Don’t miss</Text>
              <View style={{ gap: 12 }}>
                {info.highlights.map((h) => (
                  <View key={h} style={{ flexDirection: 'row', gap: 10 }}>
                    <CheckIcon size={18} color={colors.secondary} weight="bold" style={{ marginTop: 3 }} />
                    <Text style={[type.bodyMd, { flex: 1 }]}>{h}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </Gutter>
        </Section>
      ) : null}

      {here.length > 0 && (
        <Section>
          <SectionHeader kicker="Go with us" title={`Journeys in ${d.name}`} />
          <Gutter style={{ gap: space.xl }}>{here.slice(0, 6).map((t) => <TourRow key={t.slug} tour={t} />)}</Gutter>
        </Section>
      )}

      <Section>
        <Gutter>
          <PrimaryButton label="Plan a trip here" onPress={() => router.push({ pathname: '/plan', params: { msg: `I'd like to visit ${d.name}.` } })} />
        </Gutter>
      </Section>

      {more.length > 0 && (
        <Section>
          <SectionHeader kicker={d.area} title="More like this" />
          <ChipRow>{more.map((m) => <DestinationCard key={m.name} d={m} width={180} height={230} />)}</ChipRow>
        </Section>
      )}
    </DetailLayout>
  );
}
