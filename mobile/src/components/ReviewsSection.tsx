import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, fonts, space, type } from '@/theme';
import { backendEnabled } from '@/lib/supabase';
import { useReviews } from '@/lib/reviews';
import { Card, Gutter, Section, SectionHeader, SoftButton, Stars } from './ui';
import { StarIcon } from './icons';

/** Approved traveller reviews for a tour or stay, plus "Write a review". */
export function ReviewsSection({ tour, stay }: { tour?: string; stay?: string }) {
  const { items } = useReviews({ tour, stay });
  if (!backendEnabled) return null;
  const approved = items.filter((r) => r.approved);
  const avg = approved.length ? approved.reduce((n, r) => n + r.rating, 0) / approved.length : 0;
  return (
    <Section>
      <SectionHeader kicker="From travellers" title="Reviews" />
      <Gutter style={{ gap: space.md }}>
        {approved.length ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <StarIcon size={18} color={colors.primary} weight="fill" />
            <Text style={[type.headlineSm, { fontFamily: fonts.serif }]}>{avg.toFixed(1)}</Text>
            <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{approved.length} {approved.length === 1 ? 'review' : 'reviews'}</Text>
          </View>
        ) : (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>No reviews yet — be the first.</Text>
        )}
        {items.slice(0, 5).map((r) => (
          <Card key={r.id} style={{ gap: 6, padding: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stars n={r.rating} size={12} />
              {!r.approved ? <Text style={[type.labelSm, { color: colors.onSurfaceVariant }]}>Awaiting approval</Text> : null}
            </View>
            <Text style={type.bodySm}>“{r.text}”</Text>
            <Text style={[type.labelMd, { fontFamily: fonts.sansSemi }]}>{r.name}{r.country ? <Text style={{ color: colors.onSurfaceVariant, fontFamily: fonts.sans }}> · {r.country}</Text> : null}</Text>
          </Card>
        ))}
        <SoftButton label="Write a review" icon={StarIcon} onPress={() => router.push({ pathname: '/review', params: tour ? { tour } : { stay: stay! } })} />
      </Gutter>
    </Section>
  );
}
