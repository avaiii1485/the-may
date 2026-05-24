import { useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { triggerSync } from '@/lib/sync';
import { LOCAL_USER_ID, useAuthStore } from '@/stores/authStore';

// Establishes the user identity. With Supabase configured, signs in anonymously
// on first launch (enable "Anonymous sign-ins" in the Supabase dashboard) and
// keeps authStore in sync with the session. Without Supabase, the app stays on
// the LOCAL_USER_ID fallback and everything works offline.
export function useAuthSession(): void {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(LOCAL_USER_ID, null);
      return;
    }
    const client = supabase;
    let active = true;

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setUser(session.user.id, session.user.email ?? null);
        triggerSync();
      } else {
        setUser(LOCAL_USER_ID, null);
      }
    });

    void (async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (!data.session) {
        const { error } = await client.auth.signInAnonymously();
        if (error) console.warn('[auth] anonymous sign-in failed:', error.message);
      }
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setUser]);
}
