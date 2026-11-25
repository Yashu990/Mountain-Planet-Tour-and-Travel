// Partner login: its own email + password sign-in / sign-up, separate from the traveller screens.
// After signing in, partners land on their partner home (application or dashboard).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Callout, Field, Gutter, Kicker, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { Segmented } from '@/components/form';
import { BackHeader } from '@/components/BackHeader';
import { CheckCircleIcon, InfoIcon, StorefrontIcon } from '@/components/icons';

type Mode = 'signin' | 'signup';

export default function PartnerLogin() {
  const auth = useAuth();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<Mode>(params.mode === 'signup' ? 'signup' : 'signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.includes('@')) return setError('Please enter your business email.');
    if (password.length < 8) return setError('Please use a password of at least 8 characters.');
    if (mode === 'signup' && name.trim().length < 2) return setError('Please enter the owner’s or manager’s name.');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const r = await auth.signUp(email.trim(), password, name.trim());
        if (r === 'check-email') {
          setCheckEmail(true);
          return;
        }
      } else {
        await auth.signIn(email.trim(), password);
      }
      router.replace('/partner');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.md }}>
          <StorefrontIcon size={36} color={colors.secondary} weight="duotone" />
          <Kicker style={{ marginTop: space.md, color: colors.primary }}>Partner login</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>{mode === 'signup' ? 'Create your partner account' : 'Welcome back, partner'}</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 8 }]}>
            {mode === 'signup' ? 'Use your business email. You’ll use this login to manage your property and bookings.' : 'Sign in to see your bookings, property and payouts.'}
          </Text>
        </Gutter>

        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          <Segmented value={mode} onChange={(m) => { setMode(m); setError(''); }} options={[{ value: 'signin', label: 'Sign in' }, { value: 'signup', label: 'Create account' }]} />
          {checkEmail ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
              <CheckCircleIcon size={22} color={colors.secondary} weight="fill" />
              <Text style={[type.bodyMd, { flex: 1 }]}>We’ve sent a confirmation link to {email}. Open it on this phone, then sign in here.</Text>
            </View>
          ) : null}
          {mode === 'signup' ? <Field label="Owner or manager name" value={name} onChangeText={setName} placeholder="e.g. Pemba Sherpa" autoComplete="name" /> : null}
          <Field label="Business email" value={email} onChangeText={setEmail} placeholder="you@yourhotel.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
          <PrimaryButton label={busy ? 'Please wait…' : mode === 'signup' ? 'Create partner account' : 'Sign in'} onPress={submit} disabled={busy} />
          {mode === 'signin' ? (
            <TextButton label="Forgot your password?" arrow={false} onPress={() => router.push({ pathname: '/account', params: { mode: 'reset' } })} style={{ alignSelf: 'center' }} />
          ) : null}
        </Gutter>
      </Screen>
    </KeyboardAvoidingView>
  );
}
