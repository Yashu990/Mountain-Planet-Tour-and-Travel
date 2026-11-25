// submit-enquiry — saves a "Plan a trip" request and emails the Mountain Planet team.
//
// POST { name, email, country?, startDate?, travellers?, budget?, tours?: string[], message?, website? }
//   → 200 { ok: true, id, emailed }   |   400 { error }   |   429 { error }
//
// Secrets (supabase secrets set ...):
//   RESEND_API_KEY        optional — without it the enquiry is stored but not emailed
//   ENQUIRY_TO_EMAIL      where enquiries go (default info@mountainplanetnepal.com)
//   ENQUIRY_FROM_EMAIL    verified sender, e.g. "Mountain Planet <app@mountainplanetnepal.com>"
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, cors, json, userFromRequest } from '../_shared/supabase.ts';
import { TEAM_EMAIL, esc, sendEmail } from '../_shared/email.ts';

const MAX_PER_HOUR = 5;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Send the enquiry as JSON.' }, 400);
  }

  // Honeypot: real people never fill this field.
  if (str(body.website, 200)) return json({ ok: true, id: null, emailed: false });

  const name = str(body.name, 80);
  const email = str(body.email, 200).toLowerCase();
  if (!name) return json({ error: 'Please add your name.' }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: 'Please add a valid email so we can reply.' }, 400);

  const admin = adminClient();

  // Simple abuse guard: a handful of enquiries per email address per hour.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from('enquiries').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', since);
  if ((count ?? 0) >= MAX_PER_HOUR) return json({ error: 'We already have your recent requests — our team will reply soon.' }, 429);

  // Keep only tour slugs that exist.
  const wanted = Array.isArray(body.tours) ? body.tours.filter((s): s is string => typeof s === 'string').slice(0, 20) : [];
  let tourRows: { slug: string; title: string }[] = [];
  if (wanted.length) {
    const { data } = await admin.from('tours').select('slug, title').in('slug', wanted);
    tourRows = data ?? [];
  }

  const user = await userFromRequest(req, admin);
  const row = {
    user_id: user?.id ?? null,
    name,
    email,
    country: str(body.country, 60) || null,
    start_date: str(body.startDate, 60) || null,
    travellers: str(body.travellers, 20) || null,
    budget: str(body.budget, 40) || null,
    tour_slugs: tourRows.map((t) => t.slug),
    message: str(body.message, 4000) || null,
    source: 'app',
  };

  const { data: saved, error } = await admin.from('enquiries').insert(row).select('id').single();
  if (error) {
    console.error('insert enquiry failed', error);
    return json({ error: 'Could not save your request. Please try again.' }, 500);
  }

  // Email the team (optional).
  let emailed = false;
  {
    const trips = tourRows.map((t) => t.title).join(', ') || 'Custom trip';
    const fields: [string, string][] = [
      ['Name', name],
      ['Email', email],
      ['Country', row.country ?? '—'],
      ['Trips', trips],
      ['Start date', row.start_date ?? '—'],
      ['Travellers', row.travellers ?? '—'],
      ['Budget', row.budget ?? '—'],
    ];
    const html = `<h2>New trip enquiry</h2><table>${fields.map(([k, v]) => `<tr><td><b>${k}</b></td><td>${esc(v)}</td></tr>`).join('')}</table>${row.message ? `<p>${esc(row.message).replace(/\n/g, '<br>')}</p>` : ''}<p style="color:#888">Enquiry ${saved.id} · sent from the Mountain Planet app</p>`;
    emailed = await sendEmail(TEAM_EMAIL, `Trip enquiry: ${trips} — ${name}`, html, email);
    if (emailed) await admin.from('enquiries').update({ emailed: true }).eq('id', saved.id);
  }

  return json({ ok: true, id: saved.id, emailed });
});
