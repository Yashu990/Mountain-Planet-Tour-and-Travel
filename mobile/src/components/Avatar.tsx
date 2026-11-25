// The person's profile picture: their photo, else their initial, else a person icon.
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/lib/auth';
import { colors, fonts } from '@/theme';
import { UserCircleIcon } from './icons';

export function Avatar({ size = 44 }: { size?: number }) {
  const { user, profile } = useAuth();
  const name = String(profile?.full_name || user?.user_metadata?.full_name || user?.email || '').trim();
  const box = { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' as const, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (user && profile?.avatar_url) {
    return <Image source={{ uri: profile.avatar_url }} style={box} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />;
  }
  if (user && name) {
    return (
      <View style={[box, { backgroundColor: colors.secondary }]}>
        <Text style={{ fontFamily: fonts.serif, fontSize: size * 0.42, color: colors.onSecondary }}>{name[0].toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <View style={[box, { backgroundColor: colors.surfaceAlt }]}>
      <UserCircleIcon size={size * 0.62} color={colors.onSurface} />
    </View>
  );
}
