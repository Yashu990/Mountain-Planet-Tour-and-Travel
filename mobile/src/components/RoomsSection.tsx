// Room types of a partner listing, with live NPR prices shown in the traveller's currency.
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { colors, radius, space, squircle, type } from '@/theme';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/lib/currency';
import type { StayRoom } from '@/data/stays';
import { Card, Gutter, Section, SoftButton } from './ui';
import { BedIcon, CoffeeIcon, UsersIcon } from './icons';

export function useRooms(staySlug: string, enabled: boolean) {
  const [rooms, setRooms] = useState<StayRoom[] | null>(null);
  useEffect(() => {
    if (!enabled || !supabase) return;
    let alive = true;
    supabase
      .from('stay_rooms')
      .select('*')
      .eq('stay_slug', staySlug)
      .order('price_npr')
      .then(({ data }) => {
        if (alive) setRooms((data as StayRoom[]) ?? []);
      });
    return () => {
      alive = false;
    };
  }, [staySlug, enabled]);
  return rooms;
}

export function RoomsSection({ rooms, onChoose }: { rooms: StayRoom[]; onChoose: (room: StayRoom) => void }) {
  const { priceNpr } = useCurrency();
  if (!rooms.length) return null;
  return (
    <Section>
      <Gutter style={{ gap: space.md }}>
        <Text style={type.headlineMd}>Rooms</Text>
        {rooms.map((r) => (
          <Card key={r.id} style={{ gap: 10, padding: 14 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {r.images[0] ? <Image source={{ uri: r.images[0] }} style={{ width: 92, height: 92, borderRadius: radius.lg, ...squircle }} contentFit="cover" accessibilityLabel={r.name} /> : null}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={type.headlineSm}>{r.name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 }}>
                  <Fact icon={UsersIcon} text={`Up to ${r.max_guests}`} />
                  {r.beds ? <Fact icon={BedIcon} text={r.beds} /> : null}
                  {r.breakfast_included ? <Fact icon={CoffeeIcon} text="Breakfast" /> : null}
                </View>
                {r.description ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} numberOfLines={3}>{r.description}</Text> : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <Text style={[type.headlineMd, { color: colors.primary, flexShrink: 1 }]}>
                {priceNpr(r.price_npr)}
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}> /night</Text>
              </Text>
              <SoftButton label="Choose" onPress={() => onChoose(r)} />
            </View>
          </Card>
        ))}
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Prices are set by the property in Nepali rupees and shown in your currency at today’s rate.</Text>
      </Gutter>
    </Section>
  );
}

function Fact({ icon: I, text }: { icon: typeof BedIcon; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <I size={14} color={colors.onSurfaceVariant} />
      <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{text}</Text>
    </View>
  );
}
