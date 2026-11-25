// Staff: partner applications by status.
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { colors, space, type } from '@/theme';
import { useAuth } from '@/lib/auth';
import { KIND_LABEL, listPartners, STATUS_TEXT, type Partner, type PartnerStatus } from '@/lib/partners';
import { Card, Chip, ChipRow, Gutter, Kicker, Screen } from '@/components/ui';
import { BackHeader } from '@/components/BackHeader';

const FILTERS: (PartnerStatus | 'all')[] = ['submitted', 'approved', 'rejected', 'draft', 'all'];
const LABEL: Record<PartnerStatus | 'all', string> = { submitted: 'To review', approved: 'Approved', rejected: 'Needs changes', draft: 'Not sent', suspended: 'Paused', all: 'All' };

export default function StaffPartners() {
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState<PartnerStatus | 'all'>('submitted');
  const [rows, setRows] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError('');
    try {
      setRows(await listPartners(filter));
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
        <Text style={[type.displayMd, { marginTop: 6 }]}>Partner applications</Text>
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
          {rows.map((p) => (
            <Pressable key={p.id} onPress={() => router.push({ pathname: '/admin/partner/[id]', params: { id: p.id } })} accessibilityRole="button">
              <Card style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 12, rowGap: 4 }}>
                  <Kicker>{KIND_LABEL[p.kind]} · {p.city ?? '—'}</Kicker>
                  <Text style={[type.labelSm, { color: p.status === 'rejected' ? colors.destructive : colors.primary }]}>{STATUS_TEXT[p.status]}</Text>
                </View>
                <Text style={type.headlineSm}>{p.business_name}</Text>
                <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>
                  {p.owner_name ?? ''}{p.phone ? ` · ${p.phone}` : ''}{p.submitted_at ? ` · sent ${new Date(p.submitted_at).toLocaleDateString()}` : ''}
                </Text>
              </Card>
            </Pressable>
          ))}
        </Gutter>
      )}
    </Screen>
  );
}
