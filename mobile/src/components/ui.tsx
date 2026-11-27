// Core building blocks that implement the components in degine.md.
import { useState, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type ScrollViewProps,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, space, squircle, TAB_BAR_SPACE, type } from '@/theme';
import { brand } from '@/lib/images';
import { useColumns, useLayoutWidth } from '@/lib/layout';
import { ArrowRightIcon, MagnifyingGlassIcon, MountainsIcon, StarIcon, XIcon, type Icon } from './icons';

/* ---------- press feedback (active:scale-95) ---------- */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that scales down slightly while pressed. A single element, so layout styles (flex, width, margins) apply directly. */
export function Tap({ style, children, scaleTo = 0.96, ...rest }: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: ReactNode }) {
  const s = useState(() => new Animated.Value(1))[0];
  const to = (v: number) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  return (
    <AnimatedPressable onPressIn={() => to(scaleTo)} onPressOut={() => to(1)} {...rest} style={[style, { transform: [{ scale: s }] }]}>
      {children}
    </AnimatedPressable>
  );
}

/* ---------- page scaffolding ---------- */

export function Screen({
  children,
  tabs = false,
  modal = false,
  style,
  contentStyle,
  pinBelowStatusBar = false,
  ...rest
}: ScrollViewProps & { tabs?: boolean; modal?: boolean; contentStyle?: StyleProp<ViewStyle>; children: ReactNode; /** for sticky headers: the scroll area starts below the status bar */ pinBelowStatusBar?: boolean }) {
  const insets = useSafeAreaInsets();
  // iOS modal sheets already sit below the status bar.
  const top = pinBelowStatusBar ? 8 : modal && Platform.OS === 'ios' ? 12 : insets.top + 12;
  const coverStatusBar = !(modal && Platform.OS === 'ios');
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScrollView
        style={[{ flex: 1, backgroundColor: colors.surface }, pinBelowStatusBar ? { marginTop: insets.top } : null, style]}
        contentContainerStyle={[{ paddingTop: top, paddingBottom: tabs ? TAB_BAR_SPACE : insets.bottom + 40 }, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        {...rest}
      >
        {children}
      </ScrollView>
      {/* cream band behind the status bar so scrolled content never runs under the clock */}
      {coverStatusBar ? <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: 'rgba(255,255,255,0.96)' }} /> : null}
    </View>
  );
}

export const Gutter = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ paddingHorizontal: space.gutter }, style]}>{children}</View>;

/** Card list that is one column on phones and two on tablets. */
export function CardGrid({ children, gap = space.lg, minCardWidth = 300, style }: { children: ReactNode; gap?: number; minCardWidth?: number; style?: StyleProp<ViewStyle> }) {
  const cols = useColumns(minCardWidth);
  const width = useLayoutWidth();
  if (cols === 1) return <Gutter style={[{ gap }, style]}>{children}</Gutter>;
  const cell = (width - space.gutter * 2 - gap * (cols - 1)) / cols;
  const items = Array.isArray(children) ? children : [children];
  return (
    <Gutter style={[{ flexDirection: 'row', flexWrap: 'wrap', gap }, style]}>
      {items.map((c, i) => <View key={i} style={{ width: cell }}>{c}</View>)}
    </Gutter>
  );
}

export const Section = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[{ marginTop: space.section }, style]}>{children}</View>;

/** Tracked-out micro-kicker: 10px / 700 / +0.2em / uppercase / taupe. */
export const Kicker = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[type.labelUpper, style]}>{children}</Text>;

export function SectionHeader({ kicker, title, action, onAction, style }: { kicker?: string; title: string; action?: string; onAction?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingHorizontal: space.gutter, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginBottom: space.md }, style]}>
      <View style={{ flex: 1 }}>
        {kicker ? <Kicker style={{ marginBottom: 6, color: colors.primary }}>{kicker}</Kicker> : null}
        <Text style={type.headlineLg}>{title}</Text>
      </View>
      {action && onAction ? <TextButton label={action} onPress={onAction} /> : null}
    </View>
  );
}

