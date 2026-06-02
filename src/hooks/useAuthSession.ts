import { useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { triggerSync } from '@/lib/sync';
import { LOCAL_USER_ID, useAuthStore } from '@/stores/authStore';
import { useAuthPromptStore } from '@/stores/authPromptStore';

// Keeps authStore in sync with the Supabase session. It does NOT auto-create
// anonymous accounts (that piled up junk users on every reload-while-signed-out).
// A fresh visitor or a logged-out user has no session → the /auth screen invites
// them to sign in or "Skip for now"; only that explicit skip creates an anonymous
// account. The one exception: a returning anonymous explorer (they previously
// skipped) whose session was lost — we restore an anonymous session for them.
export function useAuthSession(): void {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(LOCAL_USER_ID, null, false);
      useAuthStore.getState().setInitialized(true);
      return;
    }
    const client = supabase;
    let active = true;

    const { data: sub } = client.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') {
        useAuthStore.getState().setRecovery(true);
      }
      if (session?.user) {
        setUser(session.user.id, session.user.email ?? null, session.user.is_anonymous ?? false);
        triggerSync();
      } else {
        setUser(LOCAL_USER_ID, null, false);
      }
    });

    void (async () => {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (data.session?.user) {
        // Set identity straight from the restored session so the gate doesn't
        // flash before onAuthStateChange fires.
        const u = data.session.user;
        setUser(u.id, u.email ?? null, u.is_anonymous ?? false);
      } else if (useAuthPromptStore.getState().dismissed) {
        const { error } = await client.auth.signInAnonymously();
        if (error) console.warn('[auth] anonymous restore failed:', error.message);
      }
      if (active) useAuthStore.getState().setInitialized(true);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [setUser]);
}
