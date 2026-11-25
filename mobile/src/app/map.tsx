// Map of Nepal: destinations, stays, and trek routes.
import { useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { destinations, slug as destSlug } from '@/data/destinations';
import { stays } from '@/data/stays';
import { getTour } from '@/data/tours';
import { useContent } from '@/lib/content';
import { CITY_COORDS, DESTINATION_COORDS, TREK_ROUTES } from '@/lib/geo';
import { Chip, ChipRow, Gutter, Kicker, Screen, TextButton } from '@/components/ui';
import { Segmented } from '@/components/form';
import { MapView, type MapPin } from '@/components/MapView';
import { BackHeader } from '@/components/BackHeader';

type Layer = 'places' | 'stays' | 'treks';

export default function MapScreen() {
  const { version } = useContent();
  const params = useLocalSearchParams<{ layer?: Layer; route?: string }>();
  const { height } = useWindowDimensions();
  const [layer, setLayer] = useState<Layer>(params.layer ?? (params.route ? 'treks' : 'places'));
  const [route, setRoute] = useState(params.route ?? TREK_ROUTES[0].slug);

  const pins: MapPin[] = useMemo(() => {
    if (layer === 'places') {
      return destinations
        .filter((d) => DESTINATION_COORDS[d.name])
        .map((d) => ({ id: `d:${destSlug(d.name)}`, at: DESTINATION_COORDS[d.name], label: d.name, sub: ` · ${d.area} · ${d.alt}`, tone: d.area === 'Mountains' ? 'primary' : 'secondary' }));
    }
    if (layer === 'stays') {
      return stays
        .map((s) => ({ s, at: s.lat !== undefined && s.lng !== undefined ? ([s.lat, s.lng] as [number, number]) : CITY_COORDS[s.city] }))
        .filter((x) => x.at)
        .map(({ s, at }) => ({ id: `s:${s.slug}`, at, label: s.name, sub: ` · ${s.kind === 'homestay' ? 'Homestay' : 'Hotel'}${s.isSample ? ' (sample)' : ''}`, tone: s.kind === 'homestay' ? 'secondary' : 'primary' }));
    }
    return [];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  }, [layer, version]);

  const r = TREK_ROUTES.find((x) => x.slug === route) ?? TREK_ROUTES[0];
  const line = layer === 'treks' ? { points: r.points.map((p) => p.at), labels: r.points.map((p) => p.name) } : undefined;
  const open = (id: string) => {
    const [kind, key] = id.split(':');
    if (kind === 'd') router.push(`/destinations/${key}`);
    if (kind === 's') router.push(`/stays/${key}`);
  };
  const tour = getTour(r.slug);

  return (
    <Screen scrollEnabled={false} contentStyle={{ flexGrow: 1 }}>
      <BackHeader />
      <Gutter style={{ gap: space.md }}>
        <View>
          <Kicker>Explore Nepal</Kicker>
          <Text style={[type.displayMd, { marginTop: 6 }]}>Map</Text>
        </View>
        <Segmented value={layer} onChange={setLayer} options={[{ value: 'places', label: 'Places' }, { value: 'stays', label: 'Stays' }, { value: 'treks', label: 'Trek routes' }]} />
      </Gutter>
      {layer === 'treks' ? (
        <ChipRow style={{ marginTop: space.md, flexGrow: 0 }}>{TREK_ROUTES.map((x) => <Chip key={x.slug} label={x.name} active={x.slug === r.slug} onPress={() => setRoute(x.slug)} />)}</ChipRow>
      ) : null}
      <Gutter style={{ marginTop: space.md }}>
        <MapView key={`${layer}-${r.slug}`} pins={pins} line={line} onOpen={open} style={{ height: Math.max(360, height * 0.55) }} />
        {layer === 'treks' ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm }}>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant, flex: 1 }]}>{r.points.length} stops · approximate route</Text>
            {tour ? <TextButton label="View trek" onPress={() => router.push(`/tour/${tour.slug}`)} /> : null}
          </View>
        ) : (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: space.sm }]}>Tap a pin, then “Open”.</Text>
        )}
      </Gutter>
    </Screen>
  );
}
