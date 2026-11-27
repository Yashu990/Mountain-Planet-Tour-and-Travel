// Side menu (opened from ☰ on Home): profile card, quick buttons, shortcuts, help, hosting,
// settings (language, currency), legal and app version — travel-app menu structure, degine.md style.
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { colors, fonts, radius, squircle } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { CONTACT } from '@/data/tours';
import { img } from '@/lib/images';
import { Avatar } from '@/components/Avatar';
import { LanguagePicker } from '@/components/LanguagePicker';
import { CurrencyPicker } from '@/components/CurrencyPicker';
import {
  BellIcon,
  BookOpenTextIcon,
  CaretRightIcon,
  ChatCircleDotsIcon,
  CompassIcon,
  CurrencyCircleDollarIcon,
  FileTextIcon,
  GlobeHemisphereEastIcon,
  HeartIcon,
  InfoIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StarIcon,
  StorefrontIcon,
  SuitcaseRollingIcon,
  SunIcon,
  UserCircleIcon,
  XIcon,
  type Icon,
} from '@/components/icons';

const CARD = '#FFFFFF';

function Row({ icon: I, label, sub, onPress, last }: { icon: Icon; label: string; sub?: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && { backgroundColor: colors.surfaceAlt }]} accessibilityRole="button" accessibilityLabel={label}>
      <I size={22} color={colors.onSurface} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <CaretRightIcon size={16} color={colors.primary} weight="bold" />
    </Pressable>
  );
}

