// Push notifications through Expo's push service (works with the tokens the app registers).
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function pushToUser(admin: SupabaseClient, userId: string | null, title: string, body: string, data: Record<string, string> = {}) {
  if (!userId) return 0;
  const { data: rows } = await admin.from('push_tokens').select('token').eq('user_id', userId);
  const tokens = (rows ?? []).map((r) => r.token as string).filter((t) => t.startsWith('ExponentPushToken'));
  if (!tokens.length) return 0;
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(tokens.map((to) => ({ to, title, body, data, sound: 'default' }))),
    });
    if (!res.ok) console.error('expo push failed', res.status, await res.text());
    return res.ok ? tokens.length : 0;
  } catch (e) {
    console.error('expo push error', e);
    return 0;
  }
}
