import { useI18n } from '@/lib/i18n';
// My trip: everything for the journey in one place, and it keeps working offline —
// upcoming bookings (cached), a day-by-day itinerary you can tick off, emergency numbers.
import { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { colors, fonts, radius, space, type } from '@/theme';
import { tours, CONTACT, type Tour } from '@/data/tours';
import { useStore } from '@/lib/store';
import { useContent } from '@/lib/content';
import { KIND_LABEL, STATUS_LABEL, useMyBookings } from '@/lib/bookings';
import { routeFor } from '@/lib/geo';
import { fmtDate } from '@/components/DateField';
import { Card, Chip, ChipRow, Gutter, Kicker, Screen, Section, SectionHeader, SoftButton, StepNumeral, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { CheckIcon, MapPinIcon, PhoneIcon, ReceiptIcon, SunIcon } from '@/components/icons';

const DONE_KEY = 'mpn-trip-done';
const TOUR_KEY = 'mpn-trip-tour';

const daysUntil = (iso: string) => Math.ceil((new Date(iso + 'T00:00:00').getTime() - Date.now()) / 86400000);

export default function MyTrip() {
  const { version } = useContent();
  const { t } = useI18n();
  const { saved } = useStore();
  const { items } = useMyBookings();
  const [tourSlug, setTourSlug] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.multiGet([DONE_KEY, TOUR_KEY])
      .then(([[, d], [, t]]) => {
        if (d) setDone(JSON.parse(d));
        if (t) setTourSlug(t);
      })
      .catch(() => {});
  }, []);

  const upcoming = items
    .filter((b) => ['requested', 'quoted', 'accepted', 'paid', 'confirmed'].includes(b.status) && daysUntil(b.startDate) >= -30)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const next = upcoming.find((b) => daysUntil(b.startDate) >= 0);

  // Trips to show itineraries for: saved ones first, else the classics.
  const choices: Tour[] = useMemo(() => {
    const s = saved.map((x) => tours.find((t) => t.slug === x)).filter(Boolean) as Tour[];
    return s.length ? s : tours.slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  }, [saved, version]);
  const tour = choices.find((t) => t.slug === tourSlug) ?? choices[0];

  const pick = (slug: string) => {
    setTourSlug(slug);
    AsyncStorage.setItem(TOUR_KEY, slug).catch(() => {});
  };
  const toggle = (key: string) => {
    const nextDone = done.includes(key) ? done.filter((k) => k !== key) : [...done, key];
    setDone(nextDone);
    AsyncStorage.setItem(DONE_KEY, JSON.stringify(nextDone)).catch(() => {});
  };

  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker>Works offline</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>{t('trip.title')}</Text>
      </Gutter>

      {/* countdown */}
      <Gutter style={{ marginTop: space.lg }}>
        {next ? (
          <Card style={{ gap: 6 }}>
            <Kicker style={{ color: colors.primary }}>Next up · {KIND_LABEL[next.kind]}</Kicker>
            <Text style={type.headlineLg}>{next.title}</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
              {fmtDate(new Date(next.startDate + 'T00:00:00'))} · {daysUntil(next.startDate) === 0 ? 'today' : `in ${daysUntil(next.startDate)} days`} · {STATUS_LABEL[next.status]}
            </Text>
            {next.reference ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} selectable>{next.reference}</Text> : null}
          </Card>
        ) : (
          <Card style={{ gap: 8 }}>
            <Text style={type.headlineMd}>No upcoming bookings yet</Text>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Your hotel, ride and flight bookings appear here — and stay available without signal.</Text>
            <TextButton label="Book something" onPress={() => router.navigate('/')} style={{ alignSelf: 'flex-start', marginLeft: -4 }} />
          </Card>
        )}
      </Gutter>

      {upcoming.length > 1 ? (
        <Section>
          <SectionHeader kicker="Booked" title="All your bookings" action="Manage" onAction={() => router.push('/bookings')} />
          <Gutter style={{ gap: 10 }}>
            {upcoming.map((b) => (
              <View key={b.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <ReceiptIcon size={20} color={colors.secondary} weight="duotone" />
                <View style={{ flex: 1 }}>
                  <Text style={type.labelMd}>{b.title}</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>{b.startDate}{b.endDate ? ` → ${b.endDate}` : ''} · {STATUS_LABEL[b.status]}</Text>
                </View>
              </View>
            ))}
          </Gutter>
        </Section>
      ) : null}

      {/* itinerary */}
      {tour ? (
        <Section>
          <SectionHeader kicker="Day by day" title="Itinerary" />
          {choices.length > 1 ? <ChipRow>{choices.map((t) => <Chip key={t.slug} label={t.title} active={t.slug === tour.slug} onPress={() => pick(t.slug)} />)}</ChipRow> : null}
          <Gutter style={{ marginTop: space.md, gap: space.md }}>
            {tour.itinerary.map((d, i) => {
              const key = `${tour.slug}:${i}`;
              const on = done.includes(key);
              return (
                <Pressable key={key} onPress={() => toggle(key)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                  <StepNumeral n={i + 1} />
                  <View style={{ flex: 1, paddingTop: 6 }}>
                    <Kicker>{d.day}</Kicker>
                    <Text style={[type.bodyMd, { marginTop: 4, color: on ? colors.onSurfaceVariant : colors.onSurface, textDecorationLine: on ? 'line-through' : 'none' }]}>{d.title}</Text>
                  </View>
                  <View style={{ width: 24, height: 24, marginTop: 8, borderRadius: radius.full, borderWidth: 1.5, borderColor: on ? colors.secondary : colors.border, backgroundColor: on ? colors.secondary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <CheckIcon size={14} color="#fff" weight="bold" /> : null}
                  </View>
                </Pressable>
              );
            })}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {routeFor(tour.slug) ? <SoftButton label="Route map" icon={MapPinIcon} onPress={() => router.push({ pathname: '/map', params: { route: tour.slug } })} /> : null}
              <SoftButton label="Trek tools" icon={SunIcon} onPress={() => router.push('/tools')} />
            </View>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>Tick off each day as you go. Maps and weather need a connection; everything else here works offline.</Text>
          </Gutter>
        </Section>
      ) : null}

      {/* essentials */}
      <Section>
        <SectionHeader kicker="Keep handy" title="If you need help" />
        <Gutter style={{ gap: 10 }}>
          {[
            ['Tourist Police', '1144'],
            ['Ambulance', '102'],
            ...(CONTACT.phone ? [['Mountain Planet 24/7', CONTACT.phone]] : []),
          ].map(([label, num]) => (
            <Pressable key={label} onPress={() => Linking.openURL(`tel:${num.replace(/[^\d+]/g, '')}`)} accessibilityRole="button" accessibilityLabel={`Call ${label}`}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 }}>
                <PhoneIcon size={20} color={colors.destructive} weight="fill" />
                <Text style={[type.labelMd, { flex: 1, fontFamily: fonts.sansSemi }]}>{label}</Text>
                <Text style={[type.headlineSm, { color: colors.destructive }]}>{num}</Text>
              </Card>
            </Pressable>
          ))}
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Office: {CONTACT.address} · {CONTACT.email}</Text>
        </Gutter>
      </Section>
    </Screen>
  );
}
