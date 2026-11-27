import { useI18n } from '@/lib/i18n';
import { MAX_CONTENT_WIDTH } from '@/lib/layout';
// Agoda-style filtering: a chip row (Filters · Sort · quick chips) and a bottom sheet with
// grouped options, "Clear all" and a live "Show N results" button.
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, space, squircle, type } from '@/theme';
import { PrimaryButton, TextButton } from './ui';
import { CaretDownIcon, CheckIcon, FunnelSimpleIcon, XIcon } from './icons';

export type FilterValues = Record<string, string[]>;

export interface FilterGroup {
  key: string;
  title: string;
  /** single = pick one (radio), multi = any number (checkbox chips) */
  mode: 'single' | 'multi';
  options: { value: string; label: string }[];
}

export const countActive = (v: FilterValues) => Object.values(v).reduce((n, a) => n + a.length, 0);

/** Horizontal row under the search bar: Filters (n) · Sort · quick toggle chips. */
export function FilterBar({
  active,
  onOpenFilters,
  sortLabel,
  onOpenSort,
  children,
}: {
  active: number;
  onOpenFilters: () => void;
  sortLabel: string;
  onOpenSort: () => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: space.sm, alignItems: 'center' }}>
      <Pressable onPress={onOpenFilters} style={[styles.barChip, active ? styles.barChipOn : null]} accessibilityRole="button" accessibilityLabel={`Filters${active ? `, ${active} applied` : ''}`}>
        <FunnelSimpleIcon size={16} color={active ? colors.onSecondary : colors.onSurface} weight={active ? 'fill' : 'regular'} />
        <Text style={[type.labelMd, { color: active ? colors.onSecondary : colors.onSurface }]}>{t('common.filters')}</Text>
        {active ? (
          <View style={styles.badge}>
            <Text style={[type.labelSm, { color: colors.secondary, fontSize: 11 }]}>{active}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable onPress={onOpenSort} style={styles.barChip} accessibilityRole="button" accessibilityLabel={`Sort: ${sortLabel}`}>
        <Text style={type.labelMd}>{sortLabel}</Text>
        <CaretDownIcon size={14} color={colors.onSurfaceVariant} />
      </Pressable>
      {children}
    </ScrollView>
  );
}

/** A quick toggle chip for the FilterBar (e.g. "Breakfast included"). */
export function QuickChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.barChip, on && styles.barChipOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
      {on ? <CheckIcon size={14} color={colors.onSecondary} weight="bold" /> : null}
      <Text style={[type.labelMd, { color: on ? colors.onSecondary : colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

function Sheet({ visible, onClose, title, children, footer }: { visible: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: footer ? 0 : insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.sheetHead}>
          <Text style={[type.headlineLg, { flex: 1 }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityLabel="Close">
            <XIcon size={18} color={colors.onSurface} weight="bold" />
          </Pressable>
        </View>
        {children}
        {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

/**
 * Filters bottom sheet. Edits a draft; "Show N results" applies it.
 * `countFor` returns how many results a draft would give (live count like Agoda).
 */
export function FilterSheet({
  visible,
  onClose,
  groups,
  value,
  onApply,
  countFor,
  noun = 'results',
}: {
  visible: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  value: FilterValues;
  onApply: (v: FilterValues) => void;
  countFor: (v: FilterValues) => number;
  noun?: string;
}) {
  const [draft, setDraft] = useState<FilterValues>(value);
  const [openedWith, setOpenedWith] = useState<FilterValues | null>(null);
  // Re-sync the draft each time the sheet opens.
  if (visible && openedWith !== value) {
    setOpenedWith(value);
    setDraft(value);
  }
  if (!visible && openedWith !== null) setOpenedWith(null);

  const toggle = (g: FilterGroup, v: string) =>
    setDraft((d) => {
      const cur = d[g.key] ?? [];
      const next = g.mode === 'single' ? (cur[0] === v ? [] : [v]) : cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      return { ...d, [g.key]: next };
    });
  const n = countFor(draft);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filters"
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <TextButton label="Clear all" arrow={false} onPress={() => setDraft({})} />
          <PrimaryButton
            label={n === 0 ? `No ${noun}` : `Show ${n} ${n === 1 ? noun.replace(/s$/, '') : noun}`}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
            disabled={n === 0}
            style={{ flex: 1, paddingVertical: 15 }}
          />
        </View>
      }
    >
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ paddingHorizontal: space.gutter, paddingBottom: space.lg, gap: space.lg }}>
        {groups.map((g) => (
          <View key={g.key} style={{ gap: 12 }}>
            <Text style={type.headlineSm}>{g.title}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {g.options.map((o) => {
                const on = (draft[g.key] ?? []).includes(o.value);
                return (
                  <Pressable
                    key={o.value}
                    onPress={() => toggle(g, o.value)}
                    style={[styles.opt, on && styles.optOn]}
                    accessibilityRole={g.mode === 'single' ? 'radio' : 'checkbox'}
                    accessibilityState={{ checked: on }}
                  >
                    {on && g.mode === 'multi' ? <CheckIcon size={14} color={colors.onSecondary} weight="bold" /> : null}
                    <Text style={[type.labelMd, { color: on ? colors.onSecondary : colors.onSurface }]}>{o.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </Sheet>
  );
}

/** Sort options sheet. */
export function SortSheet({ visible, onClose, options, value, onChange }: { visible: boolean; onClose: () => void; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Sort by">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              onChange(o.value);
              onClose();
            }}
            style={({ pressed }) => [styles.sortRow, pressed && { backgroundColor: colors.surfaceAlt }]}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
          >
            <Text style={[type.bodyMd, { flex: 1, fontFamily: on ? fonts.sansSemi : fonts.sans }]}>{o.label}</Text>
            {on ? <CheckIcon size={18} color={colors.secondary} weight="bold" /> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  barChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.surfaceAlt },
  barChipOn: { backgroundColor: colors.secondary },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  backdrop: { flex: 1, backgroundColor: 'rgba(45,43,38,0.35)' },
  sheet: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderCurve: 'continuous', paddingTop: 10, ...shadow.sheet },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, marginBottom: space.md },
  close: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: space.gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt, ...squircle },
  optOn: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
});
