import { useState } from 'react';
import { Text } from 'react-native';
import { colors, space, type } from '@/theme';
import { destinations, type Area } from '@/data/destinations';
import { Chip, ChipRow, Gutter, Kicker, Screen, TextButton } from '@/components/ui';
import { router } from 'expo-router';
import { DestinationRow } from '@/components/cards';
import { BackHeader } from '@/components/BackHeader';
import { useContent } from '@/lib/content';

const AREAS: ('All' | Area)[] = ['All', 'Mountains', 'Culture', 'Wildlife'];

export default function Destinations() {
  useContent();
  const [area, setArea] = useState<'All' | Area>('All');
  const list = destinations.filter((d) => area === 'All' || d.area === area);
  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker>{destinations.length} places we run trips to</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>Real places, real heights</Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
          Every destination with the altitude of its high point and the months it is best visited.
        </Text>
      </Gutter>
      <Gutter style={{ marginTop: space.md, alignItems: 'flex-start' }}>
        <TextButton label="See all on the map" onPress={() => router.push('/map')} />
      </Gutter>
      <ChipRow style={{ marginTop: space.lg }}>
        {AREAS.map((a) => <Chip key={a} label={a === 'All' ? 'All places' : a} active={area === a} onPress={() => setArea(a)} />)}
      </ChipRow>
      <Gutter style={{ marginTop: space.lg, gap: space.xl }}>
        {list.map((d) => <DestinationRow key={d.name} d={d} />)}
      </Gutter>
    </Screen>
  );
}

