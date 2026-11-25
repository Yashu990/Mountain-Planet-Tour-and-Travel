import { useI18n } from '@/lib/i18n';
import { useCurrency } from '@/lib/currency';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space, type } from '@/theme';
import { tours, type Tour } from '@/data/tours';
import { askAgent, useStore } from '@/lib/store';
import { Card, Gutter, Kicker, PrimaryButton, Screen, SoftButton, TextButton } from '@/components/ui';
import { TourRow } from '@/components/cards';
import { SuitcaseRollingIcon, ArrowsClockwiseIcon, BookmarkSimpleIcon, CaretRightIcon, SparkleIcon, UserCircleIcon } from '@/components/icons';
import { useAuth } from '@/lib/auth';
import { useContent } from '@/lib/content';

export default function Saved() {
  useContent();
  const { saved, toggleSave } = useStore();
  const { price } = useCurrency();
  const { t } = useI18n();
  const { enabled, user } = useAuth();
  const accountCard = enabled ? (
    <Gutter style={{ marginTop: space.lg }}>
      <Pressable onPress={() => router.push('/account')} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 }}>
          {user ? <ArrowsClockwiseIcon size={24} color={colors.secondary} weight="duotone" /> : <UserCircleIcon size={26} color={colors.secondary} weight="duotone" />}
          <View style={{ flex: 1 }}>
            <Text style={[type.headlineSm, { fontSize: 16 }]}>{user ? 'Synced to your account' : 'Sign in to sync your board'}</Text>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]} numberOfLines={1}>{user ? user.email : 'Keep saved journeys on every device'}</Text>
          </View>
          <CaretRightIcon size={16} color={colors.onSurfaceVariant} />
        </Card>
      </Pressable>
    </Gutter>
  ) : null;
  const items = saved.map((s) => tours.find((t) => t.slug === s)).filter(Boolean) as Tour[];
  const totalDays = items.reduce((a, t) => a + t.days, 0);
  const from = items.reduce((a, t) => a + t.price, 0);

  return (
    <Screen tabs>
      <Gutter>
        <Kicker>Your saved journeys</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>{t('saved.title')}</Text>
      </Gutter>
      {accountCard}
      <Gutter style={{ marginTop: space.md }}>
        <Pressable onPress={() => router.push('/trip')} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 }}>
            <SuitcaseRollingIcon size={26} color={colors.secondary} weight="duotone" />
            <View style={{ flex: 1 }}>
              <Text style={[type.headlineSm, { fontSize: 16 }]}>My trip</Text>
              <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>Bookings, day-by-day plan, help numbers — works offline</Text>
            </View>
            <CaretRightIcon size={16} color={colors.onSurfaceVariant} />
          </Card>
        </Pressable>
      </Gutter>

      {items.length === 0 ? (
        <Gutter style={{ marginTop: space.xl }}>
          <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
            <BookmarkSimpleIcon size={40} color={colors.onSurfaceVariant} weight="duotone" />
            <Text style={[type.headlineMd, { marginTop: space.md }]}>Your board is empty</Text>
            <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 }]}>
              Tap the bookmark on any journey to pin it here and build your dream Himalayan itinerary.
            </Text>
            <TextButton label="Start exploring" onPress={() => router.navigate('/explore')} style={{ marginTop: space.lg }} />
          </Card>
        </Gutter>
      ) : (
        <>
          <Gutter style={{ flexDirection: 'row', gap: space.xl, marginTop: space.lg }}>
            <View>
              <Kicker>Journeys</Kicker>
              <Text style={[type.displayMd, { marginTop: 4 }]}>{items.length}</Text>
            </View>
            <View>
              <Kicker>Days</Kicker>
              <Text style={[type.displayMd, { marginTop: 4 }]}>{totalDays}</Text>
            </View>
            <View>
              <Kicker>From</Kicker>
              <Text style={[type.displayMd, { marginTop: 4 }]}>{price(from)}</Text>
            </View>
          </Gutter>

          <Gutter style={{ marginTop: space.section, gap: space.xl }}>
            {items.map((t) => (
              <View key={t.slug}>
                <TourRow tour={t} />
                <TextButton label="Remove" arrow={false} onPress={() => toggleSave(t.slug)} style={{ alignSelf: 'flex-end', marginTop: -8 }} />
              </View>
            ))}
          </Gutter>

          <Gutter style={{ marginTop: space.section, gap: space.md }}>
            <PrimaryButton label="Request a quote for these" onPress={() => router.push({ pathname: '/plan', params: { tour: items.map((t) => t.slug).join(',') } })} />
            <SoftButton
              label="Ask Planet AI to compare"
              icon={SparkleIcon}
              style={{ alignSelf: 'center' }}
              onPress={() => askAgent(`Compare and recommend: ${items.map((t) => t.title).join(', ')}`)}
            />
          </Gutter>
        </>
      )}
    </Screen>
  );
}
