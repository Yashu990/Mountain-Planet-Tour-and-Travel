// admin-update-booking — staff set a price, status or note on a booking from the in-app admin panel.
// The customer gets an email and a push notification when the price is sent or the booking is confirmed.
//
// POST { id, quoteUsd?, status?, teamNote? }   (caller must be signed in with role = 'admin')
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, cors, json, userFromRequest } from '../_shared/supabase.ts';
import { sendEmail, table } from '../_shared/email.ts';
import { pushToUser } from '../_shared/push.ts';

const STATUSES = ['requested', 'quoted', 'accepted', 'paid', 'confirmed', 'cancelled', 'completed'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const admin = adminClient();
  const user = await userFromRequest(req, admin);
  if (!user) return json({ error: 'Please sign in.' }, 401);
  const { data: me } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (me?.role !== 'admin') return json({ error: 'Staff only.' }, 403);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Send JSON.' }, 400);
  }
  const id = typeof b.id === 'string' ? b.id : '';
  const patch: Record<string, unknown> = {};
  if (b.quoteUsd !== undefined) {
    const q = Math.round(Number(b.quoteUsd));
    if (!Number.isFinite(q) || q < 0) return json({ error: 'Price must be a positive number.' }, 400);
    patch.quote_usd = q;
  }
  if (b.status !== undefined) {
    if (typeof b.status !== 'string' || !STATUSES.includes(b.status)) return json({ error: 'Unknown status.' }, 400);
    patch.status = b.status;
  }
  if (b.teamNote !== undefined) patch.team_note = typeof b.teamNote === 'string' ? b.teamNote.slice(0, 2000) || null : null;
  if (patch.quote_usd !== undefined && patch.status === undefined) patch.status = 'quoted';
  if (!id || !Object.keys(patch).length) return json({ error: 'Nothing to update.' }, 400);

  const { data: bk, error } = await admin.from('bookings').update(patch).eq('id', id).select('*').single();
  if (error || !bk) return json({ error: 'Could not update the booking.' }, 500);

  // Tell the customer.
  let msg: { title: string; body: string } | null = null;
  if (patch.status === 'quoted' && bk.quote_usd != null) msg = { title: `Your price is ready · ${bk.reference}`, body: `$${bk.quote_usd} — open the app to accept and pay.` };
  if (patch.status === 'confirmed') msg = { title: `Booking confirmed · ${bk.reference}`, body: 'See you in Nepal! Details are in My bookings.' };
  if (patch.status === 'cancelled') msg = { title: `Booking cancelled · ${bk.reference}`, body: bk.team_note ?? 'Contact us if you have questions.' };
  if (msg) {
    await pushToUser(admin, bk.user_id, msg.title, msg.body, { url: '/bookings' });
    await sendEmail(
      bk.email,
      msg.title,
      `<p>Namaste ${String(bk.name).split(' ')[0]},</p><p>${msg.body}</p>${table([
        ['Reference', bk.reference],
        ['Dates', bk.end_date ? `${bk.start_date} → ${bk.end_date}` : bk.start_date],
        ...(bk.quote_usd != null ? ([['Price', `$${bk.quote_usd}`]] as [string, string][]) : []),
        ...(bk.team_note ? ([['Note from our team', bk.team_note]] as [string, string][]) : []),
      ])}<p>— Mountain Planet Nepal</p>`,
    );
  }
  return json({ ok: true, booking: bk });
});
