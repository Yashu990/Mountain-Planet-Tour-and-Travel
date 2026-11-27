import { useI18n } from '@/lib/i18n';
// Trek tools: mountain weather, altitude-sickness check, packing list, emergency numbers.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, fonts, radius, space, squircle, type } from '@/theme';
import { CONTACT } from '@/data/tours';
import { Callout, Card, Chip, ChipRow, Gutter, Kicker, Screen, Section, SectionHeader } from '@/components/ui';
import { Segmented } from '@/components/form';
import { BackHeader } from '@/components/BackHeader';
import { CheckIcon, InfoIcon, PhoneIcon } from '@/components/icons';

/* ---------- weather (Open-Meteo, free, no key) ---------- */
const PLACES = [
  { name: 'Kathmandu', lat: 27.7172, lon: 85.324, alt: 1400 },
  { name: 'Pokhara', lat: 28.2096, lon: 83.9856, alt: 822 },
  { name: 'Lukla', lat: 27.687, lon: 86.7314, alt: 2860 },
  { name: 'Namche Bazaar', lat: 27.8048, lon: 86.7101, alt: 3440 },
  { name: 'Everest Base Camp', lat: 28.0026, lon: 86.8528, alt: 5364 },
  { name: 'Annapurna Base Camp', lat: 28.5306, lon: 83.8781, alt: 4130 },
  { name: 'Jomsom', lat: 28.7804, lon: 83.724, alt: 2720 },
  { name: 'Langtang (Kyanjin)', lat: 28.2113, lon: 85.5622, alt: 3870 },
  { name: 'Chitwan (Sauraha)', lat: 27.5793, lon: 84.4935, alt: 150 },
];
const WMO: Record<number, string> = { 0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Cloudy', 45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle', 61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains', 80: 'Showers', 81: 'Showers', 82: 'Heavy showers', 85: 'Snow showers', 86: 'Snow showers', 95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm' };
interface Day { date: string; code: number; max: number; min: number; rain: number }

