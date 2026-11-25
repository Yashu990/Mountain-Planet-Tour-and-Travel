import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space } from '@/theme';
import { ArrowLeftIcon, XIcon } from './icons';

/** Chrome-less top bar for non-image screens: a quiet circular back (or close) button. */
export function BackHeader({ close = false, right }: { close?: boolean; right?: React.ReactNode }) {
  const go = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const I = close ? XIcon : ArrowLeftIcon;
  return (
    <View style={styles.bar}>
      <Pressable onPress={go} hitSlop={8} style={({ pressed }) => [styles.btn, pressed && { transform: [{ scale: 0.94 }] }]} accessibilityRole="button" accessibilityLabel={close ? 'Close' : 'Back'}>
        <I size={22} color={colors.onSurface} weight="bold" />
      </Pressable>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 56, paddingHorizontal: space.gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
});
