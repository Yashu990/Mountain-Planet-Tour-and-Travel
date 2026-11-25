// Partner application: 1 Business · 2 Documents · 3 Bank · 4 Agreement → send for review.
// Each step saves as a draft, so the partner can stop and continue later.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import {
  AGREEMENT_VERSION,
  COMMISSION_PCT,
  docsFor,
  pickDocument,
  removePartnerDoc,
  savePartner,
  submitPartnerApplication,
  uploadPartnerDoc,
  useMyPartner,
  type DocType,
  type PartnerFields,
  type PartnerKind,
} from '@/lib/partners';
import { Callout, Card, Field, Gutter, Kicker, PrimaryButton, Screen, SoftButton } from '@/components/ui';
import { Checkbox, Segmented } from '@/components/form';
import { BackHeader } from '@/components/BackHeader';
import { CheckCircleIcon, FilePdfIcon, ImageIcon, InfoIcon, TrashIcon, UploadSimpleIcon } from '@/components/icons';

type Step = 0 | 1 | 2 | 3;
const STEPS = ['Business', 'Documents', 'Bank', 'Agreement'];

const empty: PartnerFields = {
  kind: 'hotel', business_name: '', owner_name: '', email: '', phone: '', whatsapp: '', city: '', address: '', pan_vat: '', rooms_count: null, about: '',
  bank_name: '', bank_account_name: '', bank_account_number: '', bank_branch: '',
};

