// Partner: create / edit the property listing — photos, details, amenities, rooms — then send for review.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, space, squircle, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useMyPartner } from '@/lib/partners';
import { createListing, LISTING_STATUS, pickAndUploadPhotos, PROPERTY_AMENITIES, setListingPaused, submitListing, updateListing, useMyListing, type ListingFields } from '@/lib/listings';
import { rupees } from '@/lib/currency';
import { useStore } from '@/lib/store';
import { BadgePill, Callout, Card, Chip, Field, Gutter, Kicker, PrimaryButton, Screen, Section, SoftButton } from '@/components/ui';
import { Checkbox } from '@/components/form';
import { BackHeader } from '@/components/BackHeader';
import { ImageIcon, InfoIcon, PlusIcon, XIcon } from '@/components/icons';

const MAX_PHOTOS = 20;
const TIME = /^\d{2}:\d{2}$/;

export default function PartnerListing() {
  const { user } = useAuth();
  const { toast } = useStore();
  const { partner } = useMyPartner(user?.id);
  const { listing, rooms, loading, refresh } = useMyListing(partner?.id);
  const [f, setF] = useState<ListingFields>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  // Copy the saved listing into the form whenever it (re)loads.
  useEffect(() => {
    if (!listing) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the form from the server copy
    setF({
      name: listing.name, city: listing.city, address: listing.address, images: listing.images, description: listing.description, amenities: listing.amenities,
      star_rating: listing.star_rating, free_cancellation: listing.free_cancellation, check_in_time: listing.check_in_time, check_out_time: listing.check_out_time, house_rules: listing.house_rules,
    });
  }, [listing]);

  if (!partner || partner.status !== 'approved') {
    return (
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.lg }}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Callout icon={InfoIcon}>Your partner account needs to be verified before you can list your property.</Callout>}
        </Gutter>
      </Screen>
    );
  }

  const set = <K extends keyof ListingFields>(k: K, v: ListingFields[K]) => setF((cur) => ({ ...cur, [k]: v }));
  const images = f.images ?? [];
  const amen = f.amenities ?? [];
  const editable = !listing || listing.status !== 'pending';

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      await createListing(partner);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start your listing.');
    } finally {
      setBusy(false);
    }
  };

  const save = async (extra?: ListingFields, quiet = false) => {
    if (!listing) return false;
    const next = { ...f, ...extra };
    if (next.check_in_time && !TIME.test(next.check_in_time)) return setError('Check-in time should look like 14:00.'), false;
    if (next.check_out_time && !TIME.test(next.check_out_time)) return setError('Check-out time should look like 11:00.'), false;
    setBusy(true);
    setError('');
    try {
      await updateListing(listing.slug, {
        ...next,
        check_in_time: next.check_in_time || null,
        check_out_time: next.check_out_time || null,
        house_rules: next.house_rules || null,
      });
      await refresh();
      if (!quiet) toast(listing.status === 'live' ? 'Saved — your changes are live' : 'Saved');
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addPhotos = async () => {
    if (!user || !listing) return;
    setUploading(true);
    setError('');
    try {
      const urls = await pickAndUploadPhotos(user.id, MAX_PHOTOS - images.length);
      if (urls.length) {
        const all = [...images, ...urls];
        set('images', all);
        await save({ images: all }, true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };
  const removePhoto = (i: number) => {
    const all = images.filter((_, j) => j !== i);
    set('images', all);
    save({ images: all }, true);
  };
  const makeCover = (i: number) => {
    if (i === 0) return;
    const all = [images[i], ...images.filter((_, j) => j !== i)];
    set('images', all);
    save({ images: all }, true);
  };

  const send = async () => {
    if (!listing) return;
    if (!(await save(undefined, true))) return;
    setBusy(true);
    try {
      await submitListing(listing.slug);
      await refresh();
      toast('Sent for review');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
    } finally {
      setBusy(false);
    }
  };

  const pause = (paused: boolean) =>
    Alert.alert(paused ? 'Hide your listing?' : 'Show your listing again?', paused ? 'Travellers won’t see or book it until you turn it back on.' : 'Travellers will be able to find and book it again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: paused ? 'Pause' : 'Go live',
        onPress: async () => {
          try {
            await setListingPaused(listing!.slug, paused);
            await refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not change.');
          }
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker style={{ color: colors.primary }}>Your listing</Kicker>
          <Text style={[type.displayMd, { marginTop: 8 }]}>{listing?.name ?? partner.business_name}</Text>
          {listing ? (
            <View style={{ flexDirection: 'row', marginTop: space.sm }}>
              <BadgePill label={LISTING_STATUS[listing.status]} style={{ backgroundColor: listing.status === 'live' ? colors.secondary : listing.status === 'rejected' ? colors.destructive : colors.onSurfaceVariant }} />
            </View>
          ) : null}
        </Gutter>

        {!listing ? (
          <Section>
            <Gutter style={{ gap: space.md }}>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>
                Add photos, describe your property and set up your rooms with prices in Nepali rupees. Our team checks the listing once, then it goes live in the app.
              </Text>
              {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
              <PrimaryButton label={busy ? 'Please wait…' : 'Start my listing'} onPress={start} disabled={busy} />
            </Gutter>
          </Section>
        ) : (
          <>
            <Gutter style={{ marginTop: space.md, gap: space.sm }}>
              {listing.status === 'rejected' && listing.review_note ? <Callout icon={InfoIcon}>{`Our team asked for a change: “${listing.review_note}”. Update your listing and send it again.`}</Callout> : null}
              {listing.status === 'pending' ? <Callout icon={InfoIcon}>Our team is checking your listing (usually within 1 working day). You can’t edit it until then.</Callout> : null}
              {listing.status === 'live' ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Your listing is live. Changes you save here show in the app straight away.</Text> : null}
            </Gutter>

            {/* photos */}
            <Section>
              <Gutter style={{ gap: space.md }}>
                <View>
                  <Text style={type.headlineMd}>Photos</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>At least 3: outside, reception or common area, and rooms. The first photo is the cover — tap a photo to make it the cover.</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {images.map((u, i) => (
                    <Pressable key={u} onPress={() => editable && makeCover(i)} accessibilityLabel={i === 0 ? 'Cover photo' : `Photo ${i + 1}, tap to make cover`} style={styles.photo}>
                      <Image source={{ uri: u }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      {i === 0 ? <View style={styles.cover}><Text style={[type.labelSm, { color: '#fff' }]}>Cover</Text></View> : null}
                      {editable ? (
                        <Pressable onPress={() => removePhoto(i)} hitSlop={8} style={styles.remove} accessibilityLabel={`Remove photo ${i + 1}`}>
                          <XIcon size={14} color="#fff" weight="bold" />
                        </Pressable>
                      ) : null}
                    </Pressable>
                  ))}
                  {editable && images.length < MAX_PHOTOS ? (
                    <Pressable onPress={addPhotos} disabled={uploading} style={[styles.photo, styles.add]} accessibilityRole="button" accessibilityLabel="Add photos">
                      {uploading ? <ActivityIndicator color={colors.primary} /> : <><ImageIcon size={26} color={colors.primary} /><Text style={[type.labelSm, { color: colors.primary }]}>Add</Text></>}
                    </Pressable>
                  ) : null}
                </View>
              </Gutter>
            </Section>

            {/* details */}
            <Section>
              <Gutter style={{ gap: space.lg }}>
                <Text style={type.headlineMd}>About the property</Text>
                <Field label="Name shown to travellers" value={f.name ?? ''} onChangeText={(v) => set('name', v)} editable={editable} />
                <Field label="City / village" value={f.city ?? ''} onChangeText={(v) => set('city', v)} editable={editable} />
                <Field label="Address" value={f.address ?? ''} onChangeText={(v) => set('address', v)} editable={editable} />
                <Field label="Description" value={f.description ?? ''} onChangeText={(v) => set('description', v)} placeholder="What will guests love? Views, food, how to get there…" multiline editable={editable} />
                {listing.kind === 'hotel' ? (
                  <View style={{ gap: 8 }}>
                    <Kicker>Official star rating (if any)</Kicker>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {[null, 1, 2, 3, 4, 5].map((n) => <Chip key={String(n)} label={n ? `${n}★` : 'None'} active={(f.star_rating ?? null) === n} onPress={() => editable && set('star_rating', n)} />)}
                    </View>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}><Field label="Check-in from" value={f.check_in_time ?? ''} onChangeText={(v) => set('check_in_time', v)} placeholder="14:00" keyboardType="numbers-and-punctuation" editable={editable} /></View>
                  <View style={{ flex: 1 }}><Field label="Check-out by" value={f.check_out_time ?? ''} onChangeText={(v) => set('check_out_time', v)} placeholder="11:00" keyboardType="numbers-and-punctuation" editable={editable} /></View>
                </View>
                <Field label="House rules" value={f.house_rules ?? ''} onChangeText={(v) => set('house_rules', v)} placeholder="e.g. Quiet after 10 pm. No smoking in rooms." multiline editable={editable} />
                <Checkbox label="Free cancellation (guests can cancel without charge up to 24 hours before check-in)" checked={!!f.free_cancellation} onChange={(v) => editable && set('free_cancellation', v)} />
              </Gutter>
            </Section>

            {/* amenities */}
            <Section>
              <Gutter style={{ gap: space.md }}>
                <Text style={type.headlineMd}>Facilities</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {PROPERTY_AMENITIES.map((a) => (
                    <Chip key={a} label={a} active={amen.includes(a)} onPress={() => editable && set('amenities', amen.includes(a) ? amen.filter((x) => x !== a) : [...amen, a])} />
                  ))}
                </View>
              </Gutter>
            </Section>

            {/* rooms */}
            <Section>
              <Gutter style={{ gap: space.md }}>
                <View>
                  <Text style={type.headlineMd}>Rooms and prices</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>Add each type of room once, with how many you have and the price per night in rupees.</Text>
                </View>
                {rooms.map((r) => (
                  <Pressable key={r.id} onPress={() => editable && router.push({ pathname: '/partner/room', params: { id: r.id } })} accessibilityRole="button" accessibilityLabel={`Edit ${r.name}`}>
                    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                      {r.images[0] ? <Image source={{ uri: r.images[0] }} style={{ width: 56, height: 56, borderRadius: radius.md }} contentFit="cover" /> : null}
                      <View style={{ flex: 1 }}>
                        <Text style={type.headlineSm}>{r.name}</Text>
                        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{r.units} {r.units === 1 ? 'room' : 'rooms'} · up to {r.max_guests} guests{r.breakfast_included ? ' · breakfast' : ''}</Text>
                      </View>
                      <Text style={[type.headlineSm, { color: colors.primary }]}>{rupees(r.price_npr)}</Text>
                    </Card>
                  </Pressable>
                ))}
                {rooms.length && (listing.status === 'live' || listing.status === 'paused') ? (
                  <View style={{ gap: 6 }}>
                    <Kicker>Prices & availability calendar</Kicker>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {rooms.map((r) => <Chip key={r.id} label={r.name} onPress={() => router.push({ pathname: '/partner/calendar', params: { room: r.id } })} />)}
                    </View>
                  </View>
                ) : null}
                {editable ? <SoftButton label="Add a room type" icon={PlusIcon} onPress={() => router.push({ pathname: '/partner/room', params: { stay: listing.slug } })} /> : null}
              </Gutter>
            </Section>

            <Section>
              <Gutter style={{ gap: space.md }}>
                {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
                {editable ? <PrimaryButton label={busy ? 'Saving…' : 'Save'} onPress={() => save()} disabled={busy} /> : null}
                {listing.status === 'draft' || listing.status === 'rejected' ? (
                  <SoftButton label="Send for review" onPress={send} style={{ alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 14 }} />
                ) : null}
                {listing.status === 'live' ? <SoftButton label="Pause listing" onPress={() => pause(true)} style={{ alignSelf: 'center' }} /> : null}
                {listing.status === 'paused' ? <PrimaryButton label="Go live again" onPress={() => pause(false)} /> : null}
              </Gutter>
            </Section>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  photo: { width: 100, height: 100, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle },
  add: { alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary },
  cover: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  remove: { position: 'absolute', right: 6, top: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
