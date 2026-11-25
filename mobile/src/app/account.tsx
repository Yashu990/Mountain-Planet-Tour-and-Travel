import { CurrencyPicker } from '@/components/CurrencyPicker';
import { LanguagePicker } from '@/components/LanguagePicker';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Callout, Card, Field, Gutter, Hairline, Kicker, PrimaryButton, Screen, Section, SoftButton, TextButton } from '@/components/ui';
import { SignInOptions } from '@/components/SignInOptions';
import { useCurrency } from '@/lib/currency';
import { BackHeader } from '@/components/BackHeader';
import { Avatar } from '@/components/Avatar';
import { PartnerEntry } from '@/components/PartnerEntry';
import { LoginChoices } from '@/components/LoginChoices';
import { pickAndUploadAvatar } from '@/lib/avatar';
import { BookmarkSimpleIcon, CameraIcon, CheckCircleIcon, InfoIcon, ReceiptIcon, ShieldCheckIcon, UsersIcon } from '@/components/icons';

type Mode = 'signin' | 'signup' | 'reset';

export default function Account() {
  const auth = useAuth();
  const { saved, toast } = useStore();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const params = useLocalSearchParams<{ mode?: string }>();
  const [passwordDone, setPasswordDone] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const changePhoto = async () => {
    if (!auth.user) return;
    setPhotoBusy(true);
    try {
      const url = await pickAndUploadAvatar(auth.user.id);
      if (url) {
        await auth.saveProfile({ avatar_url: url });
        toast('Profile photo updated');
      }
    } catch (e) {
      Alert.alert('Photo not saved', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () =>
    run(async () => {
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Please enter a valid email.');
      if (mode === 'reset') {
        await auth.resetPassword(email);
        setNotice('Check your inbox for a link to set a new password.');
        return;
      }
      if (password.length < 6) throw new Error('Use a password with at least 6 characters.');
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please add your name.');
        const r = await auth.signUp(email, password, name);
        if (r === 'check-email') {
          setNotice('Almost there — open the confirmation email we just sent, then sign in here.');
          setMode('signin');
          return;
        }
      } else {
        await auth.signIn(email, password);
      }
      toast('Signed in — your board now syncs');
    });

  const confirmDelete = () =>
    Alert.alert('Delete your account?', 'This permanently deletes your account and synced saved trips. Stories you shared stay on the wall without your account linked.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account',
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await auth.deleteAccount();
            toast('Your account has been deleted');
            router.back();
          }),
      },
    ]);

  /* ---------- backend not configured ---------- */
  if (!auth.enabled) {
    return (
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker>Your account</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>Settings</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
            Sign-in isn’t switched on in this version yet, so your saved journeys and bookings are kept on this phone.
          </Text>
        </Gutter>
        <Section>
          <Gutter style={{ gap: space.lg }}>
            <LanguagePicker />
            <CurrencyPicker />
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <TextButton label="My bookings" onPress={() => router.push('/bookings')} />
              <TextButton label="Privacy" arrow={false} onPress={() => router.push('/legal/privacy')} />
              <TextButton label="Terms" arrow={false} onPress={() => router.push('/legal/terms')} />
            </View>
          </Gutter>
        </Section>
      </Screen>
    );
  }

  /* ---------- set a new password (from the reset email link) ---------- */
  if (auth.user && params.mode === 'newpassword' && !passwordDone) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Screen modal>
          <BackHeader close />
          <Gutter style={{ marginTop: space.md, gap: space.lg }}>
            <View>
              <Kicker>Reset password</Kicker>
              <Text style={[type.displayLg, { marginTop: 8 }]}>Choose a new password</Text>
              <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>For {auth.user.email}</Text>
            </View>
            <Field label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" placeholder="At least 6 characters" />
            {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
            {busy ? (
              <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />
            ) : (
              <PrimaryButton
                label="Save new password"
                onPress={() =>
                  run(async () => {
                    if (password.length < 6) throw new Error('Use a password with at least 6 characters.');
                    await auth.updatePassword(password);
                    setPassword('');
                    setPasswordDone(true);
                    toast('Password updated');
                  })
                }
              />
            )}
          </Gutter>
        </Screen>
      </KeyboardAvoidingView>
    );
  }

  /* ---------- signed in ---------- */
  if (auth.user) {
    const fullName = String(auth.user.user_metadata?.full_name ?? '').trim();
    return (
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ marginTop: space.md }}>
          <Pressable onPress={changePhoto} disabled={photoBusy} accessibilityRole="button" accessibilityLabel="Change profile photo" style={{ alignSelf: 'flex-start' }}>
            <Avatar size={88} />
            <View style={{ position: 'absolute', right: -2, bottom: -2, width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              {photoBusy ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <CameraIcon size={15} color={colors.onPrimary} weight="bold" />}
            </View>
          </Pressable>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 8 }]}>{auth.profile?.avatar_url ? 'Tap your photo to change it' : 'Tap to add a profile photo'}</Text>
          <Kicker style={{ marginTop: space.lg }}>Signed in</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>{fullName ? `Namaste, ${fullName.split(' ')[0]}` : 'Namaste'}</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 6 }]}>{auth.user.email}</Text>
        </Gutter>

        <Section>
          <Gutter>
            <Card style={{ gap: 14 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <BookmarkSimpleIcon size={24} color={colors.secondary} weight="duotone" />
                <View style={{ flex: 1 }}>
                  <Text style={type.headlineSm}>{saved.length} saved {saved.length === 1 ? 'journey' : 'journeys'}</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Synced to your account on every device</Text>
                </View>
              </View>
              <TextButton label="Open my board" onPress={() => { router.back(); setTimeout(() => router.navigate('/saved'), 50); }} style={{ alignSelf: 'flex-start', marginLeft: -4 }} />
            </Card>
            <Card style={{ gap: 14, marginTop: space.md }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <ReceiptIcon size={24} color={colors.secondary} weight="duotone" />
                <View style={{ flex: 1 }}>
                  <Text style={type.headlineSm}>My bookings</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Hotels, homestays, rides, flights and tickets</Text>
                </View>
              </View>
              <TextButton label="View bookings" onPress={() => router.push('/bookings')} style={{ alignSelf: 'flex-start', marginLeft: -4 }} />
            </Card>
          </Gutter>
        </Section>

        {auth.isAdmin ? (
          <Section>
            <Gutter>
              <Pressable onPress={() => router.push('/admin')} accessibilityRole="button">
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.onSurface }}>
                  <ShieldCheckIcon size={24} color={colors.surface} weight="duotone" />
                  <View style={{ flex: 1 }}>
                    <Text style={[type.headlineSm, { color: colors.surface }]}>Staff panel</Text>
                    <Text style={[type.bodySm, { color: 'rgba(253,252,248,0.75)' }]}>Bookings, prices, stories and reviews</Text>
                  </View>
                </Card>
              </Pressable>
            </Gutter>
          </Section>
        ) : null}

        <Section>
          <Gutter>
            <PartnerEntry />
          </Gutter>
        </Section>

        <ProfileEditor />

        <Section>
          <Gutter>
            <LanguagePicker />
          </Gutter>
        </Section>

        <Section>
          <Gutter style={{ gap: space.md }}>
            {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
            <PrimaryButton label="Sign out" onPress={() => run(async () => { await auth.signOut(); toast('Signed out'); })} disabled={busy} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }}>
              <TextButton label="Privacy" arrow={false} onPress={() => router.push('/legal/privacy')} />
              <TextButton label="Terms" arrow={false} onPress={() => router.push('/legal/terms')} />
            </View>
            <Hairline style={{ marginVertical: space.md }} />
            <TextButton label="Delete my account" arrow={false} onPress={confirmDelete} style={{ alignSelf: 'center' }} />
          </Gutter>
        </Section>
      </Screen>
    );
  }

  /* ---------- signed out ---------- */
  const title = mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset your password' : 'Welcome back';
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen modal>
        <BackHeader close />
        <Gutter style={{ marginTop: space.md }}>
          <Kicker>Your account</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>{title}</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
            Sign in to keep your Himalaya board on every device and see your trip requests.
          </Text>
        </Gutter>

        {mode !== 'reset' && !showEmail ? (
          <Gutter style={{ marginTop: space.lg }}>
            <SignInOptions onEmail={() => setShowEmail(true)} onDone={() => router.back()} />
          </Gutter>
        ) : null}

        {showEmail && mode !== 'reset' && (
          <Gutter style={{ flexDirection: 'row', gap: 8, marginTop: space.lg }}>
            {(['signin', 'signup'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setError(''); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === m }}
                style={{ paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.full, backgroundColor: mode === m ? colors.secondary : colors.surfaceAlt }}
              >
                <Text style={[type.labelMd, { color: mode === m ? colors.onSecondary : colors.onSurface }]}>{m === 'signin' ? 'Sign in' : 'Create account'}</Text>
              </Pressable>
            ))}
          </Gutter>
        )}

        {showEmail || mode === 'reset' ? (
        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          {mode === 'signup' && <Field label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="e.g. Sophie Laurent" />}
          <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
          {mode !== 'reset' && (
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              placeholder="At least 6 characters"
            />
          )}
          {notice ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <CheckCircleIcon size={20} color={colors.secondary} weight="duotone" />
              <Text style={[type.bodySm, { flex: 1 }]}>{notice}</Text>
            </View>
          ) : null}
          {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
          {busy ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 18 }} />
          ) : (
            <PrimaryButton label={mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'} icon={mode === 'signup' ? UsersIcon : undefined} onPress={submit} />
          )}
          <TextButton
            label={mode === 'reset' ? 'Back to sign in' : 'Forgot your password?'}
            arrow={false}
            onPress={() => { setMode(mode === 'reset' ? 'signin' : 'reset'); setError(''); setNotice(''); }}
            style={{ alignSelf: 'center' }}
          />
        </Gutter>
        ) : null}

        <Section>
          <Gutter>
            <LoginChoices />
          </Gutter>
        </Section>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const CURRENCIES = ['USD', 'NPR', 'INR', 'EUR', 'GBP', 'AUD'];

