// Staff: partner listings by status.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { colors, radius, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { LISTING_STATUS, listListings, type Listing, type ListingStatus } from '@/lib/listings';
import { useCurrency } from '@/lib/currency';
import { Card, Chip, ChipRow, Gutter, Kicker, Screen } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';

const FILTERS: (ListingStatus | 'all')[] = ['pending', 'live', 'rejected', 'paused', 'draft', 'all'];
const LABEL: Record<ListingStatus | 'all', string> = { pending: 'To review', live: 'Live', rejected: 'Needs changes', paused: 'Paused', draft: 'Drafts', all: 'All' };

export default function StaffListings() {
  const { isAdmin } = useAuth();
  const { priceNpr } = useCurrency();
  const [filter, setFilter] = useState<ListingStatus | 'all'>('pending');
  const [rows, setRows] = useState<(Listing & { partners: { business_name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      setRows(await listListings(filter));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load.');
    } finally {
      setLoading(false);
    }
  }, [filter, isAdmin]);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <Screen refreshControl={<RefreshControl refreshing={false} tintColor={colors.primary} onRefresh={load} />}>
      <BackHeader />
      <Gutter style={{ marginTop: space.md }}>
        <Kicker>Staff</Kicker>
        <Text style={[type.displayMd, { marginTop: 6 }]}>Partner listings</Text>
      </Gutter>
      <ChipRow style={{ marginTop: space.md, flexGrow: 0 }}>
        {FILTERS.map((f) => <Chip key={f} label={LABEL[f]} active={filter === f} onPress={() => setFilter(f)} />)}
      </ChipRow>
      {!isAdmin ? (
        <Gutter style={{ marginTop: space.xl }}><Text style={type.bodyMd}>Staff only.</Text></Gutter>
      ) : loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : error ? (
        <Gutter style={{ marginTop: space.lg }}><Text style={[type.bodySm, { color: colors.destructive }]}>{error}</Text></Gutter>
      ) : rows.length === 0 ? (
        <Gutter style={{ marginTop: space.xl }}><Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>Nothing here right now.</Text></Gutter>
      ) : (
        <Gutter style={{ marginTop: space.lg, gap: space.md }}>
          {rows.map((l) => (
            <Pressable key={l.slug} onPress={() => router.push({ pathname: '/admin/listing/[slug]', params: { slug: l.slug } })} accessibilityRole="button">
              <Card style={{ flexDirection: 'row', gap: 12, padding: 14 }}>
                {l.images[0] ? <Image source={{ uri: l.images[0] }} style={{ width: 72, height: 72, borderRadius: radius.md }} contentFit="cover" /> : null}
                <View style={{ flex: 1, gap: 4 }}>
                  <Kicker>{l.kind === 'homestay' ? 'Homestay' : 'Hotel'} · {l.city}</Kicker>
                  <Text style={type.headlineSm} numberOfLines={2}>{l.name}</Text>
                  <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
                    {LISTING_STATUS[l.status]} · {l.images.length} photos{l.price_from_npr ? ` · from ${priceNpr(l.price_from_npr)}` : ''}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </Gutter>
      )}
    </Screen>
  );
}
