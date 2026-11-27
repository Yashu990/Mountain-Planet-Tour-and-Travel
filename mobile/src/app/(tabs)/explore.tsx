import { useI18n } from '@/lib/i18n';
import { AskAIButton } from '@/components/AskAIButton';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, space, type } from '@/theme';
import { tours, guides, boards, type Tour } from '@/data/tours';
import { categories, type CatName } from '@/lib/categories';
import { askAgent } from '@/lib/store';
import { CardGrid, Chip, ChipRow, Gutter, Kicker, Screen, SearchInput, SoftButton, TextButton } from '@/components/ui';
import { GuideCard, TourGrid, TourRow } from '@/components/cards';
import { FilterBar, FilterSheet, QuickChip, SortSheet, countActive, type FilterGroup, type FilterValues } from '@/components/filters';
import { MagnifyingGlassIcon, SparkleIcon, XIcon } from '@/components/icons';
import { useContent } from '@/lib/content';

const SORTS = [
  { value: 'rec', label: 'Recommended' },
  { value: 'price', label: 'Lowest price first' },
  { value: 'price-desc', label: 'Highest price first' },
  { value: 'short', label: 'Shortest first' },
  { value: 'long', label: 'Longest first' },
  { value: 'rating', label: 'Top rated' },
  { value: 'alt', label: 'Highest altitude' },
];
const PRICE: Record<string, [number, number]> = { u500: [0, 500], '500-1000': [500, 1000], '1000-2000': [1000, 2000], '2000p': [2000, Infinity] };
const DAYS: Record<string, [number, number]> = { u5: [1, 5], '6-12': [6, 12], '13p': [13, Infinity] };
const ALT: Record<string, [number, number]> = { u3000: [0, 3000], '3000-5000': [3000, 5000], '5000p': [5000, Infinity] };
const inRange = (v: number, r?: [number, number]) => !r || (v >= r[0] && v <= r[1]);

/** Search text + category + board + sheet filters (shared by the list and the live count). */
function applyFilters(list: Tour[], query: string, cat: CatName, board: (t: Tour) => boolean, f: FilterValues) {
  const words = query.split(/\s+/).filter(Boolean);
  const one = (k: string) => (f[k] ?? [])[0];
  return list.filter((t) => {
    if (cat !== 'All' && cat !== 'Guides' && t.category !== cat) return false;
    if (!board(t)) return false;
    if ((f.level ?? []).length && !f.level.includes(t.difficulty)) return false;
    if ((f.region ?? []).length && !f.region.includes(t.region)) return false;
    if (one('price') && !inRange(t.price, PRICE[one('price')])) return false;
    if (one('days') && !inRange(t.days, DAYS[one('days')])) return false;
    if (one('alt') && !inRange(t.maxAlt, ALT[one('alt')])) return false;
    if (one('rating') && t.rating < Number(one('rating'))) return false;
    if (words.length) {
      const hay = [t.title, t.region, t.category, t.summary, ...t.tags].join(' ').toLowerCase();
      return words.every((w) => hay.includes(w));
    }
    return true;
  });
}

function sortTours(list: Tour[], by: string) {
  const r = [...list];
  if (by === 'price') r.sort((a, b) => a.price - b.price);
  if (by === 'price-desc') r.sort((a, b) => b.price - a.price);
  if (by === 'short') r.sort((a, b) => a.days - b.days);
  if (by === 'long') r.sort((a, b) => b.days - a.days);
  if (by === 'rating') r.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  if (by === 'alt') r.sort((a, b) => b.maxAlt - a.maxAlt);
  return r;
}

