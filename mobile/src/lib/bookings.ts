// Bookings for hotels, homestays, cabs / vehicles, domestic flights and activity tickets.
//
// With the backend: sent to the create-booking Edge Function, which stores it, emails the team
// and emails the customer a confirmation with a reference (e.g. MP-C-7K3Q9).
// Without the backend (or if it is unreachable): the phone's email app opens with all details.
// Every booking made on this phone is also remembered locally so "My bookings" always lists it.

import { useCallback, useEffect, useState } from 'react';
import { Linking as RNLinking } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONTACT } from '@/data/tours';
import { supabase } from './supabase';

export type BookingKind = 'hotel' | 'homestay' | 'cab' | 'flight' | 'ticket';
export type BookingStatus = 'requested' | 'quoted' | 'accepted' | 'paid' | 'confirmed' | 'cancelled' | 'completed' | 'emailed';

export const KIND_LABEL: Record<BookingKind, string> = {
  hotel: 'Hotel',
  homestay: 'Homestay',
  cab: 'Cab / vehicle',
  flight: 'Domestic flight',
  ticket: 'Activity ticket',
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  requested: 'Requested',
  quoted: 'Price sent',
  accepted: 'Awaiting payment',
  paid: 'Paid',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  emailed: 'Sent by email',
};

export interface BookingInput {
  kind: BookingKind;
  name: string;
  email: string;
  phone?: string;
  startDate: string; // yyyy-mm-dd
  endDate?: string;
  startTime?: string; // HH:MM
  location?: string;
  destination?: string;
  guests: number;
  details?: Record<string, string | number | boolean>;
  notes?: string;
  staySlug?: string;
  promoCode?: string;
  /** Human title for lists, e.g. "Kathmandu → Lukla" */
  title: string;
}

export interface Booking {
  id: string;
  reference: string | null;
  kind: BookingKind;
  status: BookingStatus;
  title: string;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  guests: number;
  quoteUsd?: number | null;
  teamNote?: string | null;
  createdAt: string;
  /** Partner bookings: server-set total in rupees, how the guest pays, and the property's answer. */
  totalNpr?: number | null;
  payAtProperty?: boolean;
  partnerStatus?: 'pending' | 'accepted' | 'declined' | null;
  partnerDeadline?: string | null;
  stayName?: string | null;
  roomName?: string | null;
}

const LOCAL_KEY = 'mpn-bookings';
const CACHE_KEY = 'mpn-bookings-cache';

async function readLocal(): Promise<Booking[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(LOCAL_KEY)) || '[]');
  } catch {
    return [];
  }
}
async function remember(b: Booking) {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([b, ...(await readLocal()).filter((x) => x.id !== b.id)].slice(0, 50)));
  } catch {
    /* not critical */
  }
}