export default function Menu() {
  const insets = useSafeAreaInsets();
  const { user, profile, isAdmin, enabled } = useAuth();
  const { currency } = useCurrency();
  const { lang } = useI18n();
  const [picker, setPicker] = useState<null | 'lang' | 'cur'>(null);
  const name = String(profile?.full_name || user?.user_metadata?.full_name || '').trim();
  const go = (path: Parameters<typeof router.push>[0]) => {
    router.back();
    setTimeout(() => router.push(path), 60);
  };
  const tab = (path: '/trips' | '/saved' | '/explore') => {
    router.back();
    setTimeout(() => router.navigate(path), 60);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceAlt }}>
      <ScrollView contentContainerStyle={{ padding: 14, paddingTop: insets.top + 10, paddingBottom: insets.bottom + 30, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel="Close menu">
            <XIcon size={20} color={colors.onSurface} weight="bold" />
          </Pressable>
        </View>

        {/* profile card */}
        <Pressable onPress={() => go('/account')} style={styles.profile} accessibilityRole="button" accessibilityLabel={user ? 'Your profile' : 'Sign in'}>
          <Avatar size={52} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName} numberOfLines={1}>{user ? name || 'Traveller' : 'Hello, traveller'}</Text>
            <Text style={styles.profileSub} numberOfLines={1}>{user ? user.email : enabled ? 'Login or create an account' : 'Settings'}</Text>
          </View>
          <CaretRightIcon size={18} color="#fff" weight="bold" />
        </Pressable>

        {/* quick buttons */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { icon: SuitcaseRollingIcon, label: 'My Trips', on: () => tab('/trips') },
            { icon: UserCircleIcon, label: 'Profile', on: () => go('/account') },
            { icon: HeartIcon, label: 'Wishlist', on: () => tab('/saved') },
          ].map((b) => (
            <Pressable key={b.label} onPress={b.on} style={({ pressed }) => [styles.quick, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={b.label}>
              <b.icon size={24} color={colors.onSurface} />
              <Text style={styles.quickLabel}>{b.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* feature cards */}
        <Pressable onPress={() => go('/ai')} style={styles.card} accessibilityRole="button">
          <View style={styles.cardRow}>
            <View style={[styles.badgeIcon, { backgroundColor: colors.primarySoft }]}><SparkleIcon size={22} color={colors.primary} weight="fill" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Planet AI trip planner</Text>
              <Text style={styles.rowSub}>Tell us your days, budget and dream — get a plan</Text>
            </View>
            <CaretRightIcon size={16} color={colors.primary} weight="bold" />
          </View>
        </Pressable>
        <Pressable onPress={() => tab('/explore')} style={styles.card} accessibilityRole="button">
          <View style={styles.cardRow}>
            <View style={[styles.badgeIcon, { backgroundColor: 'rgba(90,107,65,0.14)' }]}><CompassIcon size={22} color={colors.secondary} weight="duotone" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Where to go</Text>
              <Text style={styles.rowSub}>Ideas for your next Himalayan trip</Text>
            </View>
            <CaretRightIcon size={16} color={colors.primary} weight="bold" />
          </View>
        </Pressable>

        {/* main list */}
        <View style={styles.card}>
          <Row icon={ChatCircleDotsIcon} label="Customer support" sub={CONTACT.email} onPress={() => Linking.openURL(`mailto:${CONTACT.email}`)} />
          <Row icon={BellIcon} label="My bookings" onPress={() => tab('/trips')} />
          <Row icon={SunIcon} label="Trek tools & weather" onPress={() => go('/tools')} />
          <Row icon={GlobeHemisphereEastIcon} label="Destinations" onPress={() => go('/destinations')} />
          <Row icon={BookOpenTextIcon} label="Traveller stories" onPress={() => go('/stories')} />
          <Row icon={StarIcon} label="Share your story" onPress={() => go('/share-story')} last />
        </View>

        {/* hosting */}
        <Pressable onPress={() => go('/partner')} style={[styles.card, styles.cardRow]} accessibilityRole="button">
          <Image source={img('/img/bhaktapur.jpg')} style={{ width: 54, height: 54, borderRadius: radius.md }} contentFit="cover" />
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Get started with hosting</Text>
            <Text style={styles.rowSub}>List your hotel or homestay & earn extra income</Text>
          </View>
          <CaretRightIcon size={16} color={colors.primary} weight="bold" />
        </Pressable>

        <View style={styles.card}>
          <Row icon={StorefrontIcon} label="Partner login" sub="Hotels & homestays" onPress={() => go('/partner/login')} />
          <Row icon={ShieldCheckIcon} label={isAdmin ? 'Staff panel' : 'Staff login'} sub="Mountain Planet team" onPress={() => go(isAdmin ? '/admin' : '/admin/login')} last />
        </View>

        {/* settings */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Settings</Text>
          <Row icon={GlobeHemisphereEastIcon} label="Language" sub={lang ? lang.toUpperCase() : 'English'} onPress={() => setPicker(picker === 'lang' ? null : 'lang')} />
          {picker === 'lang' ? <View style={{ padding: 12 }}><LanguagePicker /></View> : null}
          <Row icon={CurrencyCircleDollarIcon} label="Currency" sub={currency} onPress={() => setPicker(picker === 'cur' ? null : 'cur')} last={picker !== 'cur'} />
          {picker === 'cur' ? <View style={{ padding: 12 }}><CurrencyPicker /></View> : null}
        </View>

        <View style={styles.card}>
          <Row icon={InfoIcon} label="About us" onPress={() => go('/about')} />
          <Row icon={FileTextIcon} label="Privacy policy" onPress={() => go('/legal/privacy')} />
          <Row icon={FileTextIcon} label="Terms & conditions" onPress={() => go('/legal/terms')} last />
        </View>

        <Text style={styles.version}>Mountain Planet · version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  close: { width: 40, height: 40, borderRadius: 20, backgroundColor: CARD, alignItems: 'center', justifyContent: 'center' },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.primary, ...squircle },
  profileName: { fontFamily: fonts.sansBold, fontSize: 18, color: '#fff' },
  profileSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 2 },
  quick: { flex: 1, backgroundColor: CARD, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, ...squircle },
  quickLabel: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.onSurface },
  card: { backgroundColor: CARD, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...squircle },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  badgeIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 14 },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowLabel: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.onSurface },
  rowSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant, marginTop: 1 },
  sectionLabel: { paddingHorizontal: 14, paddingTop: 12, fontFamily: fonts.sansBold, fontSize: 13, color: colors.onSurfaceVariant },
  version: { textAlign: 'center', fontFamily: fonts.sans, fontSize: 12, color: colors.onSurfaceVariant, marginTop: 6 },
});
