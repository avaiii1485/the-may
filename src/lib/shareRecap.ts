import type { RefObject } from 'react';
import { Platform, Share, type View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

// Shares a plain-text recap.
export async function shareText(title: string, message: string): Promise<void> {
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const data = { title, text: message } as ShareData;
    if (nav?.share && (!nav.canShare || nav.canShare(data))) {
      await nav.share(data);
      return;
    }
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(message);
      if (typeof window !== 'undefined') window.alert(message);
      return;
    }
    if (typeof window !== 'undefined') window.alert(message);
    return;
  }
  await Share.share({ title, message });
}

// Captures the recap card as a PNG and shares the image. Falls back to a plain
// text share if capture/sharing isn't available.
export async function shareCardImage(
  ref: RefObject<View>,
  title: string,
  message: string,
): Promise<void> {
  if (Platform.OS === 'web') {
    const dataUri = await captureRef(ref, { format: 'png', quality: 0.95, result: 'data-uri' });
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    try {
      const blob = await (await fetch(dataUri)).blob();
      const file = new File([blob], 'the-may.png', { type: 'image/png' });
      if (nav?.share && nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], text: message, title });
        return;
      }
    } catch {
      // fall through to download
    }
    if (typeof document !== 'undefined') {
      const a = document.createElement('a');
      a.href = dataUri;
      a.download = 'the-may.png';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
    return;
  }

  const uri = await captureRef(ref, { format: 'png', quality: 0.95 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
  } else {
    await Share.share({ url: uri, title, message });
  }
}