export const Hairline = ({ style }: { style?: StyleProp<ViewStyle> }) => <View style={[{ height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border }, style]} />;

/* ---------- brand ---------- */

export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Image source={brand.mark} style={{ width: size * 1.7, height: size }} contentFit="contain" accessibilityIgnoresInvertColors />
      <View>
        <Text style={[type.headlineSm, { lineHeight: 20 }]}>Mountain Planet</Text>
        <Text style={[type.labelUpper, { fontSize: 8, lineHeight: 11 }]}>Nepal</Text>
      </View>
    </View>
  );
}

/* ---------- buttons ---------- */

export function PrimaryButton({ label, onPress, icon: I, disabled, style }: { label: string; onPress?: () => void; icon?: Icon; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Tap onPress={onPress} disabled={disabled} accessibilityRole="button" style={[styles.primary, disabled && { opacity: 0.55 }, style]}>
      {I ? <I size={20} color={colors.onPrimary} weight="bold" /> : null}
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[type.headlineMd, { color: colors.onPrimary, letterSpacing: 0.2, flexShrink: 1 }]}>{label}</Text>
    </Tap>
  );
}

export function SecondaryButton({ label, onPress, icon: I, style }: { label: string; onPress?: () => void; icon?: Icon; style?: StyleProp<ViewStyle> }) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" style={[styles.secondary, style]}>
      {I ? <I size={18} color={colors.onSecondary} /> : null}
      <Text numberOfLines={1} style={[type.labelMd, { color: colors.onSecondary, flexShrink: 1 }]}>{label}</Text>
    </Tap>
  );
}

export function TextButton({ label, onPress, arrow = true, style }: { label: string; onPress?: () => void; arrow?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={8} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, opacity: pressed ? 0.6 : 1 }, style]}>
      <Text style={[type.labelMd, { color: colors.primary, fontFamily: fonts.sansSemi }]}>{label}</Text>
      {arrow ? <ArrowRightIcon size={14} color={colors.primary} /> : null}
    </Pressable>
  );
}

export function SoftButton({ label, onPress, icon: I, style }: { label: string; onPress?: () => void; icon?: Icon; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.soft, { backgroundColor: pressed ? colors.primarySoftPressed : colors.primarySoft }, style]}
    >
      {I ? <I size={20} color={colors.primary} /> : null}
      <Text style={[type.labelSm, { color: colors.primary, fontFamily: fonts.sansBold }]}>{label}</Text>
    </Pressable>
  );
}

/** Glassmorphic circular icon button over photography. */
export function GlassButton({ icon: I, onPress, label, active }: { icon: Icon; onPress?: () => void; label: string; active?: boolean }) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.glass} scaleTo={0.92}>
      <I size={22} color="#FFFFFF" weight={active ? 'fill' : 'bold'} />
    </Tap>
  );
}

/* ---------- chips & badges ---------- */

export function Chip({ label, active, onPress, icon: I }: { label: string; active?: boolean; onPress?: () => void; icon?: Icon }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [styles.chip, active ? [styles.chipActive, shadow.hairline] : null, pressed && !active ? { backgroundColor: colors.border } : null]}
    >
      {I ? <I size={16} color={active ? colors.onSecondary : colors.onSurfaceVariant} weight={active ? 'fill' : 'regular'} /> : null}
      <Text numberOfLines={1} style={[type.labelMd, { color: active ? colors.onSecondary : colors.onSurface }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: space.sm }} style={style}>
      {children}
    </ScrollView>
  );
}

/** Card width for side-scrolling rows: a share of the screen, so the next card clearly peeks in. */
export function useCardWidth(share = 0.82) {
  const w = useLayoutWidth();
  return Math.round((w - space.gutter * 2) * share);
}
/** Two cards side by side, both fully visible. */
export function useHalfCardWidth() {
  const w = useLayoutWidth();
  return Math.floor((w - space.gutter * 2 - space.md) / 2);
}

/** Horizontal card row that snaps card by card, sized to the screen (no half-cut cards on any phone). */
export function Carousel({ children, itemWidth, style }: { children: ReactNode; itemWidth: number; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={itemWidth + space.md}
      snapToAlignment="start"
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: space.gutter, gap: space.md }}
      style={[{ flexGrow: 0 }, style]}
    >
      {children}
    </ScrollView>
  );
}

