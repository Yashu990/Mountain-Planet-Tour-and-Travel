import { CurrencyPicker } from '@/components/CurrencyPicker';
import { useLayoutWidth } from '@/lib/layout';
import { LanguagePicker } from '@/components/LanguagePicker';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { colors, radius, space, squircle, type } from '@/theme';
import { brand, img } from '@/lib/images';
import { Card, Gutter, Kicker, PrimaryButton, Screen, Section, SectionHeader, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { ContactCard } from '@/components/ContactCard';
import { CompassIcon, HandshakeIcon, LeafIcon, ShieldCheckIcon, type Icon } from '@/components/icons';

const values: { icon: Icon; h: string; p: string }[] = [
  { icon: CompassIcon, h: 'Local expertise', p: 'Native guides who know every trail, teahouse and festival.' },
  { icon: ShieldCheckIcon, h: 'Safety first', p: 'Licensed, first-aid trained guides, acclimatisation built in, 24/7 support.' },
  { icon: LeafIcon, h: 'Responsible tourism', p: 'Fair porter wages, proper gear for staff, and zero-waste practices.' },
  { icon: HandshakeIcon, h: 'Truly tailor-made', p: 'Your dates, your pace, your comfort level — every trip is personal.' },
];

export default function About() {
  const width = useLayoutWidth();
  const w = width - space.gutter * 2;
  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Image source={brand.mark} style={{ width: 96, height: 56 }} contentFit="contain" accessibilityLabel="Mountain Planet" />
        <Kicker style={{ marginTop: space.lg }}>Our story</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>Born beneath the world’s highest peaks</Text>
        <Text style={[type.bodyMd, { marginTop: space.md }]}>
          Mountain Planet Nepal is a Kathmandu-based trekking and tour company built by people who call the Himalaya home. We believe heaven might be a myth — but the Himalayas are real, and everyone deserves to stand among them.
        </Text>
        <Text style={[type.bodyMd, { marginTop: space.md, color: colors.onSurfaceVariant }]}>
          From first-time hikers on Poon Hill to climbers chasing their first 6,000m summit, we design journeys that are safe, personal and deeply connected to the people and cultures of Nepal.
        </Text>
      </Gutter>

      <Gutter style={{ marginTop: space.section, flexDirection: 'row', gap: space.sm }}>
        <Image source={img('/img/people.jpg')} style={{ width: w * 0.58, height: 260, borderRadius: radius.xl, ...squircle }} contentFit="cover" accessibilityLabel="Local Himalayan people" />
        <View style={{ flex: 1, gap: space.sm }}>
          <Image source={img('/img/bridge.jpg')} style={{ flex: 1, borderRadius: radius.xl, ...squircle }} contentFit="cover" accessibilityLabel="Trekker on a suspension bridge" />
          <Image source={img('/img/kathmandu.jpg')} style={{ flex: 1, borderRadius: radius.xl, ...squircle }} contentFit="cover" accessibilityLabel="Boudhanath stupa" />
        </View>
      </Gutter>

      <Section>
        <SectionHeader kicker="What we stand for" title="Our promise" />
        <Gutter style={{ gap: space.md }}>
          {values.map((v) => (
            <Card key={v.h} style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start' }}>
              <v.icon size={26} color={colors.secondary} weight="duotone" />
              <View style={{ flex: 1 }}>
                <Text style={type.headlineSm}>{v.h}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{v.p}</Text>
              </View>
            </Card>
          ))}
        </Gutter>
      </Section>

      <Section>
        <Gutter>
          <LanguagePicker />
          <View style={{ height: space.lg }} />
          <CurrencyPicker />
        </Gutter>
      </Section>

      <Section>
        <Gutter>
          <ContactCard />
        </Gutter>
      </Section>

      <Section>
        <Gutter style={{ alignItems: 'center' }}>
          <Kicker>Ready when you are</Kicker>
          <Text style={[type.headlineLg, { marginTop: 8, textAlign: 'center' }]}>Let’s plan your Himalayan story</Text>
          <PrimaryButton label="Plan a trip" onPress={() => router.push('/plan')} style={{ marginTop: space.lg, alignSelf: 'stretch' }} />
          <TextButton label="Browse journeys" onPress={() => router.navigate('/explore')} style={{ marginTop: space.md }} />
          <View style={{ flexDirection: 'row', gap: space.lg, marginTop: space.lg }}>
            <TextButton label="Privacy policy" arrow={false} onPress={() => router.push('/legal/privacy')} />
            <TextButton label="Terms" arrow={false} onPress={() => router.push('/legal/terms')} />
          </View>
        </Gutter>
      </Section>
    </Screen>
  );
}
