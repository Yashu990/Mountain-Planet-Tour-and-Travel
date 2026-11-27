// Partner home. Shows the right thing for where the partner is:
// signed out → why partner + partner login · no application → start · draft → continue ·
// submitted → under review · rejected → staff note + fix · approved → partner dashboard.
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { fetchPartnerBookings, type PartnerBooking } from '@/lib/partnerBookings';
import { colors, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { LISTING_STATUS, useMyListing } from '@/lib/listings';
import { rupees } from '@/lib/currency';
import { COMMISSION_PCT, KIND_LABEL, STATUS_TEXT, useMyPartner, type Partner } from '@/lib/partners';
import { Callout, Card, Gutter, Kicker, PrimaryButton, Screen, Section, SoftButton, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import {
  BedIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyCircleDollarIcon,
  HandshakeIcon,
  InfoIcon,
  ReceiptIcon,
  SealCheckIcon,
  ShieldCheckIcon,
  type Icon,
} from '@/components/icons';

function Perk({ icon: I, title, text }: { icon: Icon; title: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
      <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <I size={20} color={colors.primary} weight="duotone" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.headlineSm}>{title}</Text>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 2 }]}>{text}</Text>
      </View>
    </View>
  );
}

export default function PartnerHome({ inTab = false }: { inTab?: boolean }) {
  const { user, enabled, signOut } = useAuth();
  const { partner, loading, refresh } = useMyPartner(user?.id);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  if (!enabled) {
    return (
      <Screen tabs={inTab}>
        {inTab ? null : <BackHeader />}
        <Gutter style={{ marginTop: space.lg }}>
          <Callout icon={InfoIcon}>Partner sign-up needs the app to be connected to our servers. Please try again later.</Callout>
        </Gutter>
      </Screen>
    );
  }

  /* ---------- signed out: pitch + partner login ---------- */
  if (!user) {
    return (
      <Screen tabs={inTab}>
        {inTab ? null : <BackHeader />}
        <Gutter style={{ marginTop: space.md }}>
          <Kicker style={{ color: colors.primary }}>For hotels & homestays</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>Grow with Mountain Planet</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
            List your property, set your own prices and get bookings from trekkers and travellers across the world.
          </Text>
        </Gutter>
        <Section>
          <Gutter style={{ gap: space.lg }}>
            <Perk icon={CurrencyCircleDollarIcon} title={`${COMMISSION_PCT}% commission, nothing else`} text="No sign-up fee and no monthly fee. You only pay when a guest stays." />
            <Perk icon={ReceiptIcon} title="Guests pay in the app or at your property" text="App payments are paid out to your bank every week, minus commission." />
            <Perk icon={CalendarBlankIcon} title="You stay in control" text="Accept or decline each booking request, and open or close your dates any time." />
            <Perk icon={SealCheckIcon} title="Verified partner badge" text="We check every partner, so travellers book with confidence." />
          </Gutter>
        </Section>
        <Section>
          <Gutter style={{ gap: space.md }}>
            <PrimaryButton label="Create partner account" onPress={() => router.push({ pathname: '/partner/login', params: { mode: 'signup' } })} />
            <SoftButton label="Partner sign in" onPress={() => router.push('/partner/login')} style={{ alignSelf: 'stretch', justifyContent: 'center', paddingVertical: 14 }} />
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Cabs and trek operators: coming soon.</Text>
          </Gutter>
        </Section>
      </Screen>
    );
  }

  if (loading && !partner) {
    return (
      <Screen tabs={inTab}>
        {inTab ? null : <BackHeader />}
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </Screen>
    );
  }

  return (
    <Screen tabs={inTab}>
      {inTab ? null : <BackHeader />}
      <Gutter style={{ marginTop: space.md }}>
        <Kicker style={{ color: colors.primary }}>Partner</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>{partner?.business_name || 'Your partner account'}</Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 6 }]}>{user.email}</Text>
      </Gutter>

      {!partner ? <Start /> : partner.status === 'approved' ? <Dashboard partner={partner} /> : <Progress partner={partner} />}

      <Section>
        <Gutter style={{ alignItems: 'center' }}>
          <TextButton label="Sign out" arrow={false} onPress={async () => { await signOut(); router.replace('/partner'); }} />
        </Gutter>
      </Section>
    </Screen>
  );
}

function Start() {
  return (
    <Section>
      <Gutter style={{ gap: space.md }}>
        <Card style={{ gap: 10 }}>
          <HandshakeIcon size={28} color={colors.secondary} weight="duotone" />
          <Text style={type.headlineMd}>Apply in about 10 minutes</Text>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
            Have these ready: owner’s citizenship or passport, PAN / VAT certificate, your tourism licence or homestay registration, bank details and a few photos of the property.
          </Text>
        </Card>
        <PrimaryButton label="Start application" onPress={() => router.push('/partner/apply')} />
      </Gutter>
    </Section>
  );
}

