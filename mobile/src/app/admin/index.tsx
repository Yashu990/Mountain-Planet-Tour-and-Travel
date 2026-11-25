// Staff panel — only for accounts with role = 'admin' (set in Supabase → profiles).
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, fonts, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { KIND_LABEL, STATUS_LABEL, type BookingKind, type BookingStatus } from '@/lib/bookings';
import { Card, Chip, ChipRow, Gutter, Kicker, Screen, SoftButton, Stars, TextButton } from '@/components/ui';
import { Segmented } from '@/components/form';
import { BackHeader } from '@/components/BackHeader';
import { BedIcon, ShieldCheckIcon, StorefrontIcon } from '@/components/icons';

type Tab = 'bookings' | 'enquiries' | 'stories' | 'reviews';
interface BRow { id: string; reference: string; kind: BookingKind; status: BookingStatus; name: string; email: string; start_date: string; end_date: string | null; guests: number; quote_usd: number | null; created_at: string; location: string | null; destination: string | null }
interface ERow { id: string; name: string; email: string; created_at: string; tour_slugs: string[]; budget: string | null; travellers: string | null; start_date: string | null; message: string | null; status: string }
interface SRow { id: string; name: string; country: string | null; trip: string | null; story: string; rating: number; photos: string[]; approved: boolean; created_at: string }
interface RRow { id: string; name: string; tour_slug: string | null; stay_slug: string | null; rating: number; text: string; approved: boolean; created_at: string }

