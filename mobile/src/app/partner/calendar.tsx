// Partner: month calendar for one room type — price per night, booked / total, closed days.
// Tap days to select them, then close, open, set a special price or go back to the normal price.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { colors, radius, space, type } from '@/theme';
import { supabase } from '@/lib/supabase';
import { rupees } from '@/lib/currency';
import { fetchRoomCalendar, setRoomDays, type CalendarDay } from '@/lib/partnerBookings';
import { useStore } from '@/lib/store';
import { useLayoutWidth } from '@/lib/layout';
import { Callout, Field, Gutter, Kicker, PrimaryButton, Screen, SoftButton, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { CaretLeftIcon, CaretRightIcon, InfoIcon } from '@/components/icons';
import type { StayRoom } from '@/data/stays';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const short = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n));
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function RoomCalendar() {
  const { room: roomId } = useLocalSearchParams<{ room: string }>();
  const { toast } = useStore();
  const width = useLayoutWidth();
  const [room, setRoom] = useState<StayRoom | null>(null);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [days, setDays] = useState<CalendarDay[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase || !roomId) return;
    supabase.from('stay_rooms').select('*').eq('id', roomId).maybeSingle().then(({ data }) => setRoom((data as StayRoom) ?? null));
  }, [roomId]);

  const load = useCallback(async () => {
    if (!roomId) return;
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    try {
      setError('');
      setDays(await fetchRoomCalendar(roomId, iso(from), iso(to)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the calendar.');
    }
  }, [roomId, month]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- (re)load the visible month
    load();
  }, [load]);

  const today = iso(new Date());
  const cell = Math.floor((width - space.gutter * 2 - 6 * 4) / 7);
  const lead = (month.getDay() + 6) % 7; // Monday-first offset
  const grid = useMemo(() => [...Array(lead).fill(null), ...(days ?? [])] as (CalendarDay | null)[], [days, lead]);

  const toggle = (d: string) => setSelected((s) => (s.includes(d) ? s.filter((x) => x !== d) : [...s, d]));
  const apply = async (change: { closed?: boolean; price?: number; resetPrice?: boolean }, msg: string) => {
    if (!selected.length || !roomId) return;
    setBusy(true);
    try {
      await setRoomDays(roomId, selected, change);
      toast(msg);
      setSelected([]);
      setPrice('');
      await load();
    } catch (e) {
      Alert.alert('Not saved', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const setSpecial = () => {
    const n = parseInt(price.replace(/\D/g, ''), 10);
    if (!n || n < 100) return Alert.alert('Enter a price', 'Type the price per night in rupees, e.g. 6000.');
    apply({ price: n }, `Price set to ${rupees(n)} on ${selected.length} ${selected.length === 1 ? 'day' : 'days'}`);
  };
  const thisMonth = month.getFullYear() === new Date().getFullYear() && month.getMonth() === new Date().getMonth();

  return (
    <Screen>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker style={{ color: colors.primary }}>Prices & availability</Kicker>
        <Text style={[type.displayMd, { marginTop: 6 }]}>{room?.name ?? 'Room'}</Text>
        {room ? <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 4 }]}>Normal price {rupees(room.price_npr)} a night · {room.units} {room.units === 1 ? 'room' : 'rooms'}</Text> : null}
      </Gutter>

      <Gutter style={{ marginTop: space.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable disabled={thisMonth} onPress={() => { setSelected([]); setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); }} hitSlop={10} accessibilityLabel="Previous month" style={{ opacity: thisMonth ? 0.3 : 1 }}>
          <CaretLeftIcon size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={type.headlineMd}>{month.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
        <Pressable onPress={() => { setSelected([]); setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); }} hitSlop={10} accessibilityLabel="Next month">
          <CaretRightIcon size={22} color={colors.onSurface} />
        </Pressable>
      </Gutter>

      <Gutter style={{ marginTop: space.md }}>
        <View style={{ flexDirection: 'row', gap: 4, marginBottom: 6 }}>
          {WEEK.map((w) => <Text key={w} style={[type.labelSm, { width: cell, textAlign: 'center', color: colors.onSurfaceVariant }]}>{w}</Text>)}
        </View>
        {!days ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: space.lg }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
            {grid.map((d, i) => {
              if (!d) return <View key={`b${i}`} style={{ width: cell, height: cell * 1.25 }} />;
              const past = d.day < today;
              const sel = selected.includes(d.day);
              const full = !d.closed && d.booked >= d.units;
              return (
                <Pressable
                  key={d.day}
                  disabled={past}
                  onPress={() => toggle(d.day)}
                  accessibilityLabel={`${d.day}: ${d.closed ? 'closed' : `${rupees(d.price_npr)}, ${d.booked} of ${d.units} booked`}`}
                  style={[
                    styles.cell,
                    { width: cell, height: cell * 1.25 },
                    d.closed ? styles.closed : full ? styles.full : null,
                    sel ? styles.selected : null,
                    past ? { opacity: 0.35 } : null,
                  ]}
                >
                  <Text style={[type.labelMd, sel ? { color: colors.onSecondary } : null]}>{Number(d.day.slice(8))}</Text>
                  {d.closed ? (
                    <Text style={[styles.tiny, { color: sel ? colors.onSecondary : colors.destructive }]}>Closed</Text>
                  ) : (
                    <>
                      <Text style={[styles.tiny, { color: sel ? colors.onSecondary : d.special ? colors.primary : colors.onSurfaceVariant, fontWeight: d.special ? '700' : '400' }]}>{short(d.price_npr)}</Text>
                      <Text style={[styles.tiny, { color: sel ? colors.onSecondary : colors.onSurfaceVariant }]}>{d.booked}/{d.units}</Text>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: space.sm }]}>
          Each day shows the price (bold = special price) and rooms booked / total. Tap days to change them.
        </Text>
      </Gutter>

      <Gutter style={{ marginTop: space.lg, gap: space.md }}>
        {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
        {selected.length ? (
          <View style={{ gap: space.md, backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, padding: space.card }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={type.headlineSm}>{selected.length} {selected.length === 1 ? 'day' : 'days'} selected</Text>
              <TextButton label="Clear" arrow={false} onPress={() => setSelected([])} />
            </View>
            {busy ? <ActivityIndicator color={colors.primary} /> : (
              <>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <SoftButton label="Close days" onPress={() => apply({ closed: true }, 'Days closed')} style={{ flex: 1, justifyContent: 'center', alignSelf: 'stretch' }} />
                  <SoftButton label="Open days" onPress={() => apply({ closed: false }, 'Days open')} style={{ flex: 1, justifyContent: 'center', alignSelf: 'stretch' }} />
                </View>
                <Field label="Special price per night (Rs)" value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder={room ? String(room.price_npr) : 'e.g. 6000'} />
                <PrimaryButton label="Set this price" onPress={setSpecial} />
                <TextButton label="Back to the normal price" arrow={false} onPress={() => apply({ resetPrice: true }, 'Normal price restored')} style={{ alignSelf: 'center' }} />
              </>
            )}
          </View>
        ) : (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Tip: close days when you’re full from other bookings, and raise prices for festivals like Dashain and Tihar.</Text>
        )}
      </Gutter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cell: { borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', gap: 1 },
  closed: { backgroundColor: colors.destructiveSoft },
  full: { backgroundColor: colors.primarySoft },
  selected: { backgroundColor: colors.secondary },
  tiny: { fontSize: 10, lineHeight: 12 },
});