export default function PartnerApply() {
  const { user } = useAuth();
  const { partner, docs, loading, refresh } = useMyPartner(user?.id);
  const [step, setStep] = useState<Step>(0);
  const [f, setF] = useState<PartnerFields>(empty);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);

  // Fill the form once from the saved draft.
  useEffect(() => {
    if (loading || loaded) return;
    const src = partner ?? null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydrate from the saved draft
    setF((cur) => ({
      ...cur,
      ...(src ? Object.fromEntries(Object.keys(empty).map((k) => [k, (src as unknown as Record<string, unknown>)[k] ?? (empty as unknown as Record<string, unknown>)[k]])) : {}),
      owner_name: src?.owner_name ?? String(user?.user_metadata?.full_name ?? ''),
      email: src?.email ?? user?.email ?? '',
    }) as PartnerFields);
    setLoaded(true);
  }, [loading, loaded, partner, user]);

  if (!user) {
    router.replace('/partner');
    return null;
  }
  const locked = partner && !['draft', 'rejected'].includes(partner.status);
  const set = <K extends keyof PartnerFields>(k: K, v: PartnerFields[K]) => setF((cur) => ({ ...cur, [k]: v }));

  const save = async (fields: Partial<PartnerFields>, next?: Step) => {
    setError('');
    setBusy(true);
    try {
      await savePartner(user.id, partner, fields);
      await refresh();
      if (next !== undefined) setStep(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const nextFromBusiness = () => {
    if (f.business_name.trim().length < 2) return setError('Please enter your property name.');
    if (!f.phone?.trim()) return setError('Please enter a phone number we can call.');
    if (!f.city?.trim() || !f.address?.trim()) return setError('Please enter your city and full address.');
    save({ kind: f.kind, business_name: f.business_name.trim(), owner_name: f.owner_name, email: f.email, phone: f.phone, whatsapp: f.whatsapp, city: f.city, address: f.address, pan_vat: f.pan_vat, rooms_count: f.rooms_count, about: f.about }, 1);
  };

  const nextFromBank = () => {
    if (!f.bank_name?.trim() || !f.bank_account_name?.trim() || !f.bank_account_number?.trim()) return setError('Please fill in bank name, account name and account number.');
    save({ bank_name: f.bank_name, bank_account_name: f.bank_account_name, bank_account_number: f.bank_account_number, bank_branch: f.bank_branch }, 3);
  };

  const upload = async (type: DocType, source: 'files' | 'photos') => {
    if (!partner) return;
    setError('');
    try {
      const file = await pickDocument(source);
      if (!file) return;
      setUploading(type);
      await uploadPartnerDoc(user.id, partner, type, file);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    } finally {
      setUploading(null);
    }
  };

  const send = async () => {
    if (!agree) return setError('Please accept the partner agreement to continue.');
    setError('');
    setBusy(true);
    try {
      await submitPartnerApplication();
      await refresh();
      router.replace('/partner');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker style={{ color: colors.primary }}>Partner application · step {step + 1} of 4</Kicker>
          <Text style={[type.displayMd, { marginTop: 8 }]}>{STEPS[step]}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: space.md }}>
            {STEPS.map((s, i) => (
              <Pressable key={s} onPress={() => partner && setStep(i as Step)} disabled={!partner} style={{ flex: 1, height: 6, borderRadius: radius.full, backgroundColor: i <= step ? colors.primary : colors.border }} accessibilityLabel={`Step ${i + 1}: ${s}`} />
            ))}
          </View>
        </Gutter>

        {locked ? (
          <Gutter style={{ marginTop: space.lg }}>
            <Callout icon={InfoIcon}>Your application has been sent and can’t be changed while our team checks it.</Callout>
          </Gutter>
        ) : null}

        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          {step === 0 ? (
            <>
              <View style={{ gap: 8 }}>
                <Kicker>Type of property</Kicker>
                <Segmented<PartnerKind> value={f.kind} onChange={(k) => set('kind', k)} options={[{ value: 'hotel', label: 'Hotel' }, { value: 'homestay', label: 'Homestay' }]} />
              </View>
              <Field label="Property name *" value={f.business_name} onChangeText={(v) => set('business_name', v)} placeholder={f.kind === 'homestay' ? 'e.g. Gurung Family Homestay' : 'e.g. Lakeside Mountain Hotel'} />
              <Field label="Owner / manager name" value={f.owner_name ?? ''} onChangeText={(v) => set('owner_name', v)} />
              <Field label="Phone *" value={f.phone ?? ''} onChangeText={(v) => set('phone', v)} placeholder="+977 98…" keyboardType="phone-pad" />
              <Field label="WhatsApp" value={f.whatsapp ?? ''} onChangeText={(v) => set('whatsapp', v)} placeholder="If different from phone" keyboardType="phone-pad" />
              <Field label="City / village *" value={f.city ?? ''} onChangeText={(v) => set('city', v)} placeholder="e.g. Pokhara" />
              <Field label="Full address *" value={f.address ?? ''} onChangeText={(v) => set('address', v)} placeholder="Street, ward, municipality, district" />
              <Field label="PAN / VAT number" value={f.pan_vat ?? ''} onChangeText={(v) => set('pan_vat', v)} keyboardType="number-pad" />
              <Field label="Number of rooms" value={f.rooms_count ? String(f.rooms_count) : ''} onChangeText={(v) => set('rooms_count', v ? Math.max(1, Math.min(2000, parseInt(v.replace(/\D/g, ''), 10) || 0)) || null : null)} keyboardType="number-pad" />
              <Field label="About your property" value={f.about ?? ''} onChangeText={(v) => set('about', v)} placeholder="What makes it special for travellers?" multiline />
            </>
          ) : null}

          {step === 1 && partner ? (
            <>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>Clear photos or PDFs, up to 10 MB each. Only our verification team can see these.</Text>
              {docsFor(partner.kind).map((d) => {
                const mine = docs.filter((x) => x.doc_type === d.type);
                return (
                  <Card key={d.type} style={{ gap: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      {mine.length ? <CheckCircleIcon size={22} color={colors.secondary} weight="fill" /> : <UploadSimpleIcon size={22} color={colors.onSurfaceVariant} />}
                      <View style={{ flex: 1 }}>
                        <Text style={type.headlineSm}>{d.label}{d.required ? ' *' : ''}</Text>
                        <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{d.hint}</Text>
                      </View>
                    </View>
                    {mine.map((m) => (
                      <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 32 }}>
                        {m.mime === 'application/pdf' ? <FilePdfIcon size={18} color={colors.primary} /> : <ImageIcon size={18} color={colors.primary} />}
                        <Text style={[type.bodySm, { flex: 1 }]} numberOfLines={1}>{m.file_name ?? 'file'}</Text>
                        {!locked ? (
                          <Pressable hitSlop={10} accessibilityLabel={`Remove ${m.file_name ?? 'file'}`} onPress={() => Alert.alert('Remove this file?', m.file_name ?? '', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: async () => { await removePartnerDoc(m).catch(() => {}); refresh(); } }])}>
                            <TrashIcon size={18} color={colors.destructive} />
                          </Pressable>
                        ) : null}
                      </View>
                    ))}
                    {!locked ? (
                      uploading === d.type ? (
                        <ActivityIndicator color={colors.primary} style={{ alignSelf: 'flex-start', marginLeft: 32 }} />
                      ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 32 }}>
                          <SoftButton label="Photo" icon={ImageIcon} onPress={() => upload(d.type, 'photos')} />
                          {d.type !== 'property_photo' ? <SoftButton label="PDF / file" icon={FilePdfIcon} onPress={() => upload(d.type, 'files')} /> : null}
                        </View>
                      )
                    ) : null}
                  </Card>
                );
              })}
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>Where we send your earnings from app payments. The account name should match your business or the owner.</Text>
              <Field label="Bank name *" value={f.bank_name ?? ''} onChangeText={(v) => set('bank_name', v)} placeholder="e.g. NIC Asia Bank" />
              <Field label="Account name *" value={f.bank_account_name ?? ''} onChangeText={(v) => set('bank_account_name', v)} />
              <Field label="Account number *" value={f.bank_account_number ?? ''} onChangeText={(v) => set('bank_account_number', v)} keyboardType="number-pad" />
              <Field label="Branch" value={f.bank_branch ?? ''} onChangeText={(v) => set('bank_branch', v)} placeholder="e.g. Lakeside, Pokhara" />
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Card style={{ gap: 10 }}>
                <Text style={type.headlineSm}>Mountain Planet partner agreement</Text>
                {[
                  `Commission is ${COMMISSION_PCT}% of the booking value, including bookings paid at your property.`,
                  'Guests can pay in the app or at your property. App payments are paid to your bank account weekly, after the guest’s check-in, minus commission.',
                  `For pay-at-property bookings you collect the full amount and we send you a monthly statement for the ${COMMISSION_PCT}% commission.`,
                  'You confirm or decline each booking request within 2 hours. Confirmed bookings must be honoured at the agreed price.',
                  'Your listing details, photos and prices must be accurate. Guest contact details are only for the booking.',
                  'Either side can end the partnership with 30 days’ notice. Confirmed bookings are still honoured.',
                ].map((t) => (
                  <View key={t} style={{ flexDirection: 'row', gap: 8 }}>
                    <Text style={type.bodySm}>•</Text>
                    <Text style={[type.bodySm, { flex: 1 }]}>{t}</Text>
                  </View>
                ))}
                <Text style={[type.labelSm, { color: colors.onSurfaceVariant }]}>Version {AGREEMENT_VERSION}</Text>
              </Card>
              <Checkbox label="I confirm the details and documents are true, and I accept the partner agreement." checked={agree} onChange={setAgree} />
            </>
          ) : null}

          {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}

          {!locked ? (
            <View style={{ gap: space.sm }}>
              {step === 0 ? <PrimaryButton label={busy ? 'Saving…' : 'Save and continue'} onPress={nextFromBusiness} disabled={busy} /> : null}
              {step === 1 ? <PrimaryButton label="Continue" onPress={() => setStep(2)} /> : null}
              {step === 2 ? <PrimaryButton label={busy ? 'Saving…' : 'Save and continue'} onPress={nextFromBank} disabled={busy} /> : null}
              {step === 3 ? <PrimaryButton label={busy ? 'Sending…' : 'Send for verification'} onPress={send} disabled={busy} /> : null}
              {step > 0 ? <SoftButton label="Back" onPress={() => setStep((step - 1) as Step)} style={{ alignSelf: 'center' }} /> : null}
            </View>
          ) : null}
        </Gutter>
      </Screen>
    </KeyboardAvoidingView>
  );
}
