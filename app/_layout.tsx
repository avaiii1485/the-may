import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { useApplyTheme } from '@/hooks/useApplyTheme';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useOtaUpdates } from '@/hooks/useOtaUpdates';
import { useSyncEngine } from '@/hooks/useSyncEngine';
import { useI18n } from '@/i18n';
import { queryClient } from '@/lib/queryClient';
import tamaguiConfig from '../tamagui.config';

export default function RootLayout(): JSX.Element {
  const { lang, isRTL } = useI18n();
  useAuthSession();
  useSyncEngine();
  useOtaUpdates();
  useApplyTheme();

  // Drive the document's lang/dir, and inject the Samim @font-face + a
  // forced family rule straight into <head>. RN-Web sets font-family on every
  // text element, so a normal stylesheet rule loses the cascade and the
  // browser never even fetches the font — an injected !important rule wins.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';

    const STYLE_ID = 'samim-font-inject';
    if (!document.getElementById(STYLE_ID)) {
      const base = 'https://cdn.jsdelivr.net/gh/rastikerdar/samim-font@v4.0.5/dist';
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = `
@font-face{font-family:'Samim';src:url('${base}/Samim.woff2') format('woff2'),url('${base}/Samim.woff') format('woff');font-weight:400;font-display:swap;}
@font-face{font-family:'Samim';src:url('${base}/Samim-Medium.woff2') format('woff2'),url('${base}/Samim-Medium.woff') format('woff');font-weight:500 600;font-display:swap;}
@font-face{font-family:'Samim';src:url('${base}/Samim-Bold.woff2') format('woff2'),url('${base}/Samim-Bold.woff') format('woff');font-weight:700 900;font-display:swap;}
html[lang='fa'], html[lang='fa'] * { font-family:'Samim', system-ui, -apple-system, 'Segoe UI', sans-serif !important; }
`;
      document.head.appendChild(el);
    }
  }, [lang, isRTL]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
            <View
              style={{ flex: 1, direction: isRTL ? 'rtl' : 'ltr' }}
            >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="capture-form"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="settings"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="meal/[id]"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="meal/edit/[id]"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="text-meal"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="day-recap/[date]"
                options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }}
              />
              <Stack.Screen
                name="profile"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="week-recap"
                options={{ presentation: 'transparentModal', headerShown: false, animation: 'fade' }}
              />
              <Stack.Screen
                name="badges"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="auth"
                options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
              />
            </Stack>
            </View>
          </QueryClientProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
