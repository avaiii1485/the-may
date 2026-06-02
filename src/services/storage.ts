import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const BUCKET = 'meal-photos';
const AVATAR_BUCKET = 'avatars';

const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
};

function mimeFromUri(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'image/jpeg';
}

// Reads an image URI into something the Supabase client can upload.
// On web, photos are data:/blob: URIs and fetch().blob() works. On native,
// fetch() of a file:// URI yields an empty/failed blob (a known RN limitation),
// so we read the file as base64 via expo-file-system and upload an ArrayBuffer.
async function readUpload(uri: string): Promise<{ body: Blob | ArrayBuffer; contentType: string }> {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return { body: blob, contentType: blob.type || mimeFromUri(uri) };
  }
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return { body: decode(base64), contentType: mimeFromUri(uri) };
}

async function uploadImage(
  bucket: string,
  path: string,
  uri: string,
  upsert: boolean,
): Promise<string | null> {
  if (!supabase) return null;
  const { body, contentType } = await readUpload(uri);
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    contentType,
    upsert,
  });
  if (error) throw error;
  const { data: signed, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr) throw signErr;
  return signed?.signedUrl ?? null;
}

export async function uploadMealPhoto(userId: string, localUri: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) {
    // No backend configured: keep the local URI as the photo source.
    return localUri;
  }
  const ext = mimeFromUri(localUri).split('/')[1] ?? 'jpg';
  return uploadImage(BUCKET, `${userId}/${Date.now()}.${ext}`, localUri, false);
}

// Uploads a locally-picked avatar to the avatars bucket and returns a long-lived
// signed URL, so the profile photo syncs across devices instead of living as a
// local URI on one device.
export async function uploadAvatar(userId: string, localUri: string): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase) return localUri;
  const ext = mimeFromUri(localUri).split('/')[1] ?? 'jpg';
  return uploadImage(AVATAR_BUCKET, `${userId}/avatar-${Date.now()}.${ext}`, localUri, true);
}
