import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface ProfilePrefs {
  pinnedInsights?: string[];
  seenBadges?: string[];
}

export interface RemoteProfile {
  preferredName: string;
  handle: string | null;
  bio: string;
  phoneNumber: string;
  goal: string;
  lang: string;
  prefs: ProfilePrefs;
}

function rowToProfile(r: ProfileRow): RemoteProfile {
  const prefs = (r.prefs && typeof r.prefs === 'object' && !Array.isArray(r.prefs)
    ? r.prefs
    : {}) as ProfilePrefs;
  return {
    preferredName: r.preferred_name ?? '',
    handle: r.handle,
    bio: r.bio ?? '',
    phoneNumber: r.phone_number ?? '',
    goal: r.goal ?? '',
    lang: r.lang,
    prefs,
  };
}

export async function getProfile(userId: string): Promise<RemoteProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToProfile(data) : null;
}

// Avatar is intentionally not synced yet — it can be a large base64 data: URI on
// web, which doesn't belong in a table row. Wire an 'avatars' Storage upload first.
export async function upsertProfile(userId: string, p: RemoteProfile): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  // `as never`: see the note in services/meals.ts on the typed-client null issue.
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    preferred_name: p.preferredName || null,
    handle: p.handle || null,
    bio: p.bio || null,
    phone_number: p.phoneNumber || null,
    goal: p.goal || null,
    lang: p.lang,
    prefs: p.prefs,
  } as never);
  if (error) throw error;
}