function Weather() {
  const [place, setPlace] = useState(PLACES[0]);
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset while the new forecast loads
    setDays(null);
    setError('');
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&elevation=${place.alt}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKathmandu&forecast_days=5`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        const t = d?.daily;
        if (!t?.time) throw new Error('no data');
        setDays(t.time.map((date: string, i: number) => ({ date, code: t.weather_code[i], max: t.temperature_2m_max[i], min: t.temperature_2m_min[i], rain: t.precipitation_probability_max?.[i] ?? 0 })));
      })
      .catch(() => alive && setError('Could not load the forecast. Check your connection.'));
    return () => {
      alive = false;
    };
  }, [place]);
  return (
    <Section>
      <SectionHeader kicker="5-day forecast" title="Mountain weather" />
      <ChipRow>{PLACES.map((p) => <Chip key={p.name} label={p.name} active={p.name === place.name} onPress={() => setPlace(p)} />)}</ChipRow>
      <Gutter style={{ marginTop: space.md }}>
        <Card style={{ gap: 12 }}>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{place.name} · {place.alt.toLocaleString('en-US')} m</Text>
          {error ? <Text style={[type.bodySm, { color: colors.destructive }]}>{error}</Text> : !days ? <ActivityIndicator color={colors.primary} /> : days.map((d) => (
            <View key={d.date} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={[type.labelMd, { width: 64 }]}>{new Date(d.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</Text>
              <Text style={[type.bodySm, { flex: 1 }]}>{WMO[d.code] ?? '—'}{d.rain ? ` · ${d.rain}% rain` : ''}</Text>
              <Text style={[type.labelMd, { fontFamily: fonts.sansSemi }]}>{Math.round(d.max)}° / {Math.round(d.min)}°</Text>
            </View>
          ))}
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 11 }]}>Forecast by Open-Meteo. Mountain weather changes fast — always follow your guide.</Text>
        </Card>
      </Gutter>
    </Section>
  );
}

/* ---------- altitude sickness check (Lake Louise style self-check) ---------- */
const SYMPTOMS = [
  { key: 'headache', label: 'Headache' },
  { key: 'stomach', label: 'Nausea / poor appetite' },
  { key: 'fatigue', label: 'Tired / weak' },
  { key: 'dizzy', label: 'Dizzy / light-headed' },
];
const LEVELS = ['None', 'Mild', 'Moderate', 'Severe'];

function Altitude() {
  const [score, setScore] = useState<Record<string, number>>({});
  const [danger, setDanger] = useState(false);
  const total = Object.values(score).reduce((a, b) => a + b, 0);
  const result = danger
    ? { tone: 'bad', text: 'Confusion, trouble walking, breathlessness at rest or a wet cough can be serious (HACE / HAPE). Descend now with your guide and get medical help.' }
    : (score.headache ?? 0) >= 1 && total >= 3
      ? total >= 6
        ? { tone: 'bad', text: 'Your answers suggest moderate–severe altitude sickness. Do not go higher. Descend, rest, and tell your guide right away.' }
        : { tone: 'warn', text: 'Your answers suggest mild altitude sickness. Do not go higher today. Rest, drink water, and tell your guide. If it gets worse, descend.' }
      : { tone: 'ok', text: 'No clear signs of altitude sickness. Keep climbing slowly (“bistarai”), drink 3–4 litres a day and avoid alcohol.' };
  return (
    <Section>
      <SectionHeader kicker="Quick self-check" title="Altitude sickness" />
      <Gutter style={{ gap: space.md }}>
        {SYMPTOMS.map((s) => (
          <View key={s.key} style={{ gap: 8 }}>
            <Text style={type.headlineSm}>{s.label}</Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              {LEVELS.map((l, i) => <Chip key={l} label={l} active={(score[s.key] ?? 0) === i} onPress={() => setScore({ ...score, [s.key]: i })} />)}
            </View>
          </View>
        ))}
        <Pressable onPress={() => setDanger((d) => !d)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }} accessibilityRole="checkbox" accessibilityState={{ checked: danger }}>
          <View style={{ width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1.5, borderColor: danger ? colors.destructive : colors.onSurfaceVariant, backgroundColor: danger ? colors.destructive : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{danger ? <CheckIcon size={14} color="#fff" weight="bold" /> : null}</View>
          <Text style={[type.bodySm, { flex: 1 }]}>Confused, unsteady walking, or short of breath even when resting</Text>
        </Pressable>
        <View style={{ padding: 16, borderRadius: radius.md, backgroundColor: result.tone === 'ok' ? 'rgba(51,51,51,0.10)' : 'rgba(196,112,85,0.12)', ...squircle }}>
          <Text style={[type.bodySm, { fontFamily: fonts.sansMedium, color: result.tone === 'ok' ? colors.secondary : colors.destructive }]}>{result.text}</Text>
        </View>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>This is a guide, not medical advice. When in doubt, go down.</Text>
      </Gutter>
    </Section>
  );
}

/* ---------- packing list ---------- */
const PACKING: Record<string, string[]> = {
  Trek: ['Broken-in hiking boots', 'Down jacket', 'Fleece mid-layer', 'Waterproof shell', 'Thermal base layers', '4-season sleeping bag (rentable)', 'Trekking poles', 'Sunglasses + SPF 50', 'Headlamp', 'Water bottle + purification', 'Small first-aid kit', 'Passport copies + photos for permits', 'Travel insurance (rescue to 6,000 m)', 'Cash in NPR for teahouses'],
  City: ['Comfortable walking shoes', 'Light layers', 'Scarf / cover for temples', 'Reusable water bottle', 'Universal adapter (Type C/D/M)', 'Cash + card', 'Phone SIM (Ncell / NTC)'],
  Jungle: ['Neutral-coloured clothes', 'Long sleeves + trousers', 'Insect repellent', 'Binoculars', 'Hat + sunscreen', 'Light rain jacket'],
};
const PACK_KEY = 'mpn-packing';

function Packing() {
  const [kind, setKind] = useState<'Trek' | 'City' | 'Jungle'>('Trek');
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(PACK_KEY).then((v) => v && setDone(JSON.parse(v))).catch(() => {});
  }, []);
  const toggle = (item: string) => {
    const next = done.includes(item) ? done.filter((x) => x !== item) : [...done, item];
    setDone(next);
    AsyncStorage.setItem(PACK_KEY, JSON.stringify(next)).catch(() => {});
  };
  const list = PACKING[kind];
  const packed = list.filter((x) => done.includes(x)).length;
  return (
    <Section>
      <SectionHeader kicker={`${packed}/${list.length} packed`} title="Packing list" />
      <Gutter style={{ gap: space.md }}>
        <Segmented value={kind} onChange={setKind} options={[{ value: 'Trek', label: 'Trek' }, { value: 'City', label: 'City' }, { value: 'Jungle', label: 'Jungle' }]} />
        <Card style={{ gap: 4, paddingVertical: 12 }}>
          {list.map((item) => {
            const on = done.includes(item);
            return (
              <Pressable key={item} onPress={() => toggle(item)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                <View style={{ width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1.5, borderColor: on ? colors.secondary : colors.onSurfaceVariant, backgroundColor: on ? colors.secondary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{on ? <CheckIcon size={14} color="#fff" weight="bold" /> : null}</View>
                <Text style={[type.bodyMd, { flex: 1, color: on ? colors.onSurfaceVariant : colors.onSurface, textDecorationLine: on ? 'line-through' : 'none' }]}>{item}</Text>
              </Pressable>
            );
          })}
        </Card>
      </Gutter>
    </Section>
  );
}

/* ---------- SOS ---------- */
const SOS = [
  { label: 'Tourist Police', number: '1144' },
  { label: 'Police', number: '100' },
  { label: 'Ambulance', number: '102' },
  { label: 'Fire', number: '101' },
];

function Emergency() {
  const phone = CONTACT.phone;
  return (
    <Section>
      <SectionHeader kicker="Nepal" title="Emergency numbers" />
      <Gutter style={{ gap: space.md }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {SOS.map((s) => (
            <Pressable key={s.number} onPress={() => Linking.openURL(`tel:${s.number}`)} accessibilityRole="button" accessibilityLabel={`Call ${s.label} ${s.number}`} style={({ pressed }) => [{ width: '47%', flexGrow: 1, padding: 16, borderRadius: radius.lg, backgroundColor: 'rgba(196,112,85,0.10)', gap: 4, ...squircle }, pressed && { opacity: 0.7 }]}>
              <PhoneIcon size={20} color={colors.destructive} weight="fill" />
              <Text style={[type.headlineMd, { color: colors.destructive }]}>{s.number}</Text>
              <Text style={type.bodySm}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
        {phone ? (
          <Pressable onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)} accessibilityRole="button">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <PhoneIcon size={22} color={colors.secondary} weight="duotone" />
              <View style={{ flex: 1 }}>
                <Text style={type.headlineSm}>Mountain Planet 24/7</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{phone}</Text>
              </View>
            </Card>
          </Pressable>
        ) : null}
        <Callout icon={InfoIcon}>On a trek, tell your guide first — they carry a satellite or local phone and coordinate helicopter rescue through your insurance.</Callout>
      </Gutter>
    </Section>
  );
}

export default function Tools() {
  const { t } = useI18n();
  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker>On the trail</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>{t('tools.title')}</Text>
      </Gutter>
      <Emergency />
      <Weather />
      <Altitude />
      <Packing />
    </Screen>
  );
}
