import { Platform, Share } from 'react-native';
import type { ProfileData } from '@/stores/profileStore';
import type { Meal } from '@/types/meal';

export interface ExportPayload {
  exportedAt: string;
  app: string;
  goal: string;
  profile: ProfileData;
  meals: Meal[];
}

export async function exportData(payload: ExportPayload): Promise<void> {
  const json = JSON.stringify(payload, null, 2);
  const filename = `the-may-export-${new Date().toISOString().slice(0, 10)}.json`;

  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  try {
    await Share.share({ title: filename, message: json });
  } catch {
    // user cancelled
  }
}
