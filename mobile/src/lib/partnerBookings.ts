// Phase 3: live prices & availability for partner rooms, booking requests, and the partner's side
// (requests to accept / decline, room calendar). All prices are computed by the database.
import { supabase } from './supabase';

export interface Quote {
  available: boolean;
  reason?: string;
  nights?: number;
  rooms?: number;
  total_npr?: number;
  nightly?: { day: string; price_npr: number }[];
}

const friendly = (m?: string) => (m ?? 'Something went wrong. Please try again.').replace(/^.*?ERROR:\s*/i, '');

export async function quoteStay(roomId: string, checkIn: string, checkOut: string, rooms: number): Promise<Quote> {
  if (!supabase) return { available: false, reason: 'Live prices need an internet connection.' };
  const { data, error } = await supabase.rpc('quote_stay', { room: roomId, check_in: checkIn, check_out: checkOut, rooms });
  if (error) return { available: false, reason: 'Couldn’t check prices right now. Please try again.' };
  return data as Quote;
}

export interface StayRequest {
  roomId: string;
  checkIn: string;
  checkOut: string;
  rooms: number;
  guests: number;
  payAtProperty: boolean;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export async function requestStayBooking(r: StayRequest): Promise<{ id: string; reference: string; total_npr: number; nights: number }> {
  if (!supabase) throw new Error('Booking needs an internet connection.');
  const { data, error } = await supabase.rpc('request_stay_booking', {
    room: r.roomId, check_in: r.checkIn, check_out: r.checkOut, rooms: r.rooms, guests: r.guests, pay_at_property: r.payAtProperty,
    guest_name: r.name, guest_email: r.email, guest_phone: r.phone || null, notes: r.notes || null,
  });
  if (error) throw new Error(friendly(error.message));
  return data as { id: string; reference: string; total_npr: number; nights: number };
}

/* ---------- partner ---------- */

export interface PartnerBooking {
  id: string;
  reference: string;
  status: string;
  partner_status: 'pending' | 'accepted' | 'declined';
  partner_deadline: string | null;
  created_at: string;
  start_date: string;
  end_date: string;
  nights: number;
  rooms_count: number;
  guests: number;
  room_name: string | null;
  total_npr: number;
  commission_npr: number;
  pay_at_property: boolean;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  partner_note: string | null;
}

export async function fetchPartnerBookings(): Promise<PartnerBooking[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('partner_bookings');
  if (error) throw new Error(friendly(error.message));
  return (data as PartnerBooking[]) ?? [];
}

export async function partnerRespond(id: string, accept: boolean, note?: string): Promise<string> {
  if (!supabase) throw new Error('Needs an internet connection.');
  const { data, error } = await supabase.rpc('partner_respond', { booking: id, accept, note: note ?? null });
  if (error) throw new Error(friendly(error.message));
  return data as string;
}

export interface CalendarDay { day: string; price_npr: number; closed: boolean; booked: number; units: number; special: boolean }

export async function fetchRoomCalendar(roomId: string, from: string, to: string): Promise<CalendarDay[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('room_calendar_view', { room: roomId, from_day: from, to_day: to });
  if (error) throw new Error(friendly(error.message));
  return (data as CalendarDay[]) ?? [];
}

export async function setRoomDays(roomId: string, days: string[], change: { closed?: boolean; price?: number; resetPrice?: boolean }): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('set_room_days', {
    room: roomId, days, set_closed: change.closed ?? null, set_price: change.price ?? null, reset_price: !!change.resetPrice,
  });
  if (error) throw new Error(friendly(error.message));
}

/** "1h 25m left" / "overdue" for a partner's 2-hour answer window. */
export function timeLeft(deadline: string | null): string {
  if (!deadline) return '';
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return 'Answer overdue';
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m left to answer` : `${m} min left to answer`;
}
