import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { colors, radius, squircle, type } from '@/theme';
import { Kicker, TextButton } from './ui';
import { CalendarBlankIcon, ClockIcon } from './icons';

export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = (d: Date) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
/** yyyy-mm-dd in local time (what the backend stores). */
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Biscuit field that opens the native date (or time) picker:
 * the system dialog on Android, an inline calendar / wheel on iOS.
 */
export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  placeholder = 'Choose',
}: {
  label: string;
  value: Date | null;
  onChange: (d: Date) => void;
  mode?: 'date' | 'time';
  minimumDate?: Date;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const I = mode === 'date' ? CalendarBlankIcon : ClockIcon;
  const shown = value ? (mode === 'date' ? fmtDate(value) : fmtTime(value)) : placeholder;

  const press = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? minimumDate ?? new Date(),
        mode,
        minimumDate: mode === 'date' ? minimumDate : undefined,
        is24Hour: true,
        onValueChange: (_e, d) => onChange(d),
      });
    } else {
      setOpen((o) => !o);
    }
  };

  return (
    <View style={{ gap: 8, flex: 1 }}>
      <Kicker>{label}</Kicker>
      <Pressable
        onPress={press}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${shown}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 15, borderWidth: 2, borderColor: open ? colors.secondary : 'transparent', ...squircle }}
      >
        <I size={18} color={colors.onSurfaceVariant} />
        <Text style={[type.bodyMd, { color: value ? colors.onSurface : colors.onSurfaceVariant, flex: 1 }]} numberOfLines={1}>{shown}</Text>
      </Pressable>
      {open && Platform.OS === 'ios' ? (
        <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, padding: 8, ...squircle }}>
          <DateTimePicker
            value={value ?? minimumDate ?? new Date()}
            mode={mode}
            display={mode === 'date' ? 'inline' : 'spinner'}
            minimumDate={mode === 'date' ? minimumDate : undefined}
            themeVariant="light"
            accentColor={colors.primary}
            onValueChange={(_e, d) => onChange(d)}
          />
          <TextButton label="Done" arrow={false} onPress={() => { if (!value) onChange(minimumDate ?? new Date()); setOpen(false); }} style={{ alignSelf: 'flex-end', marginRight: 8 }} />
        </View>
      ) : null}
    </View>
  );
}