/** Name, phone, nationality and display currency, saved to the account. */
function ProfileEditor() {
  const auth = useAuth();
  const { toast } = useStore();
  const { setCurrency } = useCurrency();
  const p = auth.profile;
  const [form, setForm] = useState({ full_name: p?.full_name ?? '', phone: p?.phone ?? '', nationality: p?.nationality ?? '', currency: p?.currency ?? 'USD' });
  const [loadedFor, setLoadedFor] = useState(p?.id);
  if (p && loadedFor !== p.id) {
    setLoadedFor(p.id);
    setForm({ full_name: p.full_name ?? '', phone: p.phone ?? '', nationality: p.nationality ?? '', currency: p.currency ?? 'USD' });
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await auth.saveProfile({ full_name: form.full_name.trim() || null, phone: form.phone.trim() || null, nationality: form.nationality.trim() || null, currency: form.currency });
      setCurrency(form.currency);
      toast('Profile saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Section>
      <Gutter style={{ gap: space.md }}>
        <Text style={type.headlineMd}>Your details</Text>
        <Field label="Full name" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} autoComplete="name" placeholder="Your name" />
        <Field label="Phone / WhatsApp" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" autoComplete="tel" placeholder="+977 98…" />
        <Field label="Nationality (for permits)" value={form.nationality} onChangeText={(v) => setForm({ ...form, nationality: v })} placeholder="e.g. French" />
        <View style={{ gap: 10 }}>
          <Kicker>Show prices in</Kicker>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CURRENCIES.map((c) => (
              <Pressable key={c} onPress={() => setForm({ ...form, currency: c })} accessibilityRole="radio" accessibilityState={{ checked: form.currency === c }} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: form.currency === c ? colors.secondary : colors.surfaceAlt }}>
                <Text style={[type.labelMd, { color: form.currency === c ? colors.onSecondary : colors.onSurface }]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
        {busy ? <ActivityIndicator color={colors.primary} /> : <SoftButton label="Save details" onPress={save} style={{ alignSelf: 'flex-start' }} />}
      </Gutter>
    </Section>
  );
}
