// Partner: add or edit one room type (name, guests, beds, how many, NPR price, breakfast, photos).
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, space, squircle, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { deleteRoom, pickAndUploadPhotos, ROOM_AMENITIES, saveRoom, type RoomFields } from '@/lib/listings';
import { useCurrency } from '@/lib/currency';
import { useStore } from '@/lib/store';
import { Callout, Chip, Field, Gutter, Kicker, PrimaryButton, Screen, Section, TextButton } from '@/components/ui';
import { Checkbox, Stepper } from '@/components/form';
import { BackHeader } from '@/components/BackHeader';
import { ImageIcon, InfoIcon, XIcon } from '@/components/icons';
import type { StayRoom } from '@/data/stays';

export default function PartnerRoom() {
  const { id, stay } = useLocalSearchParams<{ id?: string; stay?: string }>();
  const { user } = useAuth();
  const { toast } = useStore();
  const { priceNpr, currency } = useCurrency();
  const [room, setRoom] = useState<StayRoom | null>(null);
  const [f, setF] = useState<RoomFields>({ name: '', max_guests: 2, units: 1, beds: '', price_npr: undefined, breakfast_included: false, amenities: [], images: [], description: '' });
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !supabase) return;
    supabase.from('stay_rooms').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data) return;
      const r = data as StayRoom;
      setRoom(r);
      setF({ name: r.name, max_guests: r.max_guests, units: r.units, beds: r.beds ?? '', price_npr: r.price_npr, breakfast_included: r.breakfast_included, amenities: r.amenities, images: r.images, description: r.description ?? '' });
      setPrice(String(r.price_npr));
    });
  }, [id]);

  const staySlug = room?.stay_slug ?? stay;
  const set = <K extends keyof RoomFields>(k: K, v: RoomFields[K]) => setF((cur) => ({ ...cur, [k]: v }));
  const amen = f.amenities ?? [];
  const images = f.images ?? [];
  const npr = parseInt(price.replace(/\D/g, ''), 10) || 0;

  const addPhotos = async () => {
    if (!user) return;
    setUploading(true);
    try {
      const urls = await pickAndUploadPhotos(user.id, 8 - images.length);
      if (urls.length) set('images', [...images, ...urls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!staySlug) return;
    if ((f.name ?? '').trim().length < 2) return setError('Please name the room, e.g. “Deluxe double with lake view”.');
    if (npr < 100) return setError('Please enter the price per night in rupees (at least Rs 100).');
    setBusy(true);
    setError('');
    try {
      await saveRoom(staySlug, room?.id ?? null, { ...f, name: f.name?.trim(), beds: f.beds || null, description: f.description || null, price_npr: npr });
      toast(room ? 'Room updated' : 'Room added');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete this room type?', f.name ?? '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRoom(room!.id);
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete.');
          }
        },
      },
    ]);

  if (id && !room) return <Screen><BackHeader /><ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} /></Screen>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker style={{ color: colors.primary }}>{room ? 'Edit room type' : 'New room type'}</Kicker>
          <Text style={[type.displayMd, { marginTop: 8 }]}>{f.name || 'Room'}</Text>
        </Gutter>
        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          <Field label="Room name *" value={f.name ?? ''} onChangeText={(v) => set('name', v)} placeholder="e.g. Deluxe double with lake view" />
          <Field label="Price per night, in rupees (NPR) *" value={price} onChangeText={setPrice} placeholder="e.g. 4500" keyboardType="number-pad" />
          {npr >= 100 && currency !== 'NPR' ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: -8 }]}>Travellers in {currency} see about {priceNpr(npr)}.</Text> : null}
          <Field label="Beds" value={f.beds ?? ''} onChangeText={(v) => set('beds', v)} placeholder="e.g. 1 double bed, or 2 single beds" />
          <View>
            <Stepper label="Guests per room" value={f.max_guests ?? 2} onChange={(n) => set('max_guests', n)} min={1} max={20} />
            <Stepper label="How many rooms of this type" value={f.units ?? 1} onChange={(n) => set('units', n)} min={1} max={500} />
          </View>
          <Checkbox label="Breakfast included in the price" checked={!!f.breakfast_included} onChange={(v) => set('breakfast_included', v)} />
          <Field label="Description" value={f.description ?? ''} onChangeText={(v) => set('description', v)} placeholder="Size, view, what’s in the room…" multiline />
        </Gutter>

        <Section>
          <Gutter style={{ gap: space.md }}>
            <Text style={type.headlineMd}>In the room</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ROOM_AMENITIES.map((a) => <Chip key={a} label={a} active={amen.includes(a)} onPress={() => set('amenities', amen.includes(a) ? amen.filter((x) => x !== a) : [...amen, a])} />)}
            </View>
          </Gutter>
        </Section>

        <Section>
          <Gutter style={{ gap: space.md }}>
            <Text style={type.headlineMd}>Room photos</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {images.map((u, i) => (
                <View key={u} style={styles.photo}>
                  <Image source={{ uri: u }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <Pressable onPress={() => set('images', images.filter((_, j) => j !== i))} hitSlop={8} style={styles.remove} accessibilityLabel={`Remove photo ${i + 1}`}>
                    <XIcon size={14} color="#fff" weight="bold" />
                  </Pressable>
                </View>
              ))}
              {images.length < 8 ? (
                <Pressable onPress={addPhotos} disabled={uploading} style={[styles.photo, styles.add]} accessibilityRole="button" accessibilityLabel="Add room photos">
                  {uploading ? <ActivityIndicator color={colors.primary} /> : <><ImageIcon size={26} color={colors.primary} /><Text style={[type.labelSm, { color: colors.primary }]}>Add</Text></>}
                </Pressable>
              ) : null}
            </View>
          </Gutter>
        </Section>

        <Section>
          <Gutter style={{ gap: space.md }}>
            {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
            <PrimaryButton label={busy ? 'Saving…' : room ? 'Save room' : 'Add room'} onPress={save} disabled={busy} />
            {room ? <TextButton label="Delete this room type" arrow={false} onPress={remove} style={{ alignSelf: 'center' }} /> : null}
          </Gutter>
        </Section>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  photo: { width: 92, height: 92, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle },
  add: { alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary },
  remove: { position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
