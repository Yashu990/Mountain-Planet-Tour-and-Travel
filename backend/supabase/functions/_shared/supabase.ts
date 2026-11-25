// Shared helpers for Mountain Planet Edge Functions.
// Uses plain supabase-js so it works with both legacy (anon / service_role JWT) and
// new (sb_publishable_ / sb_secret_) API keys.
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
    const k = keys.default ?? Object.values(keys)[0];
    if (k) return k;
  } catch {
    /* fall through */
  }
  throw new Error('No service key available in the function environment.');
}

/** Admin client — bypasses RLS. Only use after validating the request. */
export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL')!, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Returns the signed-in user for the request's bearer token, or null. */
export async function userFromRequest(req: Request, admin: SupabaseClient) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}
