// payment-return — Khalti / Stripe send the customer here after paying. We verify the payment
// with the provider (never trusting the URL alone), mark the booking paid, notify everyone,
// and redirect back into the app.
//
// GET ?provider=khalti|stripe&b=<booking id>&app=<app url>[&pidx=…][&session=…][&cancelled=1]
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient } from '../_shared/supabase.ts';
import { TEAM_EMAIL, sendEmail, table } from '../_shared/email.ts';
import { pushToUser } from '../_shared/push.ts';

const redirect = (app: string, status: string) => {
  const sep = app.includes('?') ? '&' : '?';
  return new Response(null, { status: 302, headers: { Location: `${app}${sep}status=${status}` } });
};

Deno.serve(async (req) => {
  const u = new URL(req.url);
  const app = /^(mountainplanet|exp|exps):\/\//.test(u.searchParams.get('app') ?? '') ? u.searchParams.get('app')! : 'mountainplanet://bookings';
  const provider = u.searchParams.get('provider');
  const id = u.searchParams.get('b') ?? '';
  if (u.searchParams.get('cancelled')) return redirect(app, 'cancelled');

  const admin = adminClient();
  const { data: bk } = await admin.from('bookings').select('*').eq('id', id).maybeSingle();
  if (!bk || !bk.payment_ref) return redirect(app, 'failed');
  if (bk.status === 'paid' || bk.status === 'confirmed') return redirect(app, 'paid');

  let paid = false;
  let amount: number | null = null;
  let currency = '';
  try {
    if (provider === 'khalti') {
      const pidx = u.searchParams.get('pidx');
      if (!pidx || pidx !== bk.payment_ref) return redirect(app, 'failed');
      const base = Deno.env.get('KHALTI_BASE') ?? 'https://dev.khalti.com/api/v2';
      const res = await fetch(`${base}/epayment/lookup/`, {
        method: 'POST',
        headers: { Authorization: `Key ${Deno.env.get('KHALTI_SECRET_KEY')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pidx }),
      });
      const d = await res.json();
      paid = d.status === 'Completed';
      amount = typeof d.total_amount === 'number' ? d.total_amount / 100 : null;
      currency = 'NPR';
    } else if (provider === 'stripe') {
      const session = u.searchParams.get('session');
      if (!session || session !== bk.payment_ref) return redirect(app, 'failed');
      const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session)}`, {
        headers: { Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}` },
      });
      const d = await res.json();
      paid = d.payment_status === 'paid';
      amount = typeof d.amount_total === 'number' ? d.amount_total / 100 : null;
      currency = 'USD';
    }
  } catch (e) {
    console.error('verify payment failed', e);
  }
  if (!paid) return redirect(app, 'failed');

  await admin.from('bookings').update({ status: 'paid', paid_at: new Date().toISOString(), amount_paid: amount, amount_currency: currency }).eq('id', bk.id);
  const rows: [string, string][] = [
    ['Reference', bk.reference],
    ['Paid', `${amount ?? bk.quote_usd} ${currency}`],
    ['Method', provider ?? ''],
  ];
  await pushToUser(admin, bk.user_id, `Payment received · ${bk.reference}`, 'Thank you! Our team will confirm your booking shortly.', { url: '/bookings' });
  await sendEmail(bk.email, `Payment received · ${bk.reference}`, `<p>Namaste ${String(bk.name).split(' ')[0]},</p><p>We received your payment.</p>${table(rows)}<p>— Mountain Planet Nepal</p>`);
  await sendEmail(TEAM_EMAIL, `PAID ${bk.reference} — ${bk.name}`, `<h2>Booking paid</h2>${table(rows)}<p>Confirm it in the app's admin panel.</p>`);
  return redirect(app, 'paid');
});