export const TagChip = ({ label }: { label: string }) => (
  <View style={styles.tag}>
    <Text style={type.labelMd}>{label}</Text>
  </View>
);

export const BadgePill = ({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.badge, style]}>
    <Text numberOfLines={1} style={[type.labelSm, { color: colors.onPrimary, textTransform: 'uppercase', letterSpacing: 0.8 }]}>{label}</Text>
  </View>
);

export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} color={i <= n ? colors.primary : colors.border} weight="fill" />
      ))}
    </View>
  );
}

/** Small taupe metadata line with a leading regular icon. */
export function Meta({ icon: I, children, light, fill }: { icon: Icon; children: ReactNode; light?: boolean; fill?: boolean }) {
  const c = light ? 'rgba(255,255,255,0.85)' : colors.onSurfaceVariant;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <I size={14} color={fill ? colors.primary : c} weight={fill ? 'fill' : 'regular'} />
      <Text style={[type.bodySm, { color: c }]}>{children}</Text>
    </View>
  );
}

/* ---------- surfaces ---------- */

export const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[styles.card, style]}>{children}</View>;

/** Info call-out: clay-rose at low alpha. */
export const Callout = ({ icon: I, children }: { icon: Icon; children: ReactNode }) => (
  <View style={styles.callout}>
    <I size={20} color={colors.destructive} />
    <Text style={[type.bodySm, { flex: 1, color: colors.onSurface }]}>{children}</Text>
  </View>
);

/** Warm biscuit placeholder with a duotone icon — never an empty gray box. */
export const ImageFallback = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, style]}>
    <MountainsIcon size={28} color={colors.onSurfaceVariant} weight="duotone" />
  </View>
);

/* ---------- inputs ---------- */

export function SearchInput({ value, onChangeText, placeholder, ...rest }: TextInputProps & { ref?: React.Ref<React.ComponentRef<typeof TextInput>> }) {
  return (
    <View style={styles.inputWrap}>
      <MagnifyingGlassIcon size={20} color={colors.onSurfaceVariant} style={{ position: 'absolute', left: 16 }} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        returnKeyType="search"
        style={[styles.input, { paddingLeft: 48, paddingRight: value ? 44 : 16 }]}
        selectionColor={colors.secondary}
        {...rest}
      />
      {value ? (
        <Pressable onPress={() => onChangeText?.('')} hitSlop={10} style={{ position: 'absolute', right: 16 }} accessibilityLabel="Clear search">
          <XIcon size={18} color={colors.onSurfaceVariant} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function Field({ label, style, multiline, ...rest }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Kicker>{label}</Kicker>
      <FocusInput multiline={multiline} style={[styles.input, multiline && { minHeight: 120, textAlignVertical: 'top', paddingTop: 16 }, style]} {...rest} />
    </View>
  );
}

/** Biscuit input with the sage focus ring from the spec. */
function FocusInput({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.onSurfaceVariant}
      selectionColor={colors.secondary}
      {...props}
      style={[style, { borderWidth: 2, borderColor: focused ? colors.secondary : 'transparent' }]}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}

/* ---------- decorative ---------- */

export const StepNumeral = ({ n }: { n: number }) => <Text style={[type.numeralStep, { width: 64 }]}>{String(n).padStart(2, '0')}</Text>;

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: 24,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...squircle,
    ...shadow.cta,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadow.hairline,
  },
  soft: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, borderRadius: radius.full, paddingHorizontal: 20, paddingVertical: 10 },
  glass: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center', ...shadow.glass },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.full, backgroundColor: colors.surfaceAlt },
  chipActive: { backgroundColor: colors.secondary },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, ...squircle },
  badge: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  card: { backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, padding: space.card, ...squircle, ...shadow.hairline },
  callout: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', backgroundColor: colors.destructiveSoft, borderRadius: radius.md, padding: 16, ...squircle },
  inputWrap: { justifyContent: 'center' },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.onSurface,
    ...squircle,
  },
});