function Progress({ partner }: { partner: Partner }) {
  const steps: { label: string; done: boolean; current?: boolean }[] = [
    { label: 'Business details, documents and bank', done: partner.status !== 'draft' },
    { label: 'Agreement accepted and sent', done: partner.status === 'submitted' || partner.status === 'rejected', current: partner.status === 'draft' },
    { label: 'Checked by our team (usually 1–2 working days)', done: false, current: partner.status === 'submitted' },
    { label: 'Add rooms, photos and prices — then go live', done: false },
  ];
  return (
    <Section>
      <Gutter style={{ gap: space.md }}>
        <View style={{ alignSelf: 'flex-start', backgroundColor: partner.status === 'rejected' ? colors.destructiveSoft : colors.primarySoft, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 }}>
          <Text style={[type.labelMd, { color: partner.status === 'rejected' ? colors.destructive : colors.primary }]}>{STATUS_TEXT[partner.status]}</Text>
        </View>
        {partner.status === 'rejected' && partner.review_note ? (
          <Callout icon={InfoIcon}>{`Our team asked for a change: “${partner.review_note}”. Please fix it and send again.`}</Callout>
        ) : null}
        {partner.status === 'suspended' ? <Callout icon={InfoIcon}>Your partner account is paused. Please contact our team.</Callout> : null}
        <Card style={{ gap: 14 }}>
          {steps.map((s) => (
            <View key={s.label} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              {s.done ? <CheckCircleIcon size={22} color={colors.secondary} weight="fill" /> : <ClockIcon size={22} color={s.current ? colors.primary : colors.onSurfaceVariant} weight={s.current ? 'fill' : 'regular'} />}
              <Text style={[type.bodyMd, { flex: 1, color: s.done || s.current ? colors.onSurface : colors.onSurfaceVariant }]}>{s.label}</Text>
            </View>
          ))}
        </Card>
        {partner.status === 'draft' || partner.status === 'rejected' ? (
          <PrimaryButton label={partner.status === 'rejected' ? 'Fix and send again' : 'Continue application'} onPress={() => router.push('/partner/apply')} />
        ) : null}
        {partner.status === 'submitted' ? (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>We’ll email you and update this screen as soon as your application is checked.</Text>
        ) : null}
      </Gutter>
    </Section>
  );
}

function ListingCard({ partner }: { partner: Partner }) {
  const { listing, rooms, refresh } = useMyListing(partner.id);
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );
  return (
    <Section>
      <Gutter style={{ gap: space.md }}>
        <Text style={type.headlineLg}>{listing ? 'Your listing' : 'Next: list your property'}</Text>
        <Pressable onPress={() => router.push('/partner/listing')} accessibilityRole="button" accessibilityLabel={listing ? 'Edit your listing' : 'Set up your listing'}>
          <Card style={{ gap: 10 }}>
            {listing?.images[0] ? (
              <Image source={{ uri: listing.images[0] }} style={{ height: 150, borderRadius: radius.lg }} contentFit="cover" />
            ) : (
              <BedIcon size={28} color={colors.secondary} weight="duotone" />
            )}
            <Text style={type.headlineSm}>{listing ? listing.name : 'Rooms, photos and prices'}</Text>
            {listing ? (
              <>
                <Text style={[type.labelMd, { color: listing.status === 'live' ? colors.secondary : listing.status === 'rejected' ? colors.destructive : colors.primary }]}>{LISTING_STATUS[listing.status]}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
                  {listing.images.length} photos · {rooms.length} room {rooms.length === 1 ? 'type' : 'types'}
                  {listing.price_from_npr ? ` · from ${rupees(listing.price_from_npr)} a night` : ''}
                </Text>
              </>
            ) : (
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Add photos, facilities and your room types with prices. Our team checks it once, then travellers can find and book you.</Text>
            )}
            <Text style={[type.labelMd, { color: colors.primary }]}>{listing ? 'Open listing →' : 'Set up my listing →'}</Text>
          </Card>
        </Pressable>
      </Gutter>
    </Section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ flex: 1, minWidth: 140, gap: 4 }}>
      <Kicker>{label}</Kicker>
      <Text style={type.headlineLg}>{value}</Text>
    </Card>
  );
}

function Dashboard({ partner }: { partner: Partner }) {
  const [rows, setRows] = useState<PartnerBooking[] | null>(null);
  useFocusEffect(
    useCallback(() => {
      fetchPartnerBookings().then(setRows).catch(() => setRows([]));
    }, []),
  );
  const today = new Date().toISOString().slice(0, 10);
  const pending = rows?.filter((b) => b.partner_status === 'pending' && b.status === 'requested').length;
  const upcoming = rows?.filter((b) => b.partner_status === 'accepted' && b.status !== 'cancelled' && b.end_date >= today).length;
  return (
    <>
      <Section>
        <Gutter style={{ gap: space.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ShieldCheckIcon size={20} color={colors.secondary} weight="fill" />
            <Text style={[type.labelMd, { color: colors.secondary }]}>Verified partner · {KIND_LABEL[partner.kind]} · {partner.city}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <Stat label="New requests" value={pending == null ? '…' : String(pending)} />
            <Stat label="Upcoming stays" value={upcoming == null ? '…' : String(upcoming)} />
            <Stat label="Commission" value={`${partner.commission_pct}%`} />
          </View>
        </Gutter>
      </Section>
      <Section>
        <Gutter>
          <Pressable onPress={() => router.push('/partner/bookings')} accessibilityRole="button" accessibilityLabel="Bookings">
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: pending ? 2 : 0, borderColor: colors.primary }}>
              <ReceiptIcon size={26} color={colors.secondary} weight="duotone" />
              <View style={{ flex: 1 }}>
                <Text style={type.headlineSm}>Bookings</Text>
                <Text style={[type.bodySm, { color: pending ? colors.primary : colors.onSurfaceVariant }]}>
                  {pending ? `${pending} waiting for your answer — reply within 2 hours` : 'Requests, upcoming guests and earnings'}
                </Text>
              </View>
            </Card>
          </Pressable>
        </Gutter>
      </Section>
      <ListingCard partner={partner} />
    </>
  );
}
