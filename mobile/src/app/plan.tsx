import { track } from '@/lib/monitoring';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, Text, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useContent } from '@/lib/content';
import { ContactCard } from '@/components/ContactCard';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, fonts, radius, space, type } from '@/theme';
import { tours, CONTACT } from '@/data/tours';
import { askAgent } from '@/lib/store';
import { img } from '@/lib/images';
import { Callout, Chip, ChipRow, Field, Gutter, Kicker, PrimaryButton, Screen, Section, SoftButton, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { CheckCircleIcon, EnvelopeSimpleIcon, InfoIcon, SparkleIcon } from '@/components/icons';

const TRAVELLERS = ['1', '2', '3–4', '5–8', '9+'];
const BUDGETS = ['Not sure', 'Under $500', '$500 – $1,000', '$1,000 – $2,000', '$2,000 – $3,500', '$3,500+'];

export default function Plan() {
  const params = useLocalSearchParams<{ tour?: string; msg?: string }>();
  const initial = useMemo(() => (params.tour ?? '').split(',').filter((s) => tours.some((t) => t.slug === s)), [params.tour]);
  const [picked, setPicked] = useState<string[]>(initial);
  const [form, setForm] = useState({ name: '', email: '', country: '', date: '', travellers: '2', budget: 'Not sure', message: params.msg ?? '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<false | 'online' | 'email'>(false);
  const { user } = useAuth();
  useContent();

  // Pre-fill from the signed-in account.
  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill from the signed-in account
    setForm((f) => ({ ...f, email: f.email || user.email || '', name: f.name || String(user.user_metadata?.full_name ?? '') }));
  }, [user]);

  const upd = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const mailto = () => {
    const trips = picked.map((s) => tours.find((t) => t.slug === s)?.title).join(', ') || 'Custom trip';
    const body = `Name: ${form.name}\nEmail: ${form.email}\nCountry: ${form.country}\nTrips: ${trips}\nStart date: ${form.date}\nTravellers: ${form.travellers}\nBudget: ${form.budget}\n\n${form.message}`;
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent('Trip enquiry: ' + trips)}&body=${encodeURIComponent(body)}`;
  };

  const openMail = async () => {
    try {
      await Linking.openURL(mailto());
    } catch {
      setError(`No email app found. Please write to ${CONTACT.email}.`);
    }
  };

  const submit = async () => {
    if (!form.name.trim()) return setError('Please add your name.');
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Please add a valid email so we can reply.');
    setError('');

    // With the backend: save the request and email the team directly.
    if (supabase) {
      setBusy(true);
      const { error: fnError } = await supabase.functions.invoke('submit-enquiry', {
        body: { name: form.name, email: form.email, country: form.country, startDate: form.date, travellers: form.travellers, budget: form.budget, tours: picked, message: form.message },
      });
      setBusy(false);
      if (!fnError) {
        track('trip_request', { tours: picked.length });
        return setSent('online');
      }
      let msg = '';
      try {
        msg = (await (fnError as { context?: Response }).context?.json())?.error ?? '';
      } catch {
        /* no JSON body */
      }
      // A validation / rate-limit message from the server is shown as-is; anything else falls back to email.
      if (msg && !/could not save/i.test(msg)) return setError(msg);
    }
    setSent('email');
    openMail();
  };

  if (sent) {
    const online = sent === 'online';
    return (
      <Screen>
        <BackHeader close />
        <Gutter style={{ alignItems: 'center', marginTop: space.xxl }}>
          <CheckCircleIcon size={64} color={colors.secondary} weight="duotone" />
          <Kicker style={{ marginTop: space.lg }}>{online ? 'Request sent' : 'Request ready'}</Kicker>
          <Text style={[type.displayMd, { marginTop: 8, textAlign: 'center' }]}>Dhanyabad, {form.name.split(' ')[0] || 'traveller'}!</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 10 }]}>
            {online
              ? `Our Kathmandu team has your request and will reply to ${form.email.trim()} within 24 hours with a free, tailor-made itinerary.`
              : 'Send the email that just opened and our Kathmandu team will reply within 24 hours with a free, tailor-made itinerary.'}
          </Text>
          {error ? <View style={{ marginTop: space.lg, alignSelf: 'stretch' }}><Callout icon={InfoIcon}>{error}</Callout></View> : null}
          {online ? (
            <PrimaryButton label="Keep exploring" onPress={() => router.navigate('/explore')} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
          ) : (
            <>
              <PrimaryButton label="Open email again" icon={EnvelopeSimpleIcon} onPress={openMail} style={{ marginTop: space.xl, alignSelf: 'stretch' }} />
              <TextButton label="Keep exploring" onPress={() => router.navigate('/explore')} style={{ marginTop: space.lg }} />
            </>
          )}
        </Gutter>
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker>Plan a trip · free, no obligation</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>Let’s craft your journey</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
            Tell us a little about your dream trip and you’ll get a personalised itinerary and price.
          </Text>
        </Gutter>

        <Section style={{ marginTop: space.xl }}>
          <Gutter><Kicker style={{ marginBottom: space.md }}>Which journeys interest you?</Kicker></Gutter>
          <ChipRow>
            {tours.map((t) => {
              const on = picked.includes(t.slug);
              return (
                <Pressable
                  key={t.slug}
                  onPress={() => toggle(t.slug)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, paddingLeft: 6, paddingRight: 16, borderRadius: radius.full, backgroundColor: on ? colors.secondary : colors.surfaceAlt }}
                >
                  <Image source={img(t.img)} style={{ width: 30, height: 30, borderRadius: 15 }} contentFit="cover" />
                  <Text style={[type.labelMd, { color: on ? colors.onSecondary : colors.onSurface }]}>{t.title}</Text>
                </Pressable>
              );
            })}
          </ChipRow>
        </Section>

        <Gutter style={{ marginTop: space.xl, gap: space.lg }}>
          <Field label="Full name *" value={form.name} onChangeText={upd('name')} autoComplete="name" textContentType="name" placeholder="Your name" />
          <Field label="Email *" value={form.email} onChangeText={upd('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
          <Field label="Country" value={form.country} onChangeText={upd('country')} autoComplete="country" placeholder="Where are you from?" />
          <Field label="Preferred start date" value={form.date} onChangeText={upd('date')} placeholder="e.g. mid-October 2027" />
        </Gutter>

        <Section style={{ marginTop: space.lg }}>
          <Gutter><Kicker style={{ marginBottom: space.md }}>Travellers</Kicker></Gutter>
          <ChipRow>{TRAVELLERS.map((x) => <Chip key={x} label={x} active={form.travellers === x} onPress={() => upd('travellers')(x)} />)}</ChipRow>
          <Gutter><Kicker style={{ marginTop: space.lg, marginBottom: space.md }}>Budget per person</Kicker></Gutter>
          <ChipRow>{BUDGETS.map((x) => <Chip key={x} label={x} active={form.budget === x} onPress={() => upd('budget')(x)} />)}</ChipRow>
        </Section>

        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          <Field label="Anything else?" value={form.message} onChangeText={upd('message')} multiline placeholder="Fitness level, special interests, hotel preferences…" />
          {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
          {busy ? (
            <View style={{ alignItems: 'center', gap: 10, paddingVertical: 18 }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Sending your request…</Text>
            </View>
          ) : (
            <PrimaryButton label="Send trip request" onPress={submit} />
          )}
        </Gutter>

        <Section>
          <Gutter>
            <ContactCard />
            <View style={{ marginTop: space.lg, alignItems: 'center', gap: 8 }}>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant, fontFamily: fonts.sans }]}>Need ideas first?</Text>
              <SoftButton label="Ask Planet AI" icon={SparkleIcon} onPress={() => askAgent('Plan my trip')} style={{ alignSelf: 'center' }} />
            </View>
          </Gutter>
        </Section>
      </Screen>
    </KeyboardAvoidingView>
  );
}
