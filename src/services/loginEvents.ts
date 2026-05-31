import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

function gatherDevice(): {
  platform: string;
  os_version: string | null;
  device_name: string | null;
  model_name: string | null;
  app_version: string | null;
  user_agent: string | null;
} {
  const isWeb = Platform.OS === 'web';
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  return {
    platform: Platform.OS,
    os_version: Device.osVersion ?? (Platform.Version != null ? String(Platform.Version) : null),
    device_name: Device.deviceName ?? null,
    model_name: Device.modelName ?? null,
    app_version: Constants.expoConfig?.version ?? null,
    user_agent: isWeb ? (nav?.userAgent ?? null) : null,
  };
}

// Records a sign-in/sign-up with its device, and mirrors the email onto profiles.
// Best-effort: never throws into the auth flow (a failed log must not block login).
export async function recordAuthEvent(event: 'sign_in' | 'sign_up'): Promise<void> {
  if (!supabase) return;
  try {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;

    const device = gatherDevice();

    await supabase.from('login_events').insert({
      user_id: user.id,
      event,
      ...device,
    } as never);

    if (user.email) {
      await supabase.from('profiles').upsert({ id: user.id, email: user.email } as never);
    }
  } catch (e) {
    console.warn('[auth] recordAuthEvent failed:', e instanceof Error ? e.message : String(e));
  }
}
