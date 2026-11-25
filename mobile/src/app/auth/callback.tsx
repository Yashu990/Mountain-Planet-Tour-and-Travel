// Opened by the links in sign-up confirmation and password-reset emails.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { colors, space, type } from '@/theme';
import { completeAuthFromUrl } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Callout, Gutter, PrimaryButton, Screen } from '@/components/ui';
import { InfoIcon } from '@/components/icons';

export default function AuthCallback() {
  const url = Linking.useURL();
  const { toast } = useStore();
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      const link = url ?? (await Linking.getInitialURL());
      if (!link || !alive) return;
      try {
        const result = await completeAuthFromUrl(link);
        if (!alive) return;
        if (result === 'recovery') {
          router.replace({ pathname: '/account', params: { mode: 'newpassword' } });
        } else {
          toast('Email confirmed — you’re signed in');
          router.replace('/saved');
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'This link didn’t work. Please request a new one.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [url, toast]);

  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <Gutter style={{ alignItems: 'center', gap: space.lg }}>
        {error ? (
          <>
            <Callout icon={InfoIcon}>{error}</Callout>
            <PrimaryButton label="Go to sign in" onPress={() => router.replace('/account')} style={{ alignSelf: 'stretch' }} />
          </>
        ) : (
          <>
            <ActivityIndicator color={colors.primary} />
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant }]}>Signing you in…</Text>
          </>
        )}
      </Gutter>
    </Screen>
  );
}
