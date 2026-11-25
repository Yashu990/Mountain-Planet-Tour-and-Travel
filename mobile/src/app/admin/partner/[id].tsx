// Staff: review one partner application — details, private documents (signed links), approve / reject.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { docLink, docsFor, getPartnerForStaff, KIND_LABEL, reviewPartner, STATUS_TEXT, type Partner, type PartnerDoc } from '@/lib/partners';
import { Callout, Card, Field, Gutter, Hairline, Kicker, PrimaryButton, Screen, SoftButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { CheckCircleIcon, FilePdfIcon, InfoIcon, XCircleIcon } from '@/components/icons';

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={{ gap: 2 }}>
      <Kicker>{label}</Kicker>
      <Text style={type.bodyMd} selectable>{String(value)}</Text>
    </View>
  );
}

function DocTile({ doc }: { doc: PartnerDoc }) {
  const [url, setUrl] = useState<string | null>(null);
  useFocusEffect(
    useCallback(() => {
      docLink(doc.path).then(setUrl);
    }, [doc.path]),
  );
  const isPdf = doc.mime === 'application/pdf';
  return (
    <Pressable onPress={() => url && Linking.openURL(url)} accessibilityRole="link" accessibilityLabel={`Open ${doc.file_name ?? 'document'}`} style={{ width: 96, gap: 4 }}>
      <View style={{ width: 96, height: 96, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        {isPdf || !url ? <FilePdfIcon size={34} color={colors.primary} /> : <Image source={{ uri: url }} style={{ width: 96, height: 96 }} contentFit="cover" />}
      </View>
      <Text style={[type.labelSm, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{doc.file_name ?? 'file'}</Text>
    </Pressable>
  );
}

export default function StaffPartnerDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [data, setData] = useState<{ partner: Partner; docs: PartnerDoc[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setData(await getPartnerForStaff(id));
    setLoading(false);
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      if (isAdmin) load();
    }, [isAdmin, load]),
  );

  if (!isAdmin) return <Screen><BackHeader /><Gutter><Text style={type.bodyMd}>Staff only.</Text></Gutter></Screen>;
  if (loading || !data) return <Screen><BackHeader /><ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} /></Screen>;
  const { partner: p, docs } = data;

  const decide = (decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && note.trim().length < 5) {
      Alert.alert('Add a reason', 'Tell the partner what to fix, e.g. “PAN certificate photo is blurry”.');
      return;
    }
    Alert.alert(decision === 'approved' ? `Approve ${p.business_name}?` : 'Send back for changes?', decision === 'approved' ? 'They become a verified partner and can set up their listing.' : note.trim(), [
      { text: 'Cancel', style: 'cancel' },
      {
        text: decision === 'approved' ? 'Approve' : 'Send back',
        style: decision === 'approved' ? 'default' : 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            await reviewPartner(p.id, decision, note.trim() || undefined);
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
        <Kicker>{KIND_LABEL[p.kind]} · {STATUS_TEXT[p.status]}</Kicker>
        <Text style={type.displayMd}>{p.business_name}</Text>
      </Gutter>

      <Gutter style={{ marginTop: space.lg, gap: space.md }}>
        <Card style={{ gap: 12 }}>
          <Row label="Owner / manager" value={p.owner_name} />
          <Row label="Email" value={p.email} />
          <Row label="Phone" value={p.phone} />
          <Row label="WhatsApp" value={p.whatsapp} />
          <Row label="Address" value={[p.address, p.city].filter(Boolean).join(', ')} />
          <Row label="PAN / VAT" value={p.pan_vat} />
          <Row label="Rooms" value={p.rooms_count} />
          <Row label="About" value={p.about} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {p.phone ? <SoftButton label="Call" onPress={() => Linking.openURL(`tel:${p.phone}`)} /> : null}
            {p.whatsapp || p.phone ? <SoftButton label="WhatsApp" onPress={() => Linking.openURL(`https://wa.me/${(p.whatsapp || p.phone || '').replace(/\D/g, '')}`)} /> : null}
            {p.email ? <SoftButton label="Email" onPress={() => Linking.openURL(`mailto:${p.email}`)} /> : null}
          </View>
        </Card>

        <Card style={{ gap: 12 }}>
          <Text style={type.headlineSm}>Bank for payouts</Text>
          <Row label="Bank" value={[p.bank_name, p.bank_branch].filter(Boolean).join(' · ')} />
          <Row label="Account name" value={p.bank_account_name} />
          <Row label="Account number" value={p.bank_account_number} />
        </Card>

        <Card style={{ gap: 14 }}>
          <Text style={type.headlineSm}>Documents</Text>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Tap a file to open it (link valid for 10 minutes).</Text>
          {docsFor(p.kind).map((d) => {
            const mine = docs.filter((x) => x.doc_type === d.type);
            return (
              <View key={d.type} style={{ gap: 8 }}>
                <Hairline />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {mine.length ? <CheckCircleIcon size={18} color={colors.secondary} weight="fill" /> : <XCircleIcon size={18} color={d.required ? colors.destructive : colors.onSurfaceVariant} />}
                  <Text style={[type.labelMd, { flex: 1 }]}>{d.label}{d.required ? ' *' : ''}</Text>
                </View>
                {mine.length ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{mine.map((m) => <DocTile key={m.id} doc={m} />)}</View> : null}
              </View>
            );
          })}
        </Card>

        <Card style={{ gap: 6 }}>
          <Row label="Agreement" value={p.agreement_accepted_at ? `Accepted ${new Date(p.agreement_accepted_at).toLocaleString()} (${p.commission_pct}% commission)` : 'Not accepted yet'} />
          {p.review_note ? <Row label="Last note to partner" value={p.review_note} /> : null}
        </Card>

        {p.status === 'submitted' ? (
          <>
            <Field label="Note to partner (needed to send back)" value={note} onChangeText={setNote} placeholder="e.g. Please upload a clearer PAN certificate" multiline />
            <PrimaryButton label={busy ? 'Saving…' : 'Approve partner'} onPress={() => decide('approved')} disabled={busy} />
            <SoftButton label="Send back for changes" onPress={() => decide('rejected')} style={{ alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 14 }} />
          </>
        ) : (
          <Callout icon={InfoIcon}>{p.status === 'draft' ? 'The partner hasn’t sent this application yet.' : `Status: ${STATUS_TEXT[p.status]}.`}</Callout>
        )}
      </Gutter>
    </Screen>
  );
}
