// Email via Resend (https://resend.com). If RESEND_API_KEY is not set, nothing is sent and
// sendEmail() returns false — the request is still stored in the database.

export const TEAM_EMAIL = Deno.env.get('ENQUIRY_TO_EMAIL') ?? 'info@mountainplanetnepal.com';
const FROM = Deno.env.get('ENQUIRY_FROM_EMAIL') ?? 'Mountain Planet App <onboarding@resend.dev>';

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Simple two-column table of label/value rows. Values are escaped. */
export const table = (rows: [string, string][]) =>
  `<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows
    .map(([k, v]) => `<tr><td style="color:#8F8D84;vertical-align:top"><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, '<br>')}</td></tr>`)
    .join('')}</table>`;

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!res.ok) console.error('resend failed', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error('resend error', e);
    return false;
  }
}
