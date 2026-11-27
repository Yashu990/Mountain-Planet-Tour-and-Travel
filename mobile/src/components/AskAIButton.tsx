// Floating "Ask Planet AI" button on the main screens: a small round button, bottom-right,
// so it never covers prices or text for long.
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, radius } from '@/theme';
import { Tap } from './ui';
import { SparkleIcon } from './icons';

export function AskAIButton({ prompt }: { prompt?: string }) {
  return (
    <Tap
      onPress={() => router.push(prompt ? { pathname: '/ai', params: { q: prompt } } : '/ai')}
      style={styles.fab}
      scaleTo={0.92}
      accessibilityRole="button"
      accessibilityLabel="Ask Planet AI"
    >
      <SparkleIcon size={20} color={colors.onPrimary} weight="fill" />
      <Text style={styles.label}>AI</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 24px rgba(45,43,38,0.25)',
  },
  label: { color: colors.onPrimary, fontFamily: fonts.sansBold, fontSize: 10, lineHeight: 12, marginTop: 1 },
});
