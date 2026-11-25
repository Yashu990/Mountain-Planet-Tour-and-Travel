// Privacy policy and terms, required by the App Store and Google Play.
// The text lives in src/data/legal.ts so the website shows the same words.
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { CONTACT } from '@/data/tours';
import { LEGAL_UPDATED, privacySections, termsSections } from '@/data/legal';
import { Gutter, Kicker, Screen } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';

export default function Legal() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const privacy = doc !== 'terms';
  const sections = privacy ? privacySections(CONTACT) : termsSections();
  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md, gap: space.lg }}>
        <View>
          <Kicker>Mountain Planet Nepal</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>{privacy ? 'Privacy policy' : 'Terms of use'}</Text>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 6 }]}>Last updated {LEGAL_UPDATED}</Text>
        </View>
        {sections.map(([h, p]) => (
          <View key={h} style={{ gap: 6 }}>
            <Text style={type.headlineSm}>{h}</Text>
            <Text style={type.bodyMd}>{p}</Text>
          </View>
        ))}
      </Gutter>
    </Screen>
  );
}
