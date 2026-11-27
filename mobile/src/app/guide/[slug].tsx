import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { getGuide, guides, tours } from '@/data/tours';
import { askAgent, shareLink } from '@/lib/store';
import { DetailLayout } from '@/components/DetailLayout';
import { Card, Gutter, Hairline, Kicker, Meta, PrimaryButton, Section, SectionHeader, SoftButton, StepNumeral, Carousel, useCardWidth, useHalfCardWidth } from '@/components/ui';
import { GuideCard, TourTile } from '@/components/cards';
import { ClockIcon, ShareNetworkIcon, SparkleIcon } from '@/components/icons';
import NotFound from '@/components/NotFound';
import { useContent } from '@/lib/content';

export default function GuideDetail() {
  const cardW = useCardWidth(0.88);
  const halfW = useHalfCardWidth();
  useContent();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const g = getGuide(slug ?? '');
  if (!g) return <NotFound />;

  return (
    <DetailLayout image={g.img} imageLabel={g.title} actions={[{ icon: ShareNetworkIcon, label: 'Share', onPress: () => shareLink(`/guide/${g.slug}`, g.title) }]}>
      <Gutter>
        <Kicker style={{ color: colors.primary }}>{g.kicker}</Kicker>
        <Text style={[type.displayLg, { marginTop: 10 }]}>{g.title}</Text>
        <View style={{ marginTop: 12 }}><Meta icon={ClockIcon}>{g.minutes} min read · Mountain Planet Nepal</Meta></View>
        <Hairline style={{ marginTop: space.lg }} />
        <Text style={[type.headlineMd, { marginTop: space.lg, lineHeight: 30 }]}>{g.intro}</Text>
      </Gutter>

      <Section>
        <Gutter style={{ gap: space.xl }}>
          {g.sections.map((s, i) => (
            <View key={s.h} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <StepNumeral n={i + 1} />
              <View style={{ flex: 1, paddingTop: 6 }}>
                <Text style={type.headlineSm}>{s.h}</Text>
                <Text style={[type.bodyMd, { marginTop: 6 }]}>{s.p}</Text>
              </View>
            </View>
          ))}
        </Gutter>
      </Section>

      <Section>
        <Gutter>
          <Card style={{ alignItems: 'flex-start', gap: 12 }}>
            <SparkleIcon size={28} color={colors.primary} weight="duotone" />
            <Text style={type.headlineLg}>Still have questions?</Text>
            <SoftButton label="Ask Planet AI" icon={SparkleIcon} onPress={() => askAgent(g.title)} />
          </Card>
          <PrimaryButton label="Talk to our team" onPress={() => router.push('/plan')} style={{ marginTop: space.lg }} />
        </Gutter>
      </Section>

      <Section>
        <SectionHeader kicker="Keep reading" title="More guides" />
        <Carousel itemWidth={cardW}>{guides.filter((x) => x.slug !== g.slug).map((x) => <GuideCard key={x.slug} g={x} width={cardW} />)}</Carousel>
      </Section>

      <Section>
        <SectionHeader kicker="Popular journeys" title="Keep exploring" />
        <Carousel itemWidth={halfW}>{tours.slice(0, 6).map((t) => <TourTile key={t.slug} tour={t} width={halfW} />)}</Carousel>
      </Section>
    </DetailLayout>
  );
}
