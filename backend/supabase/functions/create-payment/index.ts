// create-payment — starts paying a booking whose price the customer accepted.
//
// POST { bookingId, provider: 'khalti' | 'stripe', appReturnUrl }  (signed-in owner of the booking)
//   → { url }  open it in the browser; when payment finishes, payment-return verifies it and
//              redirects back to appReturnUrl?status=paid|failed
//
// Secrets:
//   KHALTI_SECRET_KEY          from Khalti merchant dashboard (test keys work with KHALTI_BASE below)
//   KHALTI_BASE                default https://dev.khalti.com/api/v2 (sandbox); live: https://khalti.com/api/v2
//   KHALTI_USD_TO_NPR          exchange rate you charge at, e.g. 133.5 (required for Khalti)
//   STRIPE_SECRET_KEY          sk_test_… / sk_live_…
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, cors, json, userFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);
  const admin = adminClient();
  const user = await userFromRequest(req, admin);
  if (!user) return json({ error: 'Please sign in to pay.' }, 401);

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'Send JSON.' }, 400);
  }
  const provider = b.provider === 'khalti' || b.provider === 'stripe' ? b.provider : null;
  const appReturn = typeof b.appReturnUrl === 'string' && /^(mountainplanet|exp|exps):\/\//.test(b.appReturnUrl) ? b.appReturnUrl : 'mountainplanet://bookings';
  if (!provider) return json({ error: 'Choose a payment method.' }, 400);

  const { data: bk } = await admin.from('bookings').select('*').eq('id', String(b.bookingId ?? '')).maybeSingle();
  if (!bk || bk.user_id !== user.id) return json({ error: 'Booking not found.' }, 404);
  if (!['quoted', 'accepted'].includes(bk.status) || bk.quote_usd == null) return json({ error: 'This booking is not ready for payment yet.' }, 400);

  const fnBase = `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-return`;
  const back = (p: string) => `${fnBase}?provider=${p}&b=${bk.id}&app=${encodeURIComponent(appReturn)}`;

  if (provider === 'khalti') {
    const key = Deno.env.get('KHALTI_SECRET_KEY');
    const rate = Number(Deno.env.get('KHALTI_USD_TO_NPR'));
    if (!key || !rate) return json({ error: 'Khalti is not set up yet. Please choose card or contact us.' }, 503);
    const base = Deno.env.get('KHALTI_BASE') ?? 'https://dev.khalti.com/api/v2';
    const amountPaisa = Math.round(bk.quote_usd * rate * 100);
    const res = await fetch(`${base}/epayment/initiate/`, {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        return_url: back('khalti'),
        website_url: 'https://mountainplanetnepal.com',
        amount: amountPaisa,
        purchase_order_id: bk.reference,
        purchase_order_name: `Mountain Planet ${bk.reference}`,
        customer_info: { name: bk.name, email: bk.email, ...(bk.phone ? { phone: bk.phone } : {}) },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.payment_url) {
      console.error('khalti initiate failed', res.status, data);
      return json({ error: 'Could not start Khalti payment. Please try again.' }, 502);
    }
    await admin.from('bookings').update({ status: 'accepted', payment_provider: 'khalti', payment_ref: data.pidx }).eq('id', bk.id);
    return json({ url: data.payment_url });
  }

  const sk = Deno.env.get('STRIPE_SECRET_KEY');
  if (!sk) return json({ error: 'Card payments are not set up yet. Please contact us.' }, 503);
  const form = new URLSearchParams({
    mode: 'payment',
    success_url: `${back('stripe')}&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${back('stripe')}&cancelled=1`,
    customer_email: bk.email,
    client_reference_id: bk.reference,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(Math.round(bk.quote_usd * 100)),
    'line_items[0][price_data][product_data][name]': `Mountain Planet booking ${bk.reference}`,
    'metadata[booking_id]': bk.id,
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sk}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    console.error('stripe session failed', res.status, data);
    return json({ error: 'Could not start card payment. Please try again.' }, 502);
  }
  await admin.from('bookings').update({ status: 'accepted', payment_provider: 'stripe', payment_ref: data.id }).eq('id', bk.id);
  return json({ url: data.url });
});
