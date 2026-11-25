// delete-account — lets a signed-in user permanently delete their account from inside the app
// (required by the App Store for apps that offer sign-up).
//
// POST with the user's access token in `Authorization: Bearer <token>` → 200 { ok: true }
// Deleting the auth user cascades to profiles and saved_trips; stories and enquiries are kept
// but unlinked (user_id set to null).
import '@supabase/functions-js/edge-runtime.d.ts';
import { adminClient, cors, json, userFromRequest } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405);

  const admin = adminClient();
  const user = await userFromRequest(req, admin);
  if (!user) return json({ error: 'Please sign in again, then retry.' }, 401);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('delete user failed', error);
    return json({ error: 'Could not delete the account. Please try again.' }, 500);
  }
  return json({ ok: true });
});
