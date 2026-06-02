import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface ProfilePrefs {
  pinnedInsights?: string[];
  seenBadges?: string[];
  insightOrder?: string[];
}

export interface RemoteProfile {
  preferredName: string;
  handle: string | null;
  bio: string;
  phoneNumber: string;
  avatarUrl: string | null;
  goal: string;
  lang: string;
  prefs: ProfilePrefs;
  createdAt: string;
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
    avatarUrl: r.avatar_url,
    goal: r.goal ?? '',
    lang: r.lang,
    prefs,
    createdAt: r.created_at,
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

// Fields that may be written. Only provided keys are upserted, so a settings-only
// push doesn't clobber profile fields a newer device may have set, and vice versa.
export interface ProfilePatch {
  preferredName?: string;
  handle?: string | null;
  bio?: string;
  phoneNumber?: string;
  avatarUrl?: string | null;
  email?: string | null;
  goal?: string;
  lang?: string;
  prefs?: ProfilePrefs;
}

export async function upsertProfile(userId: string, patch: ProfilePatch): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const row: Record<string, unknown> = { id: userId };
  if ('preferredName' in patch) row.preferred_name = patch.preferredName || null;
  if ('handle' in patch) row.handle = patch.handle || null;
  if ('bio' in patch) row.bio = patch.bio || null;
  if ('phoneNumber' in patch) row.phone_number = patch.phoneNumber || null;
  if ('avatarUrl' in patch) row.avatar_url = patch.avatarUrl || null;
  if ('email' in patch) row.email = patch.email || null;
  if ('goal' in patch) row.goal = patch.goal || null;
  if ('lang' in patch) row.lang = patch.lang;
  if ('prefs' in patch) row.prefs = patch.prefs;
  const { error } = await supabase.from('profiles').upsert(row as never);
  if (error) throw error;
}
