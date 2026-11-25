import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { getTour } from '@/data/tours';
import { getStay } from '@/data/stays';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { submitReview } from '@/lib/reviews';
import { Callout, Field, Gutter, Kicker, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { InfoIcon, StarIcon } from '@/components/icons';

export default function WriteReview() {
  const { tour, stay } = useLocalSearchParams<{ tour?: string; stay?: string }>();
  const target = tour ? getTour(tour)?.title : stay ? getStay(stay)?.name : undefined;
  const { user, profile } = useAuth();
  const { toast } = useStore();
  const [name, setName] = useState(profile?.full_name ?? String(user?.user_metadata?.full_name ?? ''));
  const [country, setCountry] = useState(profile?.nationality ?? '');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ marginTop: space.md, gap: space.md }}>
          <Text style={type.displayMd}>Sign in to review</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>Reviews come from signed-in travellers so other people can trust them.</Text>
          <PrimaryButton label="Sign in" onPress={() => router.replace('/account')} />
        </Gutter>
      </Screen>
    );
  }

  const send = async () => {
    if (!name.trim()) return setError('Please add your name.');
    if (text.trim().length < 10) return setError('Please write at least a short sentence.');
    setBusy(true);
    setError('');
    try {
      await submitReview({ tour, stay, name, country, rating, text });
      toast('Thank you! Your review will appear after a quick check.');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ marginTop: space.md, gap: space.lg }}>
          <View>
            <Kicker>Write a review</Kicker>
            <Text style={[type.displayMd, { marginTop: 6 }]}>{target ?? 'Your experience'}</Text>
          </View>
          <View style={{ gap: 8 }}>
            <Kicker>Your rating</Kicker>
            <View style={{ flexDirection: 'row', gap: 4 }} accessibilityRole="radiogroup">
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} accessibilityRole="radio" accessibilityState={{ checked: rating === n }} accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}>
                  <StarIcon size={36} color={n <= rating ? colors.primary : colors.border} weight="fill" />
                </Pressable>
              ))}
            </View>
          </View>
          <Field label="Your review" value={text} onChangeText={setText} multiline maxLength={2000} placeholder="What did you love? What should others know before they go?" />
          <Field label="Name shown" value={name} onChangeText={setName} maxLength={60} placeholder="e.g. Sophie L." />
          <Field label="Where are you from?" value={country} onChangeText={setCountry} maxLength={60} placeholder="e.g. Lyon, France" />
          {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
          {busy ? <ActivityIndicator color={colors.primary} /> : <PrimaryButton label="Send review" onPress={send} />}
          <TextButton label="Cancel" arrow={false} onPress={() => router.back()} style={{ alignSelf: 'center' }} />
        </Gutter>
      </Screen>
    </KeyboardAvoidingView>
  );
}
