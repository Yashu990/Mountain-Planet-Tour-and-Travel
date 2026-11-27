// Step 2 of every service: review what was chosen, add traveller details, send the request.
// (Flights, cabs, activities and treks are request-based: our team confirms the price.)
import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, squircle } from '@/theme';
import { BookingDone, useBookingSubmit, useContact } from './BookingLayout';
import type { BookingInput } from '@/lib/bookings';
import { Field } from './ui';
import { ArrowLeftIcon, PencilSimpleIcon } from './icons';
import { CARD, G, PAGE } from './service';

export function ReviewStep({
  title,
  lines,
  onEdit,
  build,
  notesPlaceholder,
  cta = 'REQUEST BOOKING',
  extra,
}: {
  title: string;
  /** label / value rows of what was chosen */
  lines: [string, string][];
  onEdit: () => void;
  /** returns the booking (without contact fields) */
  build: () => Omit<BookingInput, 'name' | 'email' | 'phone' | 'promoCode' | 'notes'>;
  notesPlaceholder?: string;
  cta?: string;
  extra?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const { contact, fields, validate } = useContact();
  const { done, submit, footer } = useBookingSubmit();
  const [notes, setNotes] = useState('');
  if (done) return <BookingDone result={done} />;

  const send = () => {
    const problem = validate();
    submit({ ...build(), name: contact.name, email: contact.email, phone: contact.phone, promoCode: contact.promo || undefined, notes }, problem || undefined);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: PAGE }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={onEdit} hitSlop={10} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back to search">
          <ArrowLeftIcon size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Review & request</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: G, gap: 14, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Pressable onPress={onEdit} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }} accessibilityRole="button" accessibilityLabel="Edit search">
              <PencilSimpleIcon size={16} color={colors.primary} weight="bold" />
              <Text style={styles.edit}>Edit</Text>
            </Pressable>
          </View>
          {lines.map(([k, v]) => (
            <View key={k} style={styles.line}>
              <Text style={styles.lineK}>{k}</Text>
              <Text style={styles.lineV}>{v}</Text>
            </View>
          ))}
        </View>
        {extra}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Traveller details</Text>
          {fields}
          <Field label="Notes (optional)" value={notes} onChangeText={setNotes} multiline placeholder={notesPlaceholder ?? 'Anything we should know?'} />
        </View>
        <View style={styles.note}>
          <Text style={styles.noteText}>No payment now. Our Kathmandu team confirms availability and sends the final price, usually within a few hours. You can then pay in the app.</Text>
        </View>
        {footer(cta, send)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingBottom: 10, backgroundColor: CARD, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.onSurface },
  card: { backgroundColor: CARD, borderRadius: radius.lg, padding: 16, gap: 12, ...squircle, boxShadow: '0 2px 8px rgba(45,43,38,0.06)' },
  cardTitle: { flex: 1, fontFamily: fonts.sansBold, fontSize: 17, color: colors.onSurface },
  edit: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  line: { flexDirection: 'row', gap: 12, paddingVertical: 2 },
  lineK: { width: 110, fontFamily: fonts.sans, fontSize: 13.5, color: colors.onSurfaceVariant },
  lineV: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 14, color: colors.onSurface },
  note: { backgroundColor: 'rgba(51,51,51,0.10)', borderRadius: radius.md, padding: 12 },
  noteText: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.onSurface },
});
