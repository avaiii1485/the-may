import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const BUCKET = 'meal-photos';

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return res.blob();
}

export async function uploadMealPhoto(userId: string, localUri: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) {
    // No backend configured: keep the local URI as the photo source.
    return localUri;
  }
  const blob = await uriToBlob(localUri);
  // Derive the extension from the blob's MIME type. Parsing it out of the URI
  // breaks for web `data:` URIs (no real filename), which produced an invalid,
  // enormous storage key and a failed upload.
  const mime = blob.type || 'image/jpeg';
  const ext = mime.split('/')[1]?.split('+')[0] || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: mime,
    upsert: false,
  });
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  if (signErr) throw signErr;
  return signed?.signedUrl ?? null;
}