function mailto(b: BookingInput) {
  const lines = [
    `Booking request — ${KIND_LABEL[b.kind]}`,
    `What: ${b.title}`,
    `Date: ${b.startDate}${b.endDate ? ` to ${b.endDate}` : ''}${b.startTime ? ` at ${b.startTime}` : ''}`,
    b.location ? `From / where: ${b.location}` : '',
    b.destination ? `To: ${b.destination}` : '',
    `Guests: ${b.guests}`,
    ...Object.entries(b.details ?? {}).map(([k, v]) => `${k}: ${v}`),
    '',
    `Name: ${b.name}`,
    `Email: ${b.email}`,
    b.phone ? `Phone: ${b.phone}` : '',
    b.notes ? `\n${b.notes}` : '',
  ].filter((l) => l !== '');
  return `mailto:${CONTACT.email}?subject=${encodeURIComponent(`${KIND_LABEL[b.kind]} booking: ${b.title}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

export type SubmitResult = { mode: 'online'; reference: string } | { mode: 'email' };

/** Throws an Error with a user-facing message for validation problems. */
export async function submitBooking(b: BookingInput): Promise<SubmitResult> {
  const createdAt = new Date().toISOString();
  if (supabase) {
    const { title, ...payload } = b;
    const { data, error } = await supabase.functions.invoke('create-booking', { body: payload });
    if (!error && data?.reference) {
      await remember({ id: data.id, reference: data.reference, kind: b.kind, status: 'requested', title, startDate: b.startDate, endDate: b.endDate, startTime: b.startTime, guests: b.guests, createdAt });
      return { mode: 'online', reference: data.reference };
    }
    let msg = '';
    try {
      msg = (await (error as { context?: Response } | null)?.context?.json())?.error ?? '';
    } catch {
      /* no JSON body */
    }
    // Validation / rate-limit messages are shown; network or server trouble falls back to email.
    if (msg && !/could not save/i.test(msg)) throw new Error(msg);
  }
  await RNLinking.openURL(mailto(b)).catch(() => {
    throw new Error(`No email app found. Please write to ${CONTACT.email}.`);
  });
  await remember({ id: `local-${Date.now()}`, reference: null, kind: b.kind, status: 'emailed', title: b.title, startDate: b.startDate, endDate: b.endDate, startTime: b.startTime, guests: b.guests, createdAt });
  return { mode: 'email' };
}

interface Row { id: string; reference: string; kind: BookingKind; status: BookingStatus; start_date: string; end_date: string | null; start_time: string | null; guests: number; quote_usd: number | null; team_note: string | null; created_at: string; location: string | null; destination: string | null; stay_slug: string | null; total_npr?: number | null; pay_at_property?: boolean; partner_status?: 'pending' | 'accepted' | 'declined' | null; partner_deadline?: string | null; details?: Record<string, unknown> | null }

/** Bookings from the account (live status) merged with ones remembered on this phone. */
export async function fetchMyBookings(): Promise<Booking[]> {
  const local = await readLocal();
  if (!supabase) return local;
  const { data: auth } = await supabase.auth.getSession();
  if (!auth.session) return local;
  const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(100);
  // Offline (e.g. on the trail): show the last list we fetched.
  if (error) {
    try {
      const cached: Booking[] = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) || '[]');
      return [...cached, ...local.filter((l) => !cached.some((c) => c.id === l.id))];
    } catch {
      return local;
    }
  }
  const remote: Booking[] = ((data ?? []) as Row[]).map((r) => {
    const l = local.find((x) => x.id === r.id);
    const where = r.destination ? `${r.location} → ${r.destination}` : r.location ?? '';
    return {
      id: r.id,
      reference: r.reference,
      kind: r.kind,
      status: r.status,
      title: l?.title ?? ((r.details?.stay as string) || where || KIND_LABEL[r.kind]),
      startDate: r.start_date,
      endDate: r.end_date,
      startTime: r.start_time,
      guests: r.guests,
      quoteUsd: r.quote_usd,
      teamNote: r.team_note,
      createdAt: r.created_at,
      totalNpr: r.total_npr ?? null,
      payAtProperty: !!r.pay_at_property,
      partnerStatus: r.partner_status ?? null,
      partnerDeadline: r.partner_deadline ?? null,
      stayName: (r.details?.stay as string) ?? null,
      roomName: (r.details?.room as string) ?? null,
    };
  });
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(remote)).catch(() => {});
  return [...remote, ...local.filter((l) => !remote.some((r) => r.id === l.id))].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Customer accepts the price the team sent. */
export async function acceptBooking(id: string) {
  if (!supabase) throw new Error('Please contact our team.');
  const { error } = await supabase.rpc('accept_booking', { booking_id: id });
  if (error) throw new Error(error.message || 'Could not accept. Please contact our team.');
}

/**
 * Pay for an accepted booking with Khalti (NPR) or card (Stripe, USD).
 * Opens the provider's page; returns 'paid' | 'cancelled' | 'failed'.
 */
export async function payBooking(id: string, provider: 'khalti' | 'stripe'): Promise<'paid' | 'cancelled' | 'failed'> {
  if (!supabase) throw new Error('Online payment is not available yet. Please contact our team.');
  const appReturnUrl = Linking.createURL('bookings');
  const { data, error } = await supabase.functions.invoke('create-payment', { body: { bookingId: id, provider, appReturnUrl } });
  if (error || !data?.url) {
    let msg = '';
    try {
      msg = (await (error as { context?: Response } | null)?.context?.json())?.error ?? '';
    } catch {
      /* no body */
    }
    throw new Error(msg || 'Could not start the payment. Please try again.');
  }
  const res = await WebBrowser.openAuthSessionAsync(data.url, appReturnUrl);
  if (res.type !== 'success') return 'cancelled';
  const status = new URL(res.url).searchParams.get('status');
  return status === 'paid' ? 'paid' : status === 'cancelled' ? 'cancelled' : 'failed';
}

export async function cancelBooking(id: string) {
  if (!supabase) throw new Error('Please contact our team to cancel.');
  const { error } = await supabase.rpc('cancel_booking', { booking_id: id });
  if (error) throw new Error(error.message || 'Could not cancel. Please contact our team.');
  const local = await readLocal();
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(local.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))).catch(() => {});
}

const listeners = new Set<() => void>();
export const notifyBookingsChanged = () => listeners.forEach((l) => l());

export function useMyBookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setItems(await fetchMyBookings());
    setLoading(false);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from storage / network
    reload();
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);
  return { items, loading, reload };
}
