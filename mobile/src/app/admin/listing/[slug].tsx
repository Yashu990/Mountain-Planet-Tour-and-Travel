// Staff: review a partner listing — photos, details, rooms & prices — then approve, send back or hide.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { getListingForStaff, LISTING_STATUS, reviewListing, type Listing } from '@/lib/listings';
import { useCurrency } from '@/lib/currency';
import type { StayRoom } from '@/data/stays';
import { Callout, Card, Field, Gutter, Kicker, PrimaryButton, Screen, SoftButton, TagChip } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { InfoIcon } from '@/components/icons';

export default function StaffListingDetail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { isAdmin } = useAuth();
  const { priceNpr } = useCurrency();
  const [data, setData] = useState<{ listing: Listing; rooms: StayRoom[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getListingForStaff(slug));
    setLoading(false);
  }, [slug]);
  useFocusEffect(
    useCallback(() => {
      if (isAdmin) load();
    }, [isAdmin, load]),
  );

  if (!isAdmin) return <Screen><BackHeader /><Gutter><Text style={type.bodyMd}>Staff only.</Text></Gutter></Screen>;
  if (loading || !data) return <Screen><BackHeader /><ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} /></Screen>;
  const { listing: l, rooms } = data;

  const decide = (decision: 'live' | 'rejected' | 'paused') => {
    if (decision === 'rejected' && note.trim().length < 5) {
      Alert.alert('Add a note', 'Tell the partner what to change, e.g. “Please add a photo of a bathroom”.');
      return;
    }
    const title = decision === 'live' ? 'Make this listing live?' : decision === 'rejected' ? 'Send back for changes?' : 'Hide this listing?';
    const body = decision === 'live' ? 'Travellers will see it in Hotels & homestays straight away.' : decision === 'rejected' ? note.trim() : 'It disappears from the app until it is approved again.';
    Alert.alert(title, body, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: decision === 'live' ? 'Go live' : decision === 'rejected' ? 'Send back' : 'Hide',
        style: decision === 'live' ? 'default' : 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await reviewListing(l.slug, decision, note.trim() || undefined);
            router.back();
          } catch (e) {
            Alert.alert('Could not save', e instanceof Error ? e.message : '');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md, gap: 6 }}>
        <Kicker>{l.kind === 'homestay' ? 'Homestay' : 'Hotel'} · {LISTING_STATUS[l.status]}</Kicker>
        <Text style={type.displayMd}>{l.name}</Text>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{[l.address, l.city].filter(Boolean).join(', ')}</Text>
      </Gutter>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: space.gutter, marginTop: space.lg }} style={{ flexGrow: 0 }}>
        {l.images.map((u, i) => <Image key={u} source={{ uri: u }} style={{ width: 200, height: 140, borderRadius: radius.lg }} contentFit="cover" accessibilityLabel={`Photo ${i + 1}`} />)}
      </ScrollView>

      <Gutter style={{ marginTop: space.lg, gap: space.md }}>
        {l.images.length < 3 ? <Callout icon={InfoIcon}>{`Only ${l.images.length} photo(s).`}</Callout> : null}
        <Card style={{ gap: 10 }}>
          <Text style={type.headlineSm}>Description</Text>
          <Text style={type.bodyMd}>{l.description || '—'}</Text>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
            {l.star_rating ? `${l.star_rating}★ · ` : ''}Check-in {l.check_in_time ?? '—'} · Check-out {l.check_out_time ?? '—'}{l.free_cancellation ? ' · Free cancellation' : ''}
          </Text>
          {l.house_rules ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{l.house_rules}</Text> : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{l.amenities.map((a) => <TagChip key={a} label={a} />)}</View>
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={type.headlineSm}>Rooms and prices</Text>
          {rooms.length === 0 ? <Text style={[type.bodySm, { color: colors.destructive }]}>No rooms yet.</Text> : null}
          {rooms.map((r) => (
            <View key={r.id} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {r.images[0] ? <Image source={{ uri: r.images[0] }} style={{ width: 52, height: 52, borderRadius: radius.md }} contentFit="cover" /> : null}
              <View style={{ flex: 1 }}>
                <Text style={type.labelMd}>{r.name}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{r.units} × · up to {r.max_guests}{r.beds ? ` · ${r.beds}` : ''}{r.breakfast_included ? ' · breakfast' : ''}</Text>
              </View>
              <Text style={[type.labelMd, { color: colors.primary }]}>Rs {r.price_npr.toLocaleString('en-IN')}</Text>
            </View>
          ))}
          {l.price_from_npr ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Travellers see “from {priceNpr(l.price_from_npr)}”.</Text> : null}
        </Card>

        {l.review_note ? <Callout icon={InfoIcon}>{`Last note to partner: “${l.review_note}”`}</Callout> : null}

        {l.status === 'pending' ? (
          <>
            <Field label="Note to partner (needed to send back)" value={note} onChangeText={setNote} placeholder="e.g. Please add a photo of a bathroom" multiline />
            <PrimaryButton label={busy ? 'Saving…' : 'Approve — go live'} onPress={() => decide('live')} disabled={busy} />
            <SoftButton label="Send back for changes" onPress={() => decide('rejected')} style={{ alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 14 }} />
          </>
        ) : l.status === 'live' ? (
          <SoftButton label="Hide from the app" onPress={() => decide('paused')} style={{ alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 14 }} />
        ) : (
          <Callout icon={InfoIcon}>{l.status === 'draft' ? 'The partner hasn’t sent this listing yet.' : `Status: ${LISTING_STATUS[l.status]}.`}</Callout>
        )}
      </Gutter>
    </Screen>
  );
}
