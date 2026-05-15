import '../global.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider } from 'tamagui';
import { queryClient } from '@/lib/queryClient';
import tamaguiConfig from '../tamagui.config';

export default function RootLayout(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
          <QueryClientProvider client={queryClient}>
            <StatusBar style="dark" />
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
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="profile"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="week-recap"
                options={{ presentation: 'modal', headerShown: false }}
              />
              <Stack.Screen
                name="badges"
                options={{ presentation: 'modal', headerShown: false }}
              />
            </Stack>
          </QueryClientProvider>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
