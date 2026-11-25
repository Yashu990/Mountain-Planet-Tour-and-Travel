import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { backendEnabled, supabase } from './supabase';

/**
 * Finish sign-in from an email link (confirm sign-up or reset password).
 * Handles both link styles Supabase can send: tokens in the #fragment, or a PKCE ?code=.
 * Returns 'recovery' for a password-reset link.
 */
export async function completeAuthFromUrl(url: string): Promise<'signed-in' | 'recovery'> {
  if (!supabase) throw new Error('Accounts are not set up yet.');
  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const query = url.includes('?') ? url.slice(url.indexOf('?') + 1).split('#')[0] : '';
  const p = new URLSearchParams(hash || query);
  const q = new URLSearchParams(query);
  const err = p.get('error_description') || q.get('error_description');
  if (err) throw new Error(err.replace(/\+/g, ' '));
  const code = q.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw new Error('This link has expired. Please request a new one.');
  } else {
    const access_token = p.get('access_token');
    const refresh_token = p.get('refresh_token');
    if (!access_token || !refresh_token) throw new Error('This link is incomplete. Please request a new one.');
    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) throw new Error('This link has expired. Please request a new one.');
  }
  return (p.get('type') || q.get('type')) === 'recovery' ? 'recovery' : 'signed-in';
}

interface AuthCtx {
  enabled: boolean;
  ready: boolean;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Returns 'signed-in' or 'check-email' when the project requires email confirmation. */
  signUp: (email: string, password: string, fullName: string) => Promise<'signed-in' | 'check-email'>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  /** Google / Apple via Supabase OAuth in the system browser. */
  signInWithProvider: (provider: 'google' | 'apple') => Promise<'signed-in' | 'cancelled'>;
  /** Phone OTP: send a code by SMS, then verify it. */
  sendPhoneCode: (phone: string) => Promise<void>;
  verifyPhoneCode: (phone: string, code: string) => Promise<void>;
  profile: Profile | null;
  isAdmin: boolean;
  saveProfile: (p: Partial<Pick<Profile, 'full_name' | 'country' | 'phone' | 'nationality' | 'currency' | 'avatar_url'>>) => Promise<void>;
}

export interface Profile {
  id: string;
  full_name: string | null;
  country: string | null;
  phone: string | null;
  nationality: string | null;
  currency: string;
  role: 'customer' | 'admin';
  avatar_url: string | null;
}

const Ctx = createContext<AuthCtx | null>(null);

const friendly = (msg: string) => {
  if (/invalid login credentials/i.test(msg)) return 'That email and password don’t match. Try again or reset your password.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first — check your inbox for our link.';
  if (/already registered|already been registered/i.test(msg)) return 'An account with this email already exists. Sign in instead.';
  if (/password should be at least/i.test(msg)) return 'Use a password with at least 6 characters.';
  if (/network|fetch/i.test(msg)) return 'No connection. Check your internet and try again.';
  return msg;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!backendEnabled);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  // Load the profile (name, phone, currency, staff role) for the signed-in user.
  const [profile, setProfile] = useState<Profile | null>(null);
  const uid = session?.user?.id;
  useEffect(() => {
    if (!supabase || !uid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing on sign-out
      setProfile(null);
      return;
    }
    let alive = true;
    supabase
      .from('profiles')
      .select('id, full_name, country, phone, nationality, currency, role, avatar_url')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (alive && data) setProfile(data as Profile);
      });
    return () => {
      alive = false;
    };
  }, [uid]);

  const need = () => {
    if (!supabase) throw new Error('Accounts are not set up yet.');
    return supabase;
  };

  const value: AuthCtx = {
    enabled: backendEnabled,
    ready,
    user: session?.user ?? null,
    session,
    async signIn(email, password) {
      const { error } = await need().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(friendly(error.message));
    },
    async signUp(email, password, fullName) {
      const { data, error } = await need().auth.signUp({
        email: email.trim(),
        password,
        // The confirmation link opens the app and signs the user in (see app/auth/callback.tsx).
        options: { data: { full_name: fullName.trim() }, emailRedirectTo: Linking.createURL('auth/callback') },
      });
      if (error) throw new Error(friendly(error.message));
      return data.session ? 'signed-in' : 'check-email';
    },
    async signOut() {
      await need().auth.signOut();
    },
    async resetPassword(email) {
      const { error } = await need().auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL('auth/callback') });
      if (error) throw new Error(friendly(error.message));
    },
    async updatePassword(password) {
      const { error } = await need().auth.updateUser({ password });
      if (error) throw new Error(friendly(error.message));
    },
    async deleteAccount() {
      const sb = need();
      const { error } = await sb.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw new Error('Could not delete your account. Please try again.');
      await sb.auth.signOut();
    },
    async signInWithProvider(provider) {
      const sb = need();
      const redirectTo = Linking.createURL('auth/callback');
      const { data, error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
      if (error || !data?.url) throw new Error(friendly(error?.message ?? `${provider === 'google' ? 'Google' : 'Apple'} sign-in is not set up yet.`));
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type !== 'success') return 'cancelled';
      await completeAuthFromUrl(res.url);
      return 'signed-in';
    },
    async sendPhoneCode(phone) {
      const p = phone.replace(/[^\d+]/g, '');
      if (!/^\+\d{8,15}$/.test(p)) throw new Error('Enter your number with country code, e.g. +977 98XXXXXXXX.');
      const { error } = await need().auth.signInWithOtp({ phone: p });
      if (error) throw new Error(/sms|provider|phone/i.test(error.message) ? 'Phone sign-in is not switched on yet. Please use email or Google.' : friendly(error.message));
    },
    async verifyPhoneCode(phone, code) {
      const { error } = await need().auth.verifyOtp({ phone: phone.replace(/[^\d+]/g, ''), token: code.trim(), type: 'sms' });
      if (error) throw new Error(/expired|invalid/i.test(error.message) ? 'That code is wrong or expired. Request a new one.' : friendly(error.message));
    },
    profile,
    isAdmin: profile?.role === 'admin',
    async saveProfile(p) {
      const sb = need();
      if (!uid) throw new Error('Please sign in.');
      const { data, error } = await sb.from('profiles').update(p).eq('id', uid).select('id, full_name, country, phone, nationality, currency, role, avatar_url').single();
      if (error) throw new Error('Could not save your profile. Please try again.');
      setProfile(data as Profile);
      if (p.full_name !== undefined) await sb.auth.updateUser({ data: { full_name: p.full_name } });
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('AuthProvider missing');
  return c;
}