export default function Explore() {
  const { version } = useContent();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ q?: string; cat?: string; board?: string; focus?: string; sort?: string }>();
  const [q, setQ] = useState(params.q ?? '');
  const [cat, setCat] = useState<CatName>((params.cat as CatName) ?? 'All');
  const [board, setBoard] = useState<string | null>(params.board ?? null);
  const [filters, setFilters] = useState<FilterValues>({});
  const [sort, setSort] = useState('rec');
  const [sheet, setSheet] = useState<null | 'filters' | 'sort'>(null);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const input = useRef<React.ComponentRef<typeof TextInput>>(null);

  // Deep-links from Home (category, board, sort, search focus) update this tab in place.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing state from deep-link params
    if (params.cat) setCat(params.cat as CatName);
    if (params.board) setBoard(params.board);
    if (params.sort && SORTS.some((x) => x.value === params.sort)) setSort(params.sort);
    if (params.q !== undefined) setQ(params.q);
    if (params.focus) setTimeout(() => input.current?.focus(), 350);
  }, [params.cat, params.board, params.q, params.focus, params.sort]);

  const boardObj = boards.find((b) => b.id === board);
  const boardMatch = useMemo(() => (boardObj ? boardObj.match : () => true), [boardObj]);
  const query = q.toLowerCase().trim();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  const regions = useMemo(() => Array.from(new Set(tours.map((t) => t.region))).sort(), [version]);

  const list = useMemo(
    () => sortTours(applyFilters(tours, query, cat, boardMatch, filters), sort),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
    [query, cat, boardMatch, filters, sort, version],
  );

  const anyFilter = countActive(filters) > 0;
  const guideList = useMemo(() => {
    if (cat !== 'All' && cat !== 'Guides') return [];
    if (board || anyFilter) return [];
    return guides.filter((g) => !query || (g.title + g.intro + g.kicker).toLowerCase().includes(query));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- content arrays are updated in place; `version` signals the change
  }, [cat, query, board, anyFilter, version]);

  const groups: FilterGroup[] = [
    { key: 'price', title: 'Price per person', mode: 'single', options: [{ value: 'u500', label: 'Under $500' }, { value: '500-1000', label: '$500 – $1,000' }, { value: '1000-2000', label: '$1,000 – $2,000' }, { value: '2000p', label: '$2,000+' }] },
    { key: 'days', title: 'Trip length', mode: 'single', options: [{ value: 'u5', label: '1–5 days' }, { value: '6-12', label: '6–12 days' }, { value: '13p', label: '13+ days' }] },
    { key: 'level', title: 'Difficulty', mode: 'multi', options: ['Easy', 'Moderate', 'Challenging', 'Strenuous'].map((l) => ({ value: l, label: l })) },
    { key: 'alt', title: 'Highest point', mode: 'single', options: [{ value: 'u3000', label: 'Under 3,000 m' }, { value: '3000-5000', label: '3,000 – 5,000 m' }, { value: '5000p', label: '5,000 m+' }] },
    { key: 'rating', title: 'Traveller rating', mode: 'single', options: [{ value: '4.9', label: '4.9+' }, { value: '4.8', label: '4.8+' }, { value: '4.5', label: '4.5+' }] },
    { key: 'region', title: 'Region', mode: 'multi', options: regions.map((r) => ({ value: r, label: r })) },
  ];

  const quick = (key: string, v: string, single = false) =>
    setFilters((f) => {
      const cur = f[key] ?? [];
      return { ...f, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : single ? [v] : [...cur, v] };
    });
  const isOn = (key: string, v: string) => (filters[key] ?? []).includes(v);

  const showTours = cat !== 'Guides';
  const total = (showTours ? list.length : 0) + guideList.length;
  const title = boardObj ? boardObj.title : cat === 'All' ? t('explore.title') : cat;

  const clearAll = () => {
    setQ('');
    setCat('All');
    setBoard(null);
    setFilters({});
    setSort('rec');
    router.setParams({ q: undefined, cat: undefined, board: undefined, focus: undefined, sort: undefined });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
    <Screen tabs>
      <Gutter>
        <Kicker>{boardObj ? 'Curated board' : 'Every journey we run'}</Kicker>
        <Text style={[type.displayLg, { marginTop: 8 }]}>{title}</Text>
        <View style={{ marginTop: space.lg }}>
          <SearchInput ref={input} value={q} onChangeText={setQ} placeholder={t('explore.search')} autoCorrect={false} />
        </View>
      </Gutter>

      <ChipRow style={{ marginTop: space.md }}>
        {categories.map((c) => <Chip key={c.name} label={c.name} icon={c.icon} active={cat === c.name} onPress={() => setCat(c.name)} />)}
      </ChipRow>

      <View style={{ marginTop: space.md }}>
        <FilterBar active={countActive(filters)} onOpenFilters={() => setSheet('filters')} sortLabel={SORTS.find((s) => s.value === sort)!.label} onOpenSort={() => setSheet('sort')}>
          <QuickChip label="Under $500" on={isOn('price', 'u500')} onPress={() => quick('price', 'u500', true)} />
          <QuickChip label="Easy" on={isOn('level', 'Easy')} onPress={() => quick('level', 'Easy')} />
          <QuickChip label="1–5 days" on={isOn('days', 'u5')} onPress={() => quick('days', 'u5', true)} />
          <QuickChip label="5,000 m+" on={isOn('alt', '5000p')} onPress={() => quick('alt', '5000p', true)} />
        </FilterBar>
      </View>

      <Gutter style={{ marginTop: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{total} {total === 1 ? 'result' : 'results'}</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {(['list', 'grid'] as const).map((v) => (
            <Pressable key={v} onPress={() => setView(v)} style={{ paddingHorizontal: 10, paddingVertical: 6 }} accessibilityRole="button" accessibilityState={{ selected: view === v }}>
              <Text style={[type.labelMd, { color: view === v ? colors.primary : colors.onSurfaceVariant }]}>{v === 'list' ? 'List' : 'Grid'}</Text>
            </Pressable>
          ))}
        </View>
      </Gutter>

      {(boardObj || query) && (
        <ChipRow style={{ marginTop: space.sm }}>
          {boardObj ? <Chip label={`Board: ${boardObj.title}`} icon={XIcon} active onPress={() => setBoard(null)} /> : null}
          {query ? <Chip label={`“${q.trim()}”`} icon={XIcon} active onPress={() => setQ('')} /> : null}
        </ChipRow>
      )}

      {total === 0 ? (
        <Gutter style={{ alignItems: 'center', paddingVertical: space.xxl }}>
          <MagnifyingGlassIcon size={40} color={colors.onSurfaceVariant} weight="duotone" />
          <Text style={[type.headlineMd, { marginTop: space.md, textAlign: 'center' }]}>Nothing matches yet</Text>
          <Text style={[type.bodyMd, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 6 }]}>
            Try a different filter — or let Planet AI find something close to what you want.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: space.lg, alignItems: 'center' }}>
            <TextButton label="Clear filters" arrow={false} onPress={clearAll} />
            <SoftButton label="Ask Planet AI" icon={SparkleIcon} onPress={() => askAgent(query ? `Recommend a trip for: ${query}` : 'Plan my trip')} />
          </View>
        </Gutter>
      ) : (
        <View style={{ marginTop: space.lg }}>
          {showTours &&
            (view === 'grid' ? (
              <TourGrid tours={list} />
            ) : (
              <CardGrid gap={space.xl}>{list.map((t) => <TourRow key={t.slug} tour={t} />)}</CardGrid>
            ))}
          {guideList.length > 0 && (
            <View style={{ marginTop: showTours && list.length ? space.section : 0 }}>
              <Gutter><Kicker style={{ marginBottom: space.md }}>Travel guides</Kicker></Gutter>
              <Gutter style={{ gap: space.md }}>{guideList.map((g) => <GuideCard key={g.slug} g={g} />)}</Gutter>
            </View>
          )}
        </View>
      )}

      <FilterSheet
        visible={sheet === 'filters'}
        onClose={() => setSheet(null)}
        groups={groups}
        value={filters}
        onApply={setFilters}
        countFor={(f) => applyFilters(tours, query, cat, boardMatch, f).length}
        noun="journeys"
      />
      <SortSheet visible={sheet === 'sort'} onClose={() => setSheet(null)} options={SORTS} value={sort} onChange={setSort} />
    </Screen>
    <AskAIButton />
    </View>
  );
}
