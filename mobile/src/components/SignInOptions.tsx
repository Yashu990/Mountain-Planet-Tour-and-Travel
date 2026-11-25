import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, space, squircle, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Callout, Field, PrimaryButton, TextButton } from './ui';
import { EnvelopeSimpleIcon, InfoIcon, PhoneIcon, type Icon } from './icons';

function GoogleG({ size = 20 }: { size?: number }) {
  // Simple four-colour "G" mark drawn with text, so no extra image asset is needed.
  return <Text style={{ fontFamily: fonts.sansBold, fontSize: size, color: '#4285F4', width: size, textAlign: 'center' }}>G</Text>;
}

function OptionButton({ label, onPress, icon: I, mark, dark }: { label: string; onPress: () => void; icon?: Icon; mark?: React.ReactNode; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.option, dark && styles.optionDark, pressed && { opacity: 0.75 }]}>
      {mark ?? (I ? <I size={20} color={dark ? '#fff' : colors.onSurface} /> : null)}
      <Text style={[type.labelMd, { fontFamily: fonts.sansSemi, color: dark ? '#fff' : colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Sign-in choices: Google, Apple (iOS), phone code, email.
 * `onEmail` lets the parent show its own email form; `onDone` runs after a successful sign-in.
 */
export function SignInOptions({ onEmail, onDone }: { onEmail: () => void; onDone: () => void }) {
  const auth = useAuth();
  const { toast } = useStore();
  const [mode, setMode] = useState<'choose' | 'phone' | 'code'>('choose');
  const [phone, setPhone] = useState('+977');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const provider = (p: 'google' | 'apple') =>
    run(async () => {
      const r = await auth.signInWithProvider(p);
      if (r === 'signed-in') {
        toast('Signed in');
        onDone();
      }
    });

  if (mode === 'phone' || mode === 'code') {
    return (
      <View style={{ gap: space.md }}>
        {mode === 'phone' ? (
          <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="+977 98XXXXXXXX" />
        ) : (
          <>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>We sent a 6-digit code to {phone}.</Text>
            <Field label="Code" value={code} onChangeText={setCode} keyboardType="number-pad" autoComplete="sms-otp" textContentType="oneTimeCode" maxLength={6} placeholder="123456" />
          </>
        )}
        {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
        {busy ? (
          <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
        ) : mode === 'phone' ? (
          <PrimaryButton label="Send code" onPress={() => run(async () => { await auth.sendPhoneCode(phone); setMode('code'); })} />
        ) : (
          <PrimaryButton
            label="Verify & sign in"
            onPress={() =>
              run(async () => {
                await auth.verifyPhoneCode(phone, code);
                toast('Signed in');
                onDone();
              })
            }
          />
        )}
        <TextButton label="Other ways to sign in" arrow={false} onPress={() => { setMode('choose'); setError(''); }} style={{ alignSelf: 'center' }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <OptionButton label="Continue with Google" onPress={() => provider('google')} mark={<GoogleG />} />
      {Platform.OS === 'ios' ? <OptionButton label="Continue with Apple" onPress={() => provider('apple')} mark={<Text style={{ color: '#fff', fontSize: 20 }}></Text>} dark /> : null}
      <OptionButton label="Continue with phone" onPress={() => setMode('phone')} icon={PhoneIcon} />
      <OptionButton label="Continue with email" onPress={onEmail} icon={EnvelopeSimpleIcon} />
      {busy ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Callout icon={InfoIcon}>{error}</Callout> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface, ...squircle },
  optionDark: { backgroundColor: '#000', borderColor: '#000' },
});
