// Account entry point to the partner area: "Partner dashboard" for partners, "List your property" for others.
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { STATUS_TEXT, useMyPartner } from '@/lib/partners';
import { Card } from './ui';
import { CaretRightIcon, StorefrontIcon } from './icons';

export function PartnerEntry() {
  const { user, enabled } = useAuth();
  const { partner } = useMyPartner(user?.id);
  if (!enabled) return null;
  const title = partner ? (partner.status === 'approved' ? 'Partner dashboard' : 'Your partner application') : 'Own a hotel or homestay?';
  const sub = partner ? `${partner.business_name} · ${STATUS_TEXT[partner.status]}` : 'List it on Mountain Planet · 10% commission';
  return (
    <Pressable onPress={() => router.push('/partner')} accessibilityRole="button" accessibilityLabel={title}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <StorefrontIcon size={26} color={colors.secondary} weight="duotone" />
        <View style={{ flex: 1 }}>
          <Text style={type.headlineSm}>{title}</Text>
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} numberOfLines={2}>{sub}</Text>
        </View>
        <CaretRightIcon size={18} color={colors.onSurfaceVariant} />
      </Card>
    </Pressable>
  );
}
