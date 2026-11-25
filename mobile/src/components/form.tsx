// Form controls for the booking screens (reference layout, degine.md styling).
import { MAX_CONTENT_WIDTH } from '@/lib/layout';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow, space, squircle, type } from '@/theme';
import { Kicker } from './ui';
import { CaretDownIcon, CheckIcon, MinusIcon, PlusIcon, type Icon } from './icons';

/** Two- or three-way pill toggle ("One way | Round trip"). */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.seg} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segItem, on && styles.segOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
            <Text style={[type.labelMd, { color: on ? colors.onSurface : colors.onSurfaceVariant, fontFamily: on ? fonts.sansSemi : fonts.sansMedium }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Dropdown that opens a bottom sheet of options; optional "type your own" entry. */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select',
  icon: I,
  allowCustom,
  customPlaceholder = 'Type another place',
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: Icon;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const insets = useSafeAreaInsets();
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setCustom('');
  };
  return (
    <View style={{ gap: 8, flex: 1 }}>
      <Kicker>{label}</Kicker>
      <Pressable onPress={() => setOpen(true)} style={styles.select} accessibilityRole="button" accessibilityLabel={`${label}: ${value || placeholder}`}>
        {I ? <I size={18} color={colors.onSurfaceVariant} /> : null}
        <Text style={[type.bodyMd, { flex: 1, color: value ? colors.onSurface : colors.onSurfaceVariant }]} numberOfLines={1}>{value || placeholder}</Text>
        <CaretDownIcon size={16} color={colors.onSurfaceVariant} />
      </Pressable>

      <Modal visible={open} transparent statusBarTranslucent navigationBarTranslucent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.grabber} />
          <Text style={[type.headlineMd, { paddingHorizontal: space.gutter, marginBottom: space.md }]}>{label}</Text>
          {allowCustom ? (
            <View style={{ paddingHorizontal: space.gutter, marginBottom: space.sm, flexDirection: 'row', gap: 8 }}>
              <TextInput
                value={custom}
                onChangeText={setCustom}
                placeholder={customPlaceholder}
                placeholderTextColor={colors.onSurfaceVariant}
                selectionColor={colors.secondary}
                returnKeyType="done"
                onSubmitEditing={() => custom.trim() && pick(custom.trim())}
                style={[styles.input, { flex: 1 }]}
              />
              <Pressable onPress={() => custom.trim() && pick(custom.trim())} style={[styles.useBtn, !custom.trim() && { opacity: 0.4 }]} accessibilityRole="button">
                <Text style={[type.labelMd, { color: colors.onSecondary }]}>Use</Text>
              </Pressable>
            </View>
          ) : null}
          <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
            {options.map((o) => {
              const on = o === value;
              return (
                <Pressable key={o} onPress={() => pick(o)} style={({ pressed }) => [styles.option, pressed && { backgroundColor: colors.surfaceAlt }]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                  <Text style={[type.bodyMd, { flex: 1, fontFamily: on ? fonts.sansSemi : fonts.sans }]}>{o}</Text>
                  {on ? <CheckIcon size={18} color={colors.secondary} weight="bold" /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

/** − 2 + counter. */
export function Stepper({ label, value, onChange, min = 0, max = 20, hint }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; hint?: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={{ flex: 1 }}>
        <Text style={type.headlineSm}>{label}</Text>
        {hint ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant }]}>{hint}</Text> : null}
      </View>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} style={[styles.stepBtn, value <= min && { opacity: 0.35 }]} accessibilityLabel={`Fewer ${label}`} hitSlop={6}>
        <MinusIcon size={16} color={colors.onSurface} weight="bold" />
      </Pressable>
      <Text style={[type.headlineMd, { minWidth: 32, textAlign: 'center' }]} accessibilityLabel={`${value} ${label}`}>{value}</Text>
      <Pressable onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} style={[styles.stepBtn, value >= max && { opacity: 0.35 }]} accessibilityLabel={`More ${label}`} hitSlop={6}>
        <PlusIcon size={16} color={colors.onSurface} weight="bold" />
      </Pressable>
    </View>
  );
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!checked)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.check, checked && { backgroundColor: colors.secondary, borderColor: colors.secondary }]}>{checked ? <CheckIcon size={14} color="#fff" weight="bold" /> : null}</View>
      <Text style={[type.bodySm, { flex: 1 }]}>{label}</Text>
    </Pressable>
  );
}

/** Cream card that overlaps the hero photo on booking screens (reference "form card"). */
export const FormCard = ({ children }: { children: React.ReactNode }) => <View style={styles.formCard}>{children}</View>;

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 4, ...squircle },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: radius.md },
  segOn: { backgroundColor: colors.surface, ...shadow.hairline, boxShadow: '0 1px 3px rgba(90,80,70,0.12)' },
  select: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 15, ...squircle },
  backdrop: { flex: 1, backgroundColor: 'rgba(45,43,38,0.35)' },
  sheet: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center', backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderCurve: 'continuous', paddingTop: 10, ...shadow.sheet },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 16 },
  option: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  input: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 13, fontFamily: fonts.sans, fontSize: 16, color: colors.onSurface },
  useBtn: { backgroundColor: colors.secondary, borderRadius: radius.full, paddingHorizontal: 20, justifyContent: 'center' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  stepBtn: { width: 36, height: 36, borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  check: { width: 22, height: 22, borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.onSurfaceVariant, alignItems: 'center', justifyContent: 'center' },
  formCard: {
    marginHorizontal: space.md,
    marginTop: -90,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    gap: 18,
    ...squircle,
    boxShadow: '0 16px 40px rgba(45,43,38,0.14)',
  },
});
