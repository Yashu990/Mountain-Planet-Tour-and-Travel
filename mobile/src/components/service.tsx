// Service-page kit (Flights, Hotels, Treks & Tours, Cabs, Activities) — travel-app structure,
// degine.md tokens: header · optional photo carousel · mode tabs · white form card with labelled
// boxes · big SEARCH · pinned one-line summary while scrolling · offers · bubbles · collections ·
// numbered top list · trust strip · FAQs.
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, fonts, radius, squircle } from '@/theme';
import { img } from '@/lib/images';
import { useLayoutWidth, MAX_CONTENT_WIDTH } from '@/lib/layout';
import { ArrowLeftIcon, ArrowsDownUpIcon, CaretDownIcon, CaretRightIcon, CaretUpIcon, CheckIcon, MagnifyingGlassIcon, type Icon } from './icons';

export const CARD = '#FFFFFF';
export const PAGE = colors.surfaceAlt;
export const G = 16;

export const fmtShort = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric' });

/* ---------------- page ---------------- */

/**
 * The page frame. `form` is the search card; once it scrolls out of view a compact bar with
 * `summary` and a Search button pins under the header.
 */
export function ServicePage({
  title,
  subtitle,
  right,
  hero,
  tabs,
  form,
  summary,
  onSearch,
  searchLabel = 'SEARCH',
  children,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  hero?: { images: string[]; caption?: string; sub?: string };
  tabs?: ReactNode;
  form: ReactNode;
  summary: string;
  onSearch: () => void;
  searchLabel?: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [formBottom, setFormBottom] = useState(9999);
  const [pinned, setPinned] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const p = y > formBottom - 40;
    if (p !== pinned) setPinned(p);
  };
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: PAGE }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={back} hitSlop={10} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <ArrowLeftIcon size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.headerSub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>

      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {hero ? <HeroCarousel {...hero} /> : null}
        <View
          onLayout={(e) => setFormBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
          style={[styles.formWrap, hero ? { marginTop: -24 } : null]}
        >
          {tabs ? <View style={{ marginBottom: 12 }}>{tabs}</View> : null}
          {form}
          <BigButton label={searchLabel} onPress={onSearch} />
        </View>
        {children}
      </ScrollView>

      {/* pinned summary once the form has scrolled away */}
      {pinned ? (
        <View style={[styles.pinBar, { top: insets.top + 56 }]}>
          <Text style={styles.pinText} numberOfLines={2}>{summary}</Text>
          <BigButton label={searchLabel} onPress={onSearch} compact />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function HeroCarousel({ images, caption, sub }: { images: string[]; caption?: string; sub?: string }) {
  const width = useLayoutWidth();
  const [i, setI] = useState(0);
  return (
    <View style={{ height: 220 }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}>
        {images.map((p) => (
          <View key={p} style={{ width, height: 220 }}>
            <Image source={img(p)} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['transparent', 'rgba(7,13,24,0.65)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />
          </View>
        ))}
      </ScrollView>
      {caption ? (
        <View pointerEvents="none" style={styles.heroCaption}>
          <Text style={styles.heroTitle}>{caption}</Text>
          {sub ? <Text style={styles.heroSub}>{sub}</Text> : null}
        </View>
      ) : null}
      <View pointerEvents="none" style={styles.dots}>
        {images.map((p, j) => <View key={p} style={[styles.dot, j === i && { width: 18, backgroundColor: '#fff' }]} />)}
      </View>
    </View>
  );
}

/* ---------------- form pieces ---------------- */

export function ModeTabs<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={styles.modeRow}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.mode, on && styles.modeOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Text style={[styles.modeText, on && { color: colors.primary, fontFamily: fonts.sansBold }]} numberOfLines={1}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Labelled box: SMALL LABEL / big value / small sub. Tap to change. */
export function Box({
  label,
  value,
  sub,
  placeholder,
  onPress,
  icon: I,
  right,
  style,
  accent,
}: {
  label: string;
  value?: string;
  sub?: string;
  placeholder?: string;
  onPress?: () => void;
  icon?: Icon;
  right?: ReactNode;
  style?: object;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.box, accent && { borderColor: colors.primary, backgroundColor: 'rgba(220,53,75,0.04)' }, pressed && { opacity: 0.75 }, style]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value || placeholder || ''}`}
    >
      {I ? <I size={20} color={colors.onSurfaceVariant} /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.boxLabel} numberOfLines={1}>{label}</Text>
        {value ? <Text style={styles.boxValue} numberOfLines={1}>{value}</Text> : <Text style={styles.boxPlaceholder} numberOfLines={1}>{placeholder ?? 'Select'}</Text>}
        {sub ? <Text style={styles.boxSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

/** Two boxes side by side with a round ⇅ swap button between them (From / To). */
export function SwapPair({ left, right, onSwap }: { left: ReactNode; right: ReactNode; onSwap: () => void }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>{left}</View>
        <View style={{ flex: 1 }}>{right}</View>
      </View>
      <Pressable onPress={onSwap} hitSlop={6} style={styles.swap} accessibilityRole="button" accessibilityLabel="Swap">
        <ArrowsDownUpIcon size={16} color={colors.primary} weight="bold" style={{ transform: [{ rotate: '90deg' }] }} />
      </Pressable>
    </View>
  );
}

/** Check-in / nights badge / check-out row. */
export function DateRangeBox({ start, end, onStart, onEnd, startLabel = 'CHECK-IN', endLabel = 'CHECK-OUT', badge }: { start: Date | null; end: Date | null; onStart: () => void; onEnd: () => void; startLabel?: string; endLabel?: string; badge?: string }) {
  return (
    <View style={[styles.box, { paddingVertical: 10, gap: 0 }]}>
      <Pressable onPress={onStart} style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={startLabel}>
        <Text style={styles.boxLabel}>{startLabel}</Text>
        {start ? <Text style={styles.boxValue}>{fmtShort(start)}</Text> : <Text style={styles.boxPlaceholder}>Add date</Text>}
        {start ? <Text style={styles.boxSub}>{fmtDay(start)}</Text> : null}
      </Pressable>
      {badge ? <View style={styles.nights}><Text style={styles.nightsText}>{badge}</Text></View> : null}
      <Pressable onPress={onEnd} style={{ flex: 1, alignItems: 'flex-end' }} accessibilityRole="button" accessibilityLabel={endLabel}>
        <Text style={styles.boxLabel}>{endLabel}</Text>
        {end ? <Text style={styles.boxValue}>{fmtShort(end)}</Text> : <Text style={styles.boxPlaceholder}>Add date</Text>}
        {end ? <Text style={styles.boxSub}>{fmtDay(end)}</Text> : null}
      </Pressable>
    </View>
  );
}

export function FormCard({ children }: { children: ReactNode }) {
  return <View style={styles.formCard}>{children}</View>;
}

export function BigButton({ label, onPress, compact, disabled }: { label: string; onPress: () => void; compact?: boolean; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.big, compact && styles.bigCompact, (pressed || disabled) && { opacity: 0.8 }]} accessibilityRole="button" accessibilityLabel={label}>
      <LinearGradient colors={['#eb4e62', colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]} />
      {!compact ? <MagnifyingGlassIcon size={18} color="#fff" weight="bold" /> : null}
      <Text style={[styles.bigText, compact && { fontSize: 13 }]}>{label}</Text>
    </Pressable>
  );
}

export function OptionChips<T extends string>({ label, value, options, onChange }: { label?: string; value: T; options: { value: T; label: string; sub?: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={styles.chipLabel}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.optChip, on && styles.optChipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[styles.optChipText, on && { color: colors.primary }]}>{o.label}</Text>
              {o.sub ? <Text style={styles.optChipSub}>{o.sub}</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ---------------- pickers ---------------- */

/** Bottom-sheet list (with optional free text). */
export function ChoiceSheet({
  visible,
  title,
  options,
  value,
  onPick,
  onClose,
  allowCustom,
  customPlaceholder = 'Type a place',
  subtitle,
}: {
  visible: boolean;
  title: string;
  options: (string | { value: string; sub?: string })[];
  value?: string;
  onPick: (v: string) => void;
  onClose: () => void;
  allowCustom?: boolean;
  customPlaceholder?: string;
  subtitle?: string;
}) {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const list = options.map((o) => (typeof o === 'string' ? { value: o } : o)).filter((o) => !q || o.value.toLowerCase().includes(q.toLowerCase()));
  const pick = (v: string) => {
    setQ('');
    onPick(v);
    onClose();
  };
  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grabber} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sheetSub}>{subtitle}</Text> : null}
        <View style={styles.searchField}>
          <MagnifyingGlassIcon size={18} color={colors.onSurfaceVariant} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={allowCustom ? customPlaceholder : 'Search'}
            placeholderTextColor={colors.onSurfaceVariant}
            selectionColor={colors.secondary}
            returnKeyType="done"
            onSubmitEditing={() => allowCustom && q.trim() && pick(q.trim())}
            style={styles.searchInput}
          />
        </View>
        <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled">
          {allowCustom && q.trim() && !list.some((o) => o.value.toLowerCase() === q.trim().toLowerCase()) ? (
            <Pressable onPress={() => pick(q.trim())} style={styles.option} accessibilityRole="button">
              <Text style={[styles.optionText, { color: colors.primary }]}>Use “{q.trim()}”</Text>
            </Pressable>
          ) : null}
          {list.map((o) => {
            const on = o.value === value;
            return (
              <Pressable key={o.value} onPress={() => pick(o.value)} style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceAlt }]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, on && { fontFamily: fonts.sansBold }]}>{o.value}</Text>
                  {o.sub ? <Text style={styles.optionSub}>{o.sub}</Text> : null}
                </View>
                {on ? <CheckIcon size={18} color={colors.secondary} weight="bold" /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Generic bottom sheet with a Done button (for counters etc.). */
export function Sheet({ visible, title, onClose, children }: { visible: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16, paddingHorizontal: G }]}>
        <View style={styles.grabber} />
        <Text style={[styles.sheetTitle, { paddingHorizontal: 0 }]}>{title}</Text>
        <View style={{ gap: 4, marginTop: 8 }}>{children}</View>
        <View style={{ marginTop: 16 }}><BigButton label="DONE" onPress={onClose} /></View>
      </View>
    </Modal>
  );
}

/** Opens the platform date picker. Returns [element to render, open function]. */
export function useDatePicker() {
  const [ios, setIos] = useState<{ value: Date; min?: Date; on: (d: Date) => void } | null>(null);
  const open = (value: Date | null, min: Date | undefined, on: (d: Date) => void, mode: 'date' | 'time' = 'date') => {
    const start = value ?? min ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: start, mode, minimumDate: mode === 'date' ? min : undefined, is24Hour: true, onValueChange: (_e, d) => on(d) });
    } else setIos({ value: start, min, on });
  };
  const element = ios ? (
    <Sheet visible title="Choose date" onClose={() => setIos(null)}>
      <DateTimePicker value={ios.value} mode="date" display="inline" minimumDate={ios.min} themeVariant="light" accentColor={colors.primary} onValueChange={(_e, d) => { ios.on(d); setIos({ ...ios, value: d }); }} />
    </Sheet>
  ) : null;
  return [element, open] as const;
}

/* ---------------- below the form ---------------- */

export function SectionTitle({ children, sub, action, onAction }: { children: string; sub?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ paddingHorizontal: G, marginBottom: 12, marginTop: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={styles.sectionTitle}>{children}</Text>
        {action && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} accessibilityRole="button">
            <Text style={styles.viewAll}>{action}</Text>
            <View style={styles.viewAllDot}><CaretRightIcon size={10} color="#fff" weight="bold" /></View>
          </Pressable>
        ) : null}
      </View>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

export function HRow({ children, gap = 10 }: { children: ReactNode; gap?: number }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: G, gap }}>
      {children}
    </ScrollView>
  );
}

export function OfferCards({ items }: { items: { tag: string; title: string; text: string; img: string; cta: string; onPress: () => void }[] }) {
  const w = Math.round(useLayoutWidth() * 0.78);
  return (
    <HRow gap={12}>
      {items.map((o) => (
        <Pressable key={o.title} onPress={o.onPress} style={[styles.offer, { width: w }]} accessibilityRole="button" accessibilityLabel={o.title}>
          <View style={{ height: w * 0.45 }}>
            <Image source={img(o.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={['rgba(7,13,24,0.72)', 'rgba(7,13,24,0.1)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
            <View style={styles.offerTag}><Text style={styles.offerTagText}>{o.tag}</Text></View>
            <View style={{ position: 'absolute', left: 14, bottom: 12, right: '30%' }}>
              <Text style={styles.offerTitle} numberOfLines={2}>{o.title}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 }}>
            <Text style={styles.offerText} numberOfLines={2}>{o.text}</Text>
            <Text style={styles.offerCta}>{o.cta} ›</Text>
          </View>
        </Pressable>
      ))}
    </HRow>
  );
}

export function Bubbles({ items }: { items: { label: string; img: string; onPress: () => void }[] }) {
  return (
    <HRow gap={14}>
      {items.map((b) => (
        <Pressable key={b.label} onPress={b.onPress} style={{ width: 84, alignItems: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel={b.label}>
          <Image source={img(b.img)} style={styles.bubble} contentFit="cover" />
          <Text style={styles.bubbleLabel} numberOfLines={2}>{b.label}</Text>
        </Pressable>
      ))}
    </HRow>
  );
}

/** 3-column photo tiles with a white caption (collections). */
export function TileGrid({ items, columns = 3 }: { items: { label: string; img: string; onPress: () => void }[]; columns?: number }) {
  const width = useLayoutWidth();
  const w = Math.floor((width - G * 2 - 8 * (columns - 1)) / columns);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: G }}>
      {items.map((t) => (
        <Pressable key={t.label} onPress={t.onPress} style={[styles.tile, { width: w, height: Math.round(w * 1.25) }]} accessibilityRole="button" accessibilityLabel={t.label}>
          <Image source={img(t.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(7,13,24,0.8)']} locations={[0.4, 1]} style={StyleSheet.absoluteFill} />
          <Text style={styles.tileLabel} numberOfLines={2}>{t.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Numbered cards, two per column, scrolling sideways (top experiences). */
export function TopList({ items }: { items: { place: string; title: string; price: string; img: string; onPress: () => void }[] }) {
  const w = Math.round(useLayoutWidth() * 0.4);
  const cols: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += 2) cols.push(items.slice(i, i + 2));
  return (
    <HRow gap={10}>
      {cols.map((col, ci) => (
        <View key={ci} style={{ gap: 12 }}>
          {col.map((x, i) => (
            <Pressable key={x.title} onPress={x.onPress} style={{ width: w, gap: 4 }} accessibilityRole="button" accessibilityLabel={x.title}>
              <View style={[styles.topImg, { height: w * 0.75 }]}>
                <Image source={img(x.img)} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(7,13,24,0.7)']} locations={[0.5, 1]} style={StyleSheet.absoluteFill} />
                <View style={styles.rank}><Text style={styles.rankText}>{ci * 2 + i + 1}</Text></View>
                <Text style={styles.topPlace} numberOfLines={1}>{x.place}</Text>
              </View>
              <Text style={styles.topTitle} numberOfLines={2}>{x.title}</Text>
              <Text style={styles.topPrice}>{x.price}</Text>
            </Pressable>
          ))}
        </View>
      ))}
    </HRow>
  );
}

export function TrustStrip({ big, text }: { big: string; text: string }) {
  return (
    <LinearGradient colors={['rgba(51,51,51,0.14)', 'rgba(51,51,51,0.02)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.trust}>
      <Text style={styles.trustBig}>{big}</Text>
      <Text style={styles.trustText}>{text}</Text>
    </LinearGradient>
  );
}

export function InfoCards({ items }: { items: { icon: Icon; title: string; text: string; onPress?: () => void }[] }) {
  const w = Math.round(useLayoutWidth() * 0.72);
  return (
    <HRow gap={12}>
      {items.map((x) => (
        <Pressable key={x.title} onPress={x.onPress} style={[styles.info, { width: w }]} accessibilityRole="button" accessibilityLabel={x.title}>
          <View style={styles.infoIcon}><x.icon size={24} color={colors.primary} weight="duotone" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle} numberOfLines={2}>{x.title}</Text>
            <Text style={styles.infoText} numberOfLines={3}>{x.text}</Text>
          </View>
        </Pressable>
      ))}
    </HRow>
  );
}

export function Faqs({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <View style={{ paddingHorizontal: G, gap: 10 }}>
      {items.map((f, i) => (
        <Pressable key={f.q} onPress={() => setOpen(open === i ? null : i)} style={styles.faq} accessibilityRole="button" accessibilityState={{ expanded: open === i }}>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Text style={styles.faqQ}>Q. {f.q}</Text>
            {open === i ? <CaretUpIcon size={16} color={colors.primary} weight="bold" /> : <CaretDownIcon size={16} color={colors.primary} weight="bold" />}
          </View>
          {open === i ? <Text style={styles.faqA}>{f.a}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

/** Quick-tool tiles (icon + label) in a white card, 3 or 4 per row. */
export function ToolTiles({ items }: { items: { icon: Icon; label: string; onPress: () => void }[] }) {
  return (
    <View style={{ paddingHorizontal: G }}>
      <View style={styles.tools}>
        {items.map((t) => (
          <Pressable key={t.label} onPress={t.onPress} style={({ pressed }) => [styles.toolItem, { width: `${100 / Math.min(items.length, 4)}%` }, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={t.label}>
            <t.icon size={28} color={colors.secondary} weight="duotone" />
            <Text style={styles.toolLabel} numberOfLines={2}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 10, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: colors.border, zIndex: 2 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.onSurface },
  headerSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant },
  heroCaption: { position: 'absolute', left: 0, right: 0, bottom: 44, alignItems: 'center', paddingHorizontal: 20 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: '#fff', textAlign: 'center' },
  heroSub: { fontFamily: fonts.sansMedium, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4, textAlign: 'center' },
  dots: { position: 'absolute', bottom: 32, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  formWrap: { backgroundColor: CARD, borderRadius: radius.xl, marginHorizontal: 0, paddingHorizontal: G, paddingTop: 16, paddingBottom: 18, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, ...squircle },
  formCard: { gap: 10 },
  modeRow: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 3, backgroundColor: CARD },
  mode: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent' },
  modeOn: { borderColor: colors.primary, backgroundColor: 'rgba(220,53,75,0.07)' },
  modeText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.onSurfaceVariant, letterSpacing: 0.3 },
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9, minHeight: 62 },
  boxLabel: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 0.6, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  boxValue: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.onSurface, marginTop: 1 },
  boxPlaceholder: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.primary, marginTop: 2 },
  boxSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.onSurfaceVariant },
  swap: { position: 'absolute', left: '50%', top: '50%', marginLeft: -16, marginTop: -16, width: 32, height: 32, borderRadius: 16, backgroundColor: CARD, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  nights: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, backgroundColor: CARD },
  nightsText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.onSurfaceVariant },
  big: { marginTop: 14, height: 52, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', boxShadow: '0 6px 16px rgba(220,53,75,0.28)' },
  bigCompact: { marginTop: 0, height: 40, paddingHorizontal: 18 },
  bigText: { fontFamily: fonts.sansBold, fontSize: 16, letterSpacing: 1, color: '#fff' },
  chipLabel: { fontFamily: fonts.sansSemi, fontSize: 12, letterSpacing: 0.5, color: colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 4 },
  optChip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: CARD },
  optChipOn: { borderColor: colors.primary, backgroundColor: 'rgba(220,53,75,0.06)' },
  optChipText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.onSurface },
  optChipSub: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.secondary, marginTop: 1 },
  pinBar: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: G, paddingVertical: 8, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: colors.border, boxShadow: '0 6px 14px rgba(45,43,38,0.08)', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  pinText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 13, lineHeight: 17, color: colors.onSurface },
  backdrop: { flex: 1, backgroundColor: 'rgba(45,43,38,0.4)' },
  sheet: { backgroundColor: CARD, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: 8, maxHeight: '88%', width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.onSurface, paddingHorizontal: G },
  sheetSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceVariant, paddingHorizontal: G, marginTop: 2 },
  searchField: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: G, marginVertical: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontFamily: fonts.sans, fontSize: 16, color: colors.onSurface },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: G, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.onSurface },
  optionSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant, marginTop: 1 },
  sectionTitle: { flex: 1, fontFamily: fonts.serif, fontSize: 21, lineHeight: 26, color: colors.onSurface },
  sectionSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceVariant, marginTop: 2 },
  viewAll: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  viewAllDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  offer: { backgroundColor: CARD, borderRadius: radius.lg, overflow: 'hidden', ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.07)' },
  offerTag: { position: 'absolute', right: 10, top: 10, backgroundColor: CARD, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  offerTagText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.6, color: colors.onSurface },
  offerTitle: { fontFamily: fonts.sansBold, fontSize: 17, lineHeight: 21, color: '#fff' },
  offerText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant },
  offerCta: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primary },
  bubble: { width: 78, height: 78, borderRadius: 39, borderWidth: 2, borderColor: CARD },
  bubbleLabel: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 16, color: colors.onSurface, textAlign: 'center' },
  tile: { borderRadius: radius.lg, overflow: 'hidden', justifyContent: 'flex-end', ...squircle },
  tileLabel: { padding: 10, fontFamily: fonts.sansBold, fontSize: 14, lineHeight: 17, color: '#fff' },
  topImg: { borderRadius: radius.md, overflow: 'hidden', justifyContent: 'flex-end' },
  rank: { position: 'absolute', left: 0, top: 0, backgroundColor: colors.primary, borderBottomRightRadius: radius.md, paddingHorizontal: 9, paddingVertical: 3 },
  rankText: { fontFamily: fonts.sansBold, fontSize: 14, color: '#fff' },
  topPlace: { padding: 7, fontFamily: fonts.sansBold, fontSize: 12.5, color: '#fff' },
  topTitle: { fontFamily: fonts.sansSemi, fontSize: 13.5, lineHeight: 17, color: colors.onSurface },
  topPrice: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.onSurfaceVariant },
  trust: { marginTop: 26, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: G, paddingVertical: 18 },
  trustBig: { fontFamily: fonts.serif, fontSize: 30, color: colors.secondary },
  trustText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13.5, color: colors.onSurface },
  info: { flexDirection: 'row', gap: 12, backgroundColor: CARD, borderRadius: radius.lg, padding: 14, ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.06)' },
  infoIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.onSurface },
  infoText: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: colors.onSurfaceVariant, marginTop: 2 },
  faq: { backgroundColor: CARD, borderRadius: radius.lg, padding: 14, ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.05)' },
  faqQ: { flex: 1, fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.onSurface },
  faqA: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.onSurfaceVariant, marginTop: 8 },
  tools: { backgroundColor: CARD, borderRadius: radius.lg, flexDirection: 'row', flexWrap: 'wrap', paddingVertical: 14, rowGap: 14, ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.06)' },
  toolItem: { alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  toolLabel: { fontFamily: fonts.sansMedium, fontSize: 12.5, lineHeight: 16, color: colors.onSurface, textAlign: 'center' },
});
