import { track } from '@/lib/monitoring';
import { useLayoutWidth } from '@/lib/layout';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { colors, fonts, radius, space, squircle, type } from '@/theme';
import { tours } from '@/data/tours';
import { useStore } from '@/lib/store';
import { MAX_PHOTOS, notifyStoriesChanged, sharedStorage, submitStory, type PickedPhoto } from '@/lib/stories';
import { Callout, Chip, ChipRow, Field, Gutter, Kicker, PrimaryButton, Screen, Section, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { CameraPlusIcon, CheckIcon, CheckCircleIcon, InfoIcon, StarIcon, XIcon } from '@/components/icons';
import { useContent } from '@/lib/content';

const tripOptions = tours.map((t) => t.title);

export default function ShareStory() {
  useContent();
  const { toast } = useStore();
  const width = useLayoutWidth();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [trip, setTrip] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | 'published' | 'pending'>(null);

  const thumb = (width - space.gutter * 2 - space.sm * 2) / 3;

  const pick = async () => {
    setError('');
    const left = MAX_PHOTOS - photos.length;
    if (left <= 0) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: left, quality: 1 });
    if (res.canceled) return;
    const added = res.assets.map((a) => ({ uri: a.uri, width: a.width, height: a.height }));
    if (photos.length + added.length > MAX_PHOTOS) setError(`You can add up to ${MAX_PHOTOS} photos.`);
    setPhotos((cur) => [...cur, ...added].slice(0, MAX_PHOTOS));
  };

  const submit = async () => {
    if (!name.trim() || !text.trim()) return setError('Please add your name and a few words about your trip.');
    if (photos.length === 0) return setError('Please add at least one photo.');
    if (!consent) return setError('Please confirm you took these photos and are happy for us to share them.');
    setBusy(true);
    setError('');
    try {
      const status = await submitStory({ name: name.trim().slice(0, 60), country: country.trim().slice(0, 60), trip, rating, text: text.trim().slice(0, 2000) }, photos);
      setDone(status);
      track('story_shared', { photos: photos.length, status });
      notifyStoriesChanged();
      toast(status === 'published' ? 'Your story is live — thank you!' : 'Thank you! Your story is with our team.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ alignItems: 'center', marginTop: space.xxl }}>
          <CheckCircleIcon size={64} color={colors.secondary} weight="duotone" />
          <Text style={[type.displayMd, { marginTop: space.lg, textAlign: 'center' }]}>Dhanyabad, {name.split(' ')[0]}!</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 10 }]}>
            {done === 'published'
              ? 'Your story and photos are now on the Traveller Stories wall.'
              : 'Your story and photos have reached our team. They will appear on the Traveller Stories wall once approved, usually within a day.'}
          </Text>
          <PrimaryButton label="View stories" onPress={() => { router.back(); setTimeout(() => router.navigate('/stories'), 50); }} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
        </Gutter>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker>Traveller stories</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>Share your MP story</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
            The moment that stayed with you, your guide, the teahouses, the view from the top.
          </Text>
        </Gutter>

        <Section style={{ marginTop: space.xl }}>
          <Gutter>
            <Kicker style={{ marginBottom: space.md }}>Your photos · up to {MAX_PHOTOS}</Kicker>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
              {photos.map((p, k) => (
                <View key={p.uri + k} style={[styles.thumb, { width: thumb, height: thumb }]}>
                  <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`Selected photo ${k + 1}`} />
                  <Pressable onPress={() => setPhotos((f) => f.filter((_, j) => j !== k))} style={styles.remove} hitSlop={6} accessibilityLabel={`Remove photo ${k + 1}`}>
                    <XIcon size={14} color="#fff" weight="bold" />
                  </Pressable>
                  {k === 0 ? <View style={styles.cover}><Text style={[type.labelSm, { color: '#fff', fontSize: 10 }]}>COVER</Text></View> : null}
                </View>
              ))}
              {photos.length < MAX_PHOTOS && (
                <Pressable onPress={pick} style={({ pressed }) => [styles.add, { width: thumb, height: thumb }, pressed && { backgroundColor: colors.border }]} accessibilityRole="button" accessibilityLabel="Add photos">
                  <CameraPlusIcon size={28} color={colors.onSurfaceVariant} weight="duotone" />
                  <Text style={[type.labelSm, { color: colors.onSurfaceVariant, marginTop: 6 }]}>Add</Text>
                </Pressable>
              )}
            </View>
          </Gutter>
        </Section>

        <Gutter style={{ marginTop: space.xl, gap: space.lg }}>
          <Field label="Your name *" value={name} onChangeText={setName} maxLength={60} placeholder="e.g. Sophie L." autoComplete="name" />
          <Field label="Where are you from?" value={country} onChangeText={setCountry} maxLength={60} placeholder="e.g. Lyon, France" />
        </Gutter>

        <Section style={{ marginTop: space.lg }}>
          <Gutter><Kicker style={{ marginBottom: space.md }}>Which trip?</Kicker></Gutter>
          <ChipRow>{tripOptions.map((t) => <Chip key={t} label={t} active={trip === t} onPress={() => setTrip(trip === t ? '' : t)} />)}</ChipRow>
        </Section>

        <Gutter style={{ marginTop: space.lg }}>
          <Kicker style={{ marginBottom: space.sm }}>Your rating</Kicker>
          <View style={{ flexDirection: 'row', gap: 4 }} accessibilityRole="radiogroup">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} accessibilityRole="radio" accessibilityState={{ checked: rating === n }} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
                <StarIcon size={34} color={n <= rating ? colors.primary : colors.border} weight="fill" />
              </Pressable>
            ))}
          </View>
        </Gutter>

        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          <View>
            <Field label="Your experience *" value={text} onChangeText={setText} maxLength={2000} multiline placeholder="Tell other travellers what it was like…" />
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant, textAlign: 'right', marginTop: 6, fontSize: 12 }]}>{text.length}/2000</Text>
          </View>

          <Pressable onPress={() => setConsent((c) => !c)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
            <View style={[styles.check, consent && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>
              {consent ? <CheckIcon size={14} color="#fff" weight="bold" /> : null}
            </View>
            <Text style={[type.bodySm, { flex: 1 }]}>
              I took these photos (or have permission) and I’m happy for Mountain Planet Nepal to show them with my story.
            </Text>
          </Pressable>

          {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}

          {busy ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 18 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontFamily: fonts.sansMedium }]}>Uploading photos…</Text>
            </View>
          ) : (
            <PrimaryButton label="Share my story" onPress={submit} />
          )}
          {!sharedStorage ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 12 }]}>Your story will be saved on this phone.</Text> : null}
          <TextButton label="Cancel" arrow={false} onPress={() => router.back()} style={{ alignSelf: 'center' }} />
        </Gutter>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  thumb: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle },
  remove: { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', left: 6, bottom: 6, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  add: { borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, ...squircle },
  check: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.onSurfaceVariant, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
