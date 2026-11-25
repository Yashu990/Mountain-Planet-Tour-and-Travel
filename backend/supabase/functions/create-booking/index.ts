// create-booking — saves a hotel / homestay / cab / flight / ticket booking request, emails the team,
// and sends the customer a confirmation with their reference.
//
// POST {
//   kind: 'hotel'|'homestay'|'cab'|'flight'|'ticket', name, email, phone?,
//   startDate: 'YYYY-MM-DD', endDate?: 'YYYY-MM-DD', startTime?: 'HH:MM',
//   location?, destination?, guests?: number, details?: object, notes?, staySlug?, website? (honeypot)
// }
//   → 200 { ok: true, id, reference, emailed }   |   400 / 429 { error }
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, cors, json, userFromRequest } from '../_shared/supabase.ts';
import { TEAM_EMAIL, sendEmail, table } from '../_shared/email.ts';

const KINDS = { hotel: 'Hotel', homestay: 'Homestay', cab: 'Cab / vehicle', flight: 'Domestic flight', ticket: 'Activity ticket' } as const;
type Kind = keyof typeof KINDS;
const PREFIX: Record<Kind, string> = { hotel: 'H', homestay: 'S', cab: 'C', flight: 'F', ticket: 'T' };
const MAX_PER_HOUR = 8;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
const ref = (k: Kind) => {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const r = crypto.getRandomValues(new Uint8Array(5));
  for (const b of r) s += a[b % a.length];
  return `MP-${PREFIX[k]}-${s}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Send the booking as JSON.' }, 400);
  }
  if (str(b.website, 200)) return json({ ok: true, id: null, reference: null, emailed: false });

  const kind = str(b.kind, 20) as Kind;
  if (!(kind in KINDS)) return json({ error: 'Unknown booking type.' }, 400);
  const name = str(b.name, 80);
  const email = str(b.email, 200).toLowerCase();
  const phone = str(b.phone, 30);
  if (!name) return json({ error: 'Please add your name.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Please add a valid email so we can confirm.' }, 400);

  const startDate = str(b.startDate, 10);
  const endDate = str(b.endDate, 10);
  const today = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10); // allow for time zones
  if (!isDay(startDate)) return json({ error: 'Please choose a date.' }, 400);
  if (startDate < today) return json({ error: 'That date has already passed.' }, 400);
  if (endDate && (!isDay(endDate) || endDate < startDate)) return json({ error: 'The end date must be after the start date.' }, 400);
  if ((kind === 'hotel' || kind === 'homestay') && !endDate) return json({ error: 'Please choose a check-out date.' }, 400);
  const startTime = str(b.startTime, 5);
  if (startTime && !/^\d{2}:\d{2}$/.test(startTime)) return json({ error: 'Please choose a valid time.' }, 400);
  const location = str(b.location, 120);
  const destination = str(b.destination, 120);
  if (kind === 'cab' && (!location || !destination)) return json({ error: 'Please add pickup and drop-off.' }, 400);
  if (kind === 'flight' && (!location || !destination || location === destination)) return json({ error: 'Please choose where you fly from and to.' }, 400);
  const guests = Math.min(60, Math.max(1, Math.round(Number(b.guests) || 1)));

  // details: flat object of short strings / numbers / booleans only
  const details: Record<string, string | number | boolean> = {};
  if (b.details && typeof b.details === 'object' && !Array.isArray(b.details)) {
    for (const [k, v] of Object.entries(b.details as Record<string, unknown>).slice(0, 20)) {
      if (typeof v === 'string') details[k.slice(0, 40)] = v.slice(0, 200);
      else if (typeof v === 'number' && Number.isFinite(v)) details[k.slice(0, 40)] = v;
      else if (typeof v === 'boolean') details[k.slice(0, 40)] = v;
    }
  }

  const admin = adminClient();

  const since = new Date(Date.now() - 3600 * 1000).toISOString();
  const { count } = await admin.from('bookings').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', since);
  if ((count ?? 0) >= MAX_PER_HOUR) return json({ error: 'We already have several requests from you this hour — our team will be in touch soon.' }, 429);

  let staySlug: string | null = null;
  let stayName = '';
  if ((kind === 'hotel' || kind === 'homestay') && str(b.staySlug, 80)) {
    const { data } = await admin.from('stays').select('slug, name').eq('slug', str(b.staySlug, 80)).maybeSingle();
    if (data) {
      staySlug = data.slug;
      stayName = data.name;
    }
  }

  // Optional promo code: must exist, be active and not expired.
  let promo: string | null = null;
  const code = str(b.promoCode, 30).toUpperCase();
  if (code) {
    const { data: pc } = await admin.from('promo_codes').select('code, percent_off, active, expires_on').eq('code', code).maybeSingle();
    if (!pc || !pc.active || (pc.expires_on && pc.expires_on < today)) return json({ error: 'That promo code is not valid.' }, 400);
    promo = pc.code;
    details.promo = `${pc.code} (−${pc.percent_off}%)`;
  }

  const user = await userFromRequest(req, admin);
  const row = {
    promo_code: promo,
    user_id: user?.id ?? null,
    kind,
    name,
    email,
    phone: phone || null,
    start_date: startDate,
    end_date: endDate || null,
    start_time: startTime || null,
    location: location || null,
    destination: destination || null,
    guests,
    details,
    notes: str(b.notes, 2000) || null,
    stay_slug: staySlug,
  };

  let saved: { id: string; reference: string } | null = null;
  for (let attempt = 0; attempt < 4 && !saved; attempt++) {
    const { data, error } = await admin.from('bookings').insert({ ...row, reference: ref(kind) }).select('id, reference').single();
    if (!error) saved = data;
    else if (error.code !== '23505') {
      console.error('insert booking failed', error);
      return json({ error: 'Could not save your booking. Please try again.' }, 500);
    }
  }
  if (!saved) return json({ error: 'Could not save your booking. Please try again.' }, 500);

  const when = endDate ? `${startDate} → ${endDate}` : startDate + (startTime ? ` at ${startTime}` : '');
  const rows: [string, string][] = [
    ['Reference', saved.reference],
    ['Type', KINDS[kind]],
    ...(stayName ? ([['Stay', stayName]] as [string, string][]) : []),
    ['Dates', when],
    ...(location ? ([[kind === 'cab' ? 'Pickup' : kind === 'flight' ? 'From' : 'Where', location]] as [string, string][]) : []),
    ...(destination ? ([[kind === 'cab' ? 'Drop-off' : 'To', destination]] as [string, string][]) : []),
    ['Guests', String(guests)],
    ...Object.entries(details).map(([k, v]) => [k, String(v)] as [string, string]),
    ['Name', name],
    ['Email', email],
    ['Phone', phone || '—'],
    ...(row.notes ? ([['Notes', row.notes]] as [string, string][]) : []),
  ];

  const teamOk = await sendEmail(TEAM_EMAIL, `New ${KINDS[kind].toLowerCase()} booking ${saved.reference} — ${name}`, `<h2>New booking request</h2>${table(rows)}<p style="color:#888">Update status and quote in Supabase → Table Editor → bookings.</p>`, email);
  await sendEmail(
    email,
    `We received your booking request ${saved.reference}`,
    `<p>Namaste ${name.split(' ')[0]},</p><p>Thank you for booking with Mountain Planet Nepal. Our Kathmandu team is checking availability and will confirm the price within 24 hours.</p>${table(rows.filter(([k]) => !['Name', 'Email', 'Phone'].includes(k)))}<p>Reply to this email if anything changes.</p><p>— Mountain Planet Nepal</p>`,
    TEAM_EMAIL,
  );
  if (teamOk) await admin.from('bookings').update({ emailed: true }).eq('id', saved.id);

  return json({ ok: true, id: saved.id, reference: saved.reference, emailed: teamOk });
});
