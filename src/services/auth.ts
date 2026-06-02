import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { recordAuthEvent } from '@/services/loginEvents';

export interface AuthedUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

function toAuthed(u: { id: string; email?: string | null; is_anonymous?: boolean } | null): AuthedUser | null {
  return u ? { id: u.id, email: u.email ?? null, isAnonymous: u.is_anonymous ?? false } : null;
}

// Returns the signed-in user so callers can update auth state synchronously,
// rather than waiting on the async onAuthStateChange listener (that lag caused
// the login screen to bounce back on the first attempt).
//
// Email+password auth. Sign-up converts the current anonymous user in place
// (same user id) so the meals they already logged are kept; if somehow not
// anonymous, it falls back to a fresh sign-up.
export async function signUp(email: string, password: string): Promise<AuthedUser | null> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: sess } = await supabase.auth.getSession();
  if (sess.session?.user?.is_anonymous) {
    const { data, error } = await supabase.auth.updateUser({ email, password });
    if (error) throw error;
    void recordAuthEvent('sign_up');
    return toAuthed(data.user);
  }
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  void recordAuthEvent('sign_up');
  return toAuthed(data.user);
}

export async function signIn(email: string, password: string): Promise<AuthedUser | null> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  void recordAuthEvent('sign_in');
  return toAuthed(data.user);
}

// Google OAuth. Web redirects the page and the session is picked up on return;
// native opens an in-app browser and exchanges the returned code for a session.
// Requires the Google provider to be enabled in the Supabase dashboard.
export async function signInWithGoogle(): Promise<AuthedUser | null> {
  if (!supabase) throw new Error('Supabase not configured');

  if (Platform.OS === 'web') {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    return null; // page redirects; session is restored on return
  }

  const redirectTo = Linking.createURL('auth-callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No OAuth URL');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) throw new Error('cancelled');

  const code = Linking.parse(result.url).queryParams?.code;
  if (typeof code !== 'string') throw new Error('No auth code');
  const { data: ex, error: exErr } = await supabase.auth.exchangeCodeForSession(code);
  if (exErr) throw exErr;
  void recordAuthEvent('sign_in');
  return toAuthed(ex.user ?? null);
}

// Sends a password-reset email. The link returns to the app where the user can
// set a new password (PASSWORD_RECOVERY handling shows the reset UI).
export async function resetPassword(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const redirectTo =
    Platform.OS === 'web'
      ? typeof window !== 'undefined'
        ? window.location.origin
        : undefined
      : Linking.createURL('reset');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

// Sets a new password for the currently-authenticated (recovery) session.
export async function updatePassword(password: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  // 'local' scope clears the session on this device without a server round-trip,
  // which is what "log out on this device" should do and avoids global-scope
  // failures leaving the user stuck signed in.
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

// Create an anonymous account ONLY on explicit user action ("Skip for now"),
// never automatically — otherwise every reload-while-signed-out spawns a new
// junk anonymous user. No-op if a session already exists.
export async function continueAnonymously(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

// Maps an auth error to a specific i18n key so the screen can show exactly
// what went wrong instead of a generic message.
export function authErrorKey(err: unknown, mode: 'signup' | 'login'): string {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('cancelled') || msg.includes('canceled')) return 'auth.errCancelled';
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection'))
    return 'auth.errNetwork';
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials'))
    return 'auth.errInvalidCreds';
  if (msg.includes('email not confirmed')) return 'auth.errNotConfirmed';
  if (
    msg.includes('already registered') ||
    msg.includes('already been registered') ||
    msg.includes('user already exists')
  )
    return 'auth.errEmailTaken';
  if (msg.includes('unable to validate email') || msg.includes('invalid email') || msg.includes('invalid format'))
    return 'auth.errInvalidEmail';
  if (msg.includes('password should be') || msg.includes('weak password') || msg.includes('at least 6'))
    return 'auth.errWeakPassword';
  if (msg.includes('rate') || msg.includes('only request this after') || msg.includes('too many'))
    return 'auth.errRateLimit';
  if (msg.includes('provider is not enabled') || msg.includes('oauth')) return 'auth.errProvider';
  return mode === 'signup' ? 'auth.errSignupGeneric' : 'auth.errGeneric';
}
