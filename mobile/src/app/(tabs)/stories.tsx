import { useI18n } from '@/lib/i18n';
import { useLayoutWidth } from '@/lib/layout';
import { useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space, type } from '@/theme';
import { useStories, sharedStorage } from '@/lib/stories';
import { Chip, ChipRow, Gutter, Kicker, PrimaryButton, Screen } from '@/components/ui';
import { StoryCard } from '@/components/cards';
import { CameraPlusIcon } from '@/components/icons';

export default function Stories() {
  const width = useLayoutWidth();
  const { t } = useI18n();
  const { stories, loading, reload } = useStories();
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  const trips = useMemo(() => ['All', ...Array.from(new Set(stories.map((s) => s.trip).filter(Boolean)))], [stories]);
  const shown = filter === 'All' ? stories : stories.filter((s) => s.trip === filter);
  const photoCount = stories.reduce((n, s) => n + s.photos.length, 0);

  // Masonry: deal cards into two columns.
  const colW = (width - space.gutter * 2 - space.md) / 2;
  const cols: (typeof shown)[] = [[], []];
  shown.forEach((s, i) => cols[i % 2].push(s));

  return (
    <Screen
      tabs
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.primary}
          onRefresh={async () => {
            setRefreshing(true);
            await reload();
            setRefreshing(false);
          }}
        />
      }
    >
      <Gutter>
        <Kicker>Come as a traveller, leave as family</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>{t('stories.title')}</Text>
        <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, marginTop: 10 }]}>
          Real photos and moments shared by people who walked these trails with us.
        </Text>
        <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.lg }}>
          <View>
            <Kicker>Stories</Kicker>
            <Text style={[type.displayMd, { marginTop: 4 }]}>{stories.length}</Text>
          </View>
          <View>
            <Kicker>Photos</Kicker>
            <Text style={[type.displayMd, { marginTop: 4 }]}>{photoCount}</Text>
          </View>
        </View>
        <PrimaryButton label="Share your story" icon={CameraPlusIcon} onPress={() => router.push('/share-story')} style={{ marginTop: space.lg }} />
        {!sharedStorage ? (
          <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 10, textAlign: 'center' }]}>Stories you share are saved on this phone.</Text>
        ) : null}
      </Gutter>

      {trips.length > 2 && (
        <ChipRow style={{ marginTop: space.section }}>
          {trips.map((t) => <Chip key={t} label={t === 'All' ? 'All trips' : t} active={filter === t} onPress={() => setFilter(t)} />)}
        </ChipRow>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxl }} />
      ) : (
        <Gutter style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          {cols.map((c, k) => (
            <View key={k} style={{ width: colW }}>
              {c.map((s) => <StoryCard key={s.id} story={s} width={colW} onPress={() => router.push(`/story/${s.id}`)} />)}
            </View>
          ))}
        </Gutter>
      )}
    </Screen>
  );
}