const BOOKING_FILTERS: ('all' | BookingStatus)[] = ['all', 'requested', 'quoted', 'accepted', 'paid', 'confirmed', 'cancelled'];
const ago = (iso: string) => {
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
};

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const [tab, setTab] = useState<Tab>('bookings');
  const [filter, setFilter] = useState<'all' | BookingStatus>('requested');
  const [rows, setRows] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState<number | null>(null);
  const [listingsWaiting, setListingsWaiting] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      if (!supabase || !isAdmin) return;
      supabase.from('partners').select('id', { count: 'exact', head: true }).eq('status', 'submitted').then(({ count }) => setWaiting(count ?? 0));
      supabase.from('stays').select('slug', { count: 'exact', head: true }).eq('status', 'pending').then(({ count }) => setListingsWaiting(count ?? 0));
    }, [isAdmin]),
  );

  const load = useCallback(async () => {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    setError('');
    let q;
    if (tab === 'bookings') {
      q = supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(200);
      if (filter !== 'all') q = q.eq('status', filter);
    } else if (tab === 'enquiries') q = supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(200);
    else if (tab === 'stories') q = supabase.from('stories').select('*').eq('approved', false).order('created_at', { ascending: false }).limit(100);
    else q = supabase.from('reviews').select('*').eq('approved', false).order('created_at', { ascending: false }).limit(100);
    const { data, error: e } = await q;
    if (e) setError(e.message);
    setRows(data ?? []);
    setLoading(false);
  }, [tab, filter, isAdmin]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading data for the selected tab
    load();
  }, [load]);

  if (!user || !isAdmin) {
    return (
      <Screen>
        <BackHeader />
        <Gutter style={{ alignItems: 'center', marginTop: space.xxl, gap: space.md }}>
          <ShieldCheckIcon size={48} color={colors.onSurfaceVariant} weight="duotone" />
          <Text style={type.headlineMd}>Staff only</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Sign in with a staff account to manage bookings.</Text>
        </Gutter>
      </Screen>
    );
  }

  const moderate = async (table: 'stories' | 'reviews', id: string, approve: boolean) => {
    if (!supabase) return;
    const { error: e } = approve ? await supabase.from(table).update({ approved: true }).eq('id', id) : await supabase.from(table).delete().eq('id', id);
    if (e) Alert.alert('Could not update', e.message);
    load();
  };
  const setEnquiryStatus = async (id: string, status: string) => {
    if (!supabase) return;
    const { error: e } = await supabase.from('enquiries').update({ status }).eq('id', id);
    if (e) Alert.alert('Could not update', e.message);
    load();
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} tintColor={colors.primary} onRefresh={load} />}>
      <BackHeader />
      <Gutter style={{ marginTop: space.md, gap: space.md }}>
        <View>
          <Kicker>Mountain Planet team</Kicker>
          <Text style={[type.displayMd, { marginTop: 6 }]}>Staff panel</Text>
        </View>
        <Pressable onPress={() => router.push('/admin/partners')} accessibilityRole="button" accessibilityLabel="Partner applications">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <StorefrontIcon size={26} color={colors.secondary} weight="duotone" />
            <View style={{ flex: 1 }}>
              <Text style={type.headlineSm}>Partner applications</Text>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{waiting === null ? 'Hotels and homestays' : waiting === 0 ? 'Nothing waiting' : `${waiting} waiting for review`}</Text>
            </View>
            {waiting ? <View style={{ backgroundColor: colors.primary, borderRadius: radius.full, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}><Text style={[type.labelSm, { color: colors.onPrimary }]}>{waiting}</Text></View> : null}
          </Card>
        </Pressable>
        <Pressable onPress={() => router.push('/admin/listings')} accessibilityRole="button" accessibilityLabel="Partner listings">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <BedIcon size={26} color={colors.secondary} weight="duotone" />
            <View style={{ flex: 1 }}>
              <Text style={type.headlineSm}>Partner listings</Text>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{listingsWaiting === null ? 'Properties, rooms and prices' : listingsWaiting === 0 ? 'Nothing waiting' : `${listingsWaiting} waiting for review`}</Text>
            </View>
            {listingsWaiting ? <View style={{ backgroundColor: colors.primary, borderRadius: radius.full, minWidth: 26, height: 26, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}><Text style={[type.labelSm, { color: colors.onPrimary }]}>{listingsWaiting}</Text></View> : null}
          </Card>
        </Pressable>
        <Segmented value={tab} onChange={setTab} options={[{ value: 'bookings', label: 'Bookings' }, { value: 'enquiries', label: 'Trips' }, { value: 'stories', label: 'Stories' }, { value: 'reviews', label: 'Reviews' }]} />
      </Gutter>
      {tab === 'bookings' ? (
        <ChipRow style={{ marginTop: space.md }}>
          {BOOKING_FILTERS.map((f) => <Chip key={f} label={f === 'all' ? 'All' : STATUS_LABEL[f]} active={filter === f} onPress={() => setFilter(f)} />)}
        </ChipRow>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : error ? (
        <Gutter style={{ marginTop: space.lg }}><Text style={[type.bodySm, { color: colors.destructive }]}>{error}</Text></Gutter>
      ) : rows.length === 0 ? (
        <Gutter style={{ marginTop: space.xl }}><Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Nothing here right now.</Text></Gutter>
      ) : (
        <Gutter style={{ marginTop: space.lg, gap: space.md }}>
          {tab === 'bookings' &&
            (rows as BRow[]).map((b) => (
              <Pressable key={b.id} onPress={() => router.push({ pathname: '/admin/booking/[id]', params: { id: b.id } })} accessibilityRole="button">
                <Card style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, rowGap: 4 }}>
                    <Kicker>{KIND_LABEL[b.kind]} · {b.reference}</Kicker>
                    <Text style={[type.labelSm, { color: colors.primary }]}>{STATUS_LABEL[b.status]}</Text>
                  </View>
                  <Text style={type.headlineSm}>{b.name}</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
                    {b.start_date}{b.end_date ? ` → ${b.end_date}` : ''} · {b.guests} ppl{b.location ? ` · ${b.location}` : ''}{b.destination ? ` → ${b.destination}` : ''}
                  </Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontSize: 12 }]}>{ago(b.created_at)}{b.quote_usd != null ? ` · quoted $${b.quote_usd}` : ''}</Text>
                </Card>
              </Pressable>
            ))}
          {tab === 'enquiries' &&
            (rows as ERow[]).map((e) => (
              <Card key={e.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Kicker>Trip request · {ago(e.created_at)}</Kicker>
                  <Text style={[type.labelSm, { color: colors.primary }]}>{e.status}</Text>
                </View>
                <Text style={type.headlineSm}>{e.name}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} selectable>{e.email}</Text>
                <Text style={type.bodySm}>{e.tour_slugs.join(', ') || 'Custom trip'} · {e.travellers ?? '?'} ppl · {e.budget ?? ''} · {e.start_date ?? ''}</Text>
                {e.message ? <Text style={[type.bodySm, { fontFamily: fonts.sansMedium }]}>{e.message}</Text> : null}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {['replied', 'booked', 'closed'].map((s) => <TextButton key={s} label={`Mark ${s}`} arrow={false} onPress={() => setEnquiryStatus(e.id, s)} />)}
                </View>
              </Card>
            ))}
          {tab === 'stories' &&
            (rows as SRow[]).map((s) => (
              <Card key={s.id} style={{ gap: 6 }}>
                <Kicker>{s.trip || 'Story'} · {s.photos.length} photos · {ago(s.created_at)}</Kicker>
                <Text style={type.headlineSm}>{s.name}{s.country ? ` · ${s.country}` : ''}</Text>
                <Stars n={s.rating} />
                <Text style={type.bodySm}>{s.story}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  <SoftButton label="Approve" onPress={() => moderate('stories', s.id, true)} />
                  <TextButton label="Delete" arrow={false} onPress={() => moderate('stories', s.id, false)} />
                </View>
              </Card>
            ))}
          {tab === 'reviews' &&
            (rows as RRow[]).map((r) => (
              <Card key={r.id} style={{ gap: 6 }}>
                <Kicker>{r.tour_slug ?? r.stay_slug} · {ago(r.created_at)}</Kicker>
                <Text style={type.headlineSm}>{r.name}</Text>
                <Stars n={r.rating} />
                <Text style={type.bodySm}>{r.text}</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                  <SoftButton label="Approve" onPress={() => moderate('reviews', r.id, true)} />
                  <TextButton label="Delete" arrow={false} onPress={() => moderate('reviews', r.id, false)} />
                </View>
              </Card>
            ))}
        </Gutter>
      )}
      <View style={{ height: radius.xl }} />
    </Screen>
  );
}
