// "Not a traveller?" — quick way to the partner login and the staff login from any sign-in screen.
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, space, type } from '@/theme';
import { CaretRightIcon, ShieldCheckIcon, StorefrontIcon, type Icon } from './icons';

function Choice({ icon: I, title, sub, onPress }: { icon: Icon; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({ flex: 1, minWidth: 150, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: pressed ? colors.surfaceAlt : colors.surface })}
    >
      <I size={22} color={colors.secondary} weight="duotone" />
      <View style={{ flex: 1 }}>
        <Text style={type.labelMd} numberOfLines={1}>{title}</Text>
        <Text style={[type.bodySm, { fontSize: 12, color: colors.onSurfaceVariant }]} numberOfLines={1}>{sub}</Text>
      </View>
      <CaretRightIcon size={14} color={colors.onSurfaceVariant} />
    </Pressable>
  );
}

export function LoginChoices({ onNavigate }: { onNavigate?: () => void }) {
  const go = (path: '/partner/login' | '/admin/login') => {
    onNavigate?.();
    router.push(path);
  };
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={[type.labelUpper, { color: colors.onSurfaceVariant }]}>Not a traveller?</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        <Choice icon={StorefrontIcon} title="Partner login" sub="Hotels, homestays" onPress={() => go('/partner/login')} />
        <Choice icon={ShieldCheckIcon} title="Staff login" sub="Our team" onPress={() => go('/admin/login')} />
      </View>
    </View>
  );
}
