// Staff login: email + password for Mountain Planet team accounts, straight into the Staff panel.
// Staff accounts are made in Supabase (profiles.role = 'admin'); there is no sign-up here.
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text } from 'react-native';
import { router } from 'expo-router';
import { colors, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { Callout, Field, Gutter, Kicker, PrimaryButton, Screen, TextButton } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';
import { InfoIcon, ShieldCheckIcon } from '@/components/icons';

export default function StaffLogin() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);

  // After signing in, wait for the profile to load, then open the panel (or explain it isn't a staff account).
  useEffect(() => {
    if (!waiting || !auth.user || !auth.profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to the profile arriving after sign-in
    setWaiting(false);
    if (auth.isAdmin) router.replace('/admin');
    else setError('This account isn’t a staff account. Ask your manager to give it staff access in Supabase.');
  }, [waiting, auth.user, auth.profile, auth.isAdmin]);

  const submit = async () => {
    setError('');
    if (!email.includes('@') || !password) return setError('Please enter your staff email and password.');
    setBusy(true);
    try {
      await auth.signIn(email.trim(), password);
      setWaiting(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <BackHeader />
        <Gutter style={{ marginTop: space.md }}>
          <ShieldCheckIcon size={36} color={colors.secondary} weight="duotone" />
          <Kicker style={{ marginTop: space.md, color: colors.primary }}>Staff login</Kicker>
          <Text style={[type.displayLg, { marginTop: 8 }]}>Mountain Planet team</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 8 }]}>Bookings, prices, partner applications and listings.</Text>
        </Gutter>
        <Gutter style={{ marginTop: space.lg, gap: space.lg }}>
          {auth.user && auth.isAdmin ? (
            <PrimaryButton label="Open Staff panel" onPress={() => router.replace('/admin')} />
          ) : (
            <>
              <Field label="Staff email" value={email} onChangeText={setEmail} placeholder="you@mountainplanetnepal.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" />
              {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
              <PrimaryButton label={busy || waiting ? 'Signing in…' : 'Sign in'} onPress={submit} disabled={busy || waiting} />
              <TextButton label="Forgot your password?" arrow={false} onPress={() => router.push({ pathname: '/account', params: { mode: 'reset' } })} style={{ alignSelf: 'center' }} />
            </>
          )}
        </Gutter>
      </Screen>
    </KeyboardAvoidingView>
  );
}
