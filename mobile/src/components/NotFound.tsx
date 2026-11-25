import { Text } from 'react-native';
import { router } from 'expo-router';
import { colors, space, type } from '@/theme';
import { Gutter, Kicker, Screen, TextButton } from '@/components/ui';
import { MountainsIcon } from '@/components/icons';

export default function NotFound() {
  return (
    <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <Gutter style={{ alignItems: 'center' }}>
        <MountainsIcon size={48} color={colors.onSurfaceVariant} weight="duotone" />
        <Kicker style={{ marginTop: space.lg }}>Lost on the trail</Kicker>
        <Text style={[type.displayMd, { marginTop: 8, textAlign: 'center' }]}>This path doesn’t exist</Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }]}>
          Even the best guides take a wrong turn sometimes.
        </Text>
        <TextButton label="Back to home" onPress={() => router.replace('/')} style={{ marginTop: space.lg }} />
      </Gutter>
    </Screen>
  );
}
