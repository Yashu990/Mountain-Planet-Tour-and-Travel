// Staff: view one booking, send a price, change status, add a note for the customer.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { KIND_LABEL, STATUS_LABEL, type BookingStatus } from '@/lib/bookings';
import { Callout, Card, Chip, ChipRow, Field, Gutter, Hairline, Kicker, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { InfoIcon } from '@/components/icons';

const STATUSES: BookingStatus[] = ['requested', 'quoted', 'accepted', 'paid', 'confirmed', 'completed', 'cancelled'];

// Free-form row from the bookings table.
type Row = Record<string, any>;

export default function AdminBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const { toast } = useStore();
  const [b, setB] = useState<Row | null>(null);
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<BookingStatus>('requested');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase || !isAdmin || !id) return;
    supabase.from('bookings').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setB(data);
      setPrice(data.quote_usd != null ? String(data.quote_usd) : '');
      setNote(data.team_note ?? '');
      setStatus(data.status);
    });
  }, [id, isAdmin]);

  if (!isAdmin) return <Screen><BackHeader /><Gutter><Text style={type.bodyMd}>Staff only.</Text></Gutter></Screen>;
  if (!b) return <Screen><BackHeader /><ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} /></Screen>;

  const save = async () => {
    if (!supabase) return;
    const body: Record<string, unknown> = { id: b.id, teamNote: note, status };
    if (price.trim()) {
      const n = Number(price.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(n) || n <= 0) return setError('Enter the price in US dollars, e.g. 240.');
      body.quoteUsd = n;
      if (status === 'requested') body.status = 'quoted';
    }
    setBusy(true);
    setError('');
    const { error: e } = await supabase.functions.invoke('admin-update-booking', { body });
    setBusy(false);
    if (e) return setError('Could not save. Check your connection and try again.');
    toast('Saved — customer notified');
    router.back();
  };

  const details = Object.entries((b.details ?? {}) as Record<string, unknown>);
  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md, gap: space.md }}>
        <View>
          <Kicker>{KIND_LABEL[b.kind as keyof typeof KIND_LABEL]} · {b.reference}</Kicker>
          <Text style={[type.displayMd, { marginTop: 6 }]}>{b.name}</Text>
        </View>
        <Card style={{ gap: 8 }}>
          <Text style={type.bodyMd} selectable>{b.email}{b.phone ? ` · ${b.phone}` : ''}</Text>
          <View style={{ flexDirection: 'row', gap: space.lg }}>
            <TextButton label="Email" arrow={false} onPress={() => Linking.openURL(`mailto:${b.email}?subject=${encodeURIComponent(`Your booking ${b.reference}`)}`)} />
            {b.phone ? <TextButton label="Call" arrow={false} onPress={() => Linking.openURL(`tel:${String(b.phone).replace(/[^\d+]/g, '')}`)} /> : null}
            {b.phone ? <TextButton label="WhatsApp" arrow={false} onPress={() => Linking.openURL(`https://wa.me/${String(b.phone).replace(/[^\d]/g, '')}`)} /> : null}
          </View>
          <Hairline />
          <Text style={type.bodySm}>Dates: {b.start_date}{b.end_date ? ` → ${b.end_date}` : ''}{b.start_time ? ` at ${b.start_time}` : ''}</Text>
          {b.location ? <Text style={type.bodySm}>From / where: {b.location}</Text> : null}
          {b.destination ? <Text style={type.bodySm}>To: {b.destination}</Text> : null}
          <Text style={type.bodySm}>Guests: {b.guests}{b.stay_slug ? ` · stay: ${b.stay_slug}` : ''}</Text>
          {details.map(([k, v]) => <Text key={k} style={type.bodySm}>{k}: {String(v)}</Text>)}
          {b.notes ? <Text style={[type.bodySm, { fontFamily: fonts.sansMedium }]}>“{b.notes}”</Text> : null}
          {b.paid_at ? <Text style={[type.bodySm, { color: colors.secondary }]}>Paid {b.amount_paid} {b.amount_currency} via {b.payment_provider} on {String(b.paid_at).slice(0, 10)}</Text> : null}
        </Card>

        <Field label="Price for the customer (USD)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 240" />
        <Field label="Note to the customer" value={note} onChangeText={setNote} multiline placeholder="e.g. Room with lake view, driver Ram will meet you at arrivals." />
        <View style={{ gap: 10 }}>
          <Kicker>Status</Kicker>
          <View style={{ marginHorizontal: -space.gutter }}>
            <ChipRow>{STATUSES.map((s) => <Chip key={s} label={STATUS_LABEL[s]} active={status === s} onPress={() => setStatus(s)} />)}</ChipRow>
          </View>
        </View>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Sending a price or confirming emails the customer and sends a push notification.</Text>
        {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
        {busy ? <ActivityIndicator color={colors.primary} /> : <PrimaryButton label="Save & notify customer" onPress={save} />}
      </Gutter>
    </Screen>
  );
}
