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
