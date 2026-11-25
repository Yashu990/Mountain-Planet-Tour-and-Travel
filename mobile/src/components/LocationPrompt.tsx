// One-time sheet asking to use location so prices show in the traveller's own currency.
// "Allow location" opens the phone's permission dialog; "Not now" keeps the region-based guess.
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, type } from '@/theme';
import { detectCurrencyFromLocation, useCurrency } from '@/lib/currency';
import { useStore } from '@/lib/store';
import { MAX_CONTENT_WIDTH } from '@/lib/layout';
import { PrimaryButton, TextButton } from './ui';
import { MapPinIcon } from './icons';

export function LocationPrompt({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const { currency, setCurrency } = useCurrency();
  const { toast } = useStore();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const allow = async () => {
    setBusy(true);
    setNote('');
    try {
      const found = await detectCurrencyFromLocation();
      if (found) {
        setCurrency(found.currency);
        toast(`Prices now shown in ${found.currency} for ${found.country}`);
        onDone();
      } else {
        setNote(`Location is off, so we’ll keep showing ${currency}. You can change it any time in Account → Show prices in.`);
      }
    } catch {
      setNote(`We couldn’t find your location right now, so prices stay in ${currency}. You can change it in Account.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={onDone}>
      <Pressable style={styles.backdrop} onPress={onDone} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.icon}>
          <MapPinIcon size={30} color={colors.primary} weight="duotone" />
        </View>
        <Text style={[type.headlineLg, { textAlign: 'center' }]}>See prices in your currency</Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          Allow location once and we’ll show every price in your local currency. We don’t store or track your location.
        </Text>
        {note ? <Text style={[type.bodySm, { color: colors.destructive, textAlign: 'center' }]}>{note}</Text> : null}
        {busy ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 18 }} />
        ) : note ? (
          <PrimaryButton label="OK" onPress={onDone} style={{ alignSelf: 'stretch' }} />
        ) : (
          <>
            <PrimaryButton label="Allow location" icon={MapPinIcon} onPress={allow} style={{ alignSelf: 'stretch' }} />
            <TextButton label={`Not now, keep ${currency}`} arrow={false} onPress={onDone} />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(45,43,38,0.35)' },
  sheet: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderCurve: 'continuous',
    paddingHorizontal: space.gutter,
    paddingTop: 28,
    alignItems: 'center',
    gap: 14,
    ...shadow.sheet,
  },
  icon: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
