import { Check, CloudOff, RefreshCw } from 'lucide-react-native';
import { Platform, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { isSupabaseConfigured } from '@/lib/supabase';
import { LOCAL_USER_ID, useAuthStore } from '@/stores/authStore';
import { useOutboxStore } from '@/stores/outboxStore';
import { useSyncStatusStore } from '@/stores/syncStatusStore';

// Small pill showing whether the user's data is backed up to their account:
// Saving… while syncing, Offline when there are unsent changes with no
// connection, Pending when changes are queued, otherwise Synced.
export function SyncStatus(): JSX.Element | null {
  const { t } = useI18n();
  const userId = useAuthStore((s) => s.userId);
  const syncing = useSyncStatusStore((s) => s.syncing);
  const pending = useOutboxStore((s) => s.ops.length);

  // Only meaningful when signed in to a cloud account.
  if (!isSupabaseConfigured || userId === LOCAL_USER_ID) return null;

  const online = !(Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.onLine === false);

  let icon: JSX.Element;
  let label: string;
  let color: string;
  if (syncing) {
    icon = <RefreshCw size={12} color="#7FA37B" />;
    label = t('sync.saving');
    color = '#7FA37B';
  } else if (pending > 0 && !online) {
    icon = <CloudOff size={12} color="#94A3B8" />;
    label = t('sync.offline');
    color = '#94A3B8';
  } else if (pending > 0) {
    icon = <RefreshCw size={12} color="#94A3B8" />;
    label = t('sync.pending');
    color = '#94A3B8';
  } else {
    icon = <Check size={12} color="#7FA37B" />;
    label = t('sync.synced');
    color = '#7FA37B';
  }

  return (
    <View className="flex-row items-center justify-center py-1">
      {icon}
      <Text className="text-[11px] ml-1" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
