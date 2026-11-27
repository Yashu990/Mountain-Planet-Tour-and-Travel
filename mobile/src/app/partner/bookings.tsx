// Partner: booking requests to accept / decline (2-hour window), upcoming guests, and past bookings.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { colors, fonts, radius, space, type } from '@/theme';
import { rupees } from '@/lib/currency';
import { fetchPartnerBookings, partnerRespond, timeLeft, type PartnerBooking } from '@/lib/partnerBookings';
import { useStore } from '@/lib/store';
import { fmtDate } from '@/components/DateField';
import { Callout, Card, Field, Gutter, Hairline, Kicker, PrimaryButton, Screen, Section, SoftButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { ClockIcon, InfoIcon } from '@/components/icons';

const day = (s: string) => fmtDate(new Date(s + 'T00:00:00'));
const todayIso = () => new Date().toISOString().slice(0, 10);

function Request({ b, onDone }: { b: PartnerBooking; onDone: () => void }) {
  const { toast } = useStore();
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const left = timeLeft(b.partner_deadline);
  const overdue = left === 'Answer overdue';

  const respond = async (accept: boolean) => {
    setBusy(true);
    try {
      const s = await partnerRespond(b.id, accept, accept ? undefined : reason);
      toast(accept ? (s === 'confirmed' ? 'Confirmed — guest pays at your property' : 'Accepted — guest will pay in the app') : 'Declined — the guest has been told');
      onDone();
    } catch (e) {
      Alert.alert('Not saved', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: 10, borderWidth: 2, borderColor: overdue ? colors.destructive : colors.primary }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <ClockIcon size={16} color={overdue ? colors.destructive : colors.primary} weight="fill" />
        <Text style={[type.labelMd, { color: overdue ? colors.destructive : colors.primary }]}>{left}</Text>
      </View>
      <Details b={b} />
      {busy ? (
        <ActivityIndicator color={colors.primary} />
      ) : declining ? (
        <View style={{ gap: 10 }}>
          <Field label="Reason for the guest" value={reason} onChangeText={setReason} placeholder="e.g. Fully booked that night" multiline />
          <PrimaryButton label="Decline booking" onPress={() => respond(false)} style={{ backgroundColor: colors.destructive }} />
          <SoftButton label="Back" onPress={() => setDeclining(false)} style={{ alignSelf: 'center' }} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PrimaryButton label="Accept" onPress={() => respond(true)} style={{ flex: 1, paddingVertical: 14 }} />
          <SoftButton label="Decline" onPress={() => setDeclining(true)} style={{ flex: 1, justifyContent: 'center', alignSelf: 'stretch' }} />
        </View>
      )}
    </Card>
  );
}

function Details({ b }: { b: PartnerBooking }) {
  const earn = b.total_npr - b.commission_npr;
  return (
    <View style={{ gap: 6 }}>
      <Text style={type.headlineMd}>{b.guest_name}</Text>
      <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
        {day(b.start_date)} → {day(b.end_date)} · {b.nights} {b.nights === 1 ? 'night' : 'nights'}
      </Text>
      <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
        {b.rooms_count} × {b.room_name ?? 'room'} · {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: 4 }}>
        <Money label="Total" value={rupees(b.total_npr)} />
        <Money label="Commission" value={rupees(b.commission_npr)} />
        <Money label="You receive" value={rupees(earn)} strong />
      </View>
      <Text style={[type.bodySm, { fontFamily: fonts.sansMedium, color: colors.secondary }]}>
        {b.pay_at_property ? `Guest pays you at the property (${rupees(b.total_npr)}). We invoice ${rupees(b.commission_npr)} commission monthly.` : 'Guest pays in the app. We pay you weekly after check-in.'}
      </Text>
      {b.notes ? <Text style={[type.bodySm, { fontStyle: 'italic' }]}>“{b.notes}”</Text> : null}
      <Text style={[type.labelSm, { color: colors.onSurfaceVariant }]} selectable>{b.reference}</Text>
    </View>
  );
}

const Money = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <View>
    <Kicker style={{ fontSize: 9 }}>{label}</Kicker>
    <Text style={[strong ? type.headlineSm : type.bodyMd, strong ? { color: colors.primary } : null]}>{value}</Text>
  </View>
);

export default function PartnerBookings() {
  const [rows, setRows] = useState<PartnerBooking[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      setError('');
      setRows(await fetchPartnerBookings());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load bookings.');
    }
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const today = todayIso();
  const pending = (rows ?? []).filter((b) => b.partner_status === 'pending' && b.status === 'requested');
  const upcoming = (rows ?? []).filter((b) => b.partner_status === 'accepted' && b.status !== 'cancelled' && b.end_date >= today);
  const past = (rows ?? []).filter((b) => !pending.includes(b) && !upcoming.includes(b));

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} tintColor={colors.primary} onRefresh={load} />}>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker style={{ color: colors.primary }}>Partner</Kicker>
        <Text style={[type.displayMd, { marginTop: 6 }]}>Bookings</Text>
      </Gutter>
      {error ? <Gutter style={{ marginTop: space.md }}><Callout icon={InfoIcon}>{error}</Callout></Gutter> : null}
      {!rows ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : (
        <>
          <Section>
            <Gutter style={{ gap: space.md }}>
              <Text style={type.headlineMd}>New requests {pending.length ? `(${pending.length})` : ''}</Text>
              {pending.length ? (
                pending.map((b) => <Request key={b.id} b={b} onDone={load} />)
              ) : (
                <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>No requests waiting. New ones appear here — please answer within 2 hours.</Text>
              )}
            </Gutter>
          </Section>
          <Section>
            <Gutter style={{ gap: space.md }}>
              <Text style={type.headlineMd}>Upcoming guests {upcoming.length ? `(${upcoming.length})` : ''}</Text>
              {upcoming.length ? (
                upcoming.map((b) => (
                  <Card key={b.id} style={{ gap: 10 }}>
                    <Details b={b} />
                    <Hairline />
                    <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} selectable>
                      {[b.guest_email, b.guest_phone].filter(Boolean).join(' · ')}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {b.guest_phone ? <SoftButton label="Call" onPress={() => Linking.openURL(`tel:${b.guest_phone}`)} /> : null}
                      {b.guest_phone ? <SoftButton label="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${b.guest_phone!.replace(/\D/g, '')}`)} /> : null}
                      {b.guest_email ? <SoftButton label="Email" onPress={() => Linking.openURL(`mailto:${b.guest_email}`)} /> : null}
                    </View>
                    {b.status === 'accepted' ? <Text style={[type.bodySm, { color: colors.primary }]}>Waiting for the guest to pay in the app.</Text> : null}
                  </Card>
                ))
              ) : (
                <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>No upcoming stays yet.</Text>
              )}
            </Gutter>
          </Section>
          {past.length ? (
            <Section>
              <Gutter style={{ gap: space.sm }}>
                <Text style={type.headlineMd}>Past and cancelled</Text>
                {past.map((b) => (
                  <View key={b.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
                    <Text style={type.labelMd}>{b.guest_name} · {day(b.start_date)} → {day(b.end_date)}</Text>
                    <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
                      {b.partner_status === 'declined' ? `Declined${b.partner_note ? `: ${b.partner_note}` : ''}` : b.status === 'cancelled' ? 'Cancelled by the guest' : 'Completed'} · {rupees(b.total_npr)}
                    </Text>
                  </View>
                ))}
              </Gutter>
            </Section>
          ) : null}
        </>
      )}
      <View style={{ height: radius.xl }} />
    </Screen>
  );
}
