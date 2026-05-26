import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { continueAnonymously, signIn, signUp } from '@/services/auth';
import { useAuthPromptStore } from '@/stores/authPromptStore';

type Mode = 'signup' | 'login';

// Real navigation screen (presented as a modal) — reliably shown on top from
// anywhere, unlike the previous absolutely-positioned overlay.
export default function AuthScreen(): JSX.Element {
  const { t } = useI18n();
  const setDismissed = useAuthPromptStore((s) => s.setDismissed);

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const submit = async () => {
    setError(null);
    const e = email.trim();
    if (!e || !password) {
      setError(t('auth.errFields'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errPassword'));
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(e, password);
      else await signIn(e, password);
      close();
    } catch (err) {
      console.warn('[auth] form error:', err instanceof Error ? err.message : String(err));
      setError(t('auth.errGeneric'));
      setBusy(false);
    }
  };

  const skip = async () => {
    try {
      await continueAnonymously();
    } catch (e) {
      console.warn('[auth] continue anonymously failed:', e instanceof Error ? e.message : String(e));
    }
    setDismissed(true);
    close();
  };

  const primaryLabel = mode === 'signup' ? t('auth.createAccount') : t('auth.logIn');

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-8">
          <View
            className="w-16 h-16 rounded-3xl items-center justify-center mb-4"
            style={{ backgroundColor: '#FCEBD3' }}
          >
            <Text style={{ fontSize: 30 }}>🍽️</Text>
          </View>
          <Text className="text-ink text-2xl font-extrabold text-center">{t('auth.title')}</Text>
          <Text className="text-ink-soft text-center mt-2 px-2">{t('auth.subtitle')}</Text>
        </View>

        <View className="mb-3">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
            {t('auth.email')}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPh')}
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            keyboardType="email-address"
            className="text-ink text-base py-3 px-4 rounded-2xl bg-bg-card"
          />
        </View>

        <View className="mb-2">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
            {t('auth.password')}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPh')}
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            className="text-ink text-base py-3 px-4 rounded-2xl bg-bg-card"
          />
        </View>

        {error ? (
          <Text className="text-center text-sm mb-2" style={{ color: '#F25C8B' }}>
            {error}
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={busy}
          className={`rounded-full py-4 items-center mt-3 ${busy ? 'bg-ink-mute' : 'bg-bubble-active'}`}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
        >
          <Text className="text-white font-extrabold tracking-widest">
            {busy ? t('auth.working') : primaryLabel}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setMode((m) => (m === 'signup' ? 'login' : 'signup'));
          }}
          className="items-center py-4"
          accessibilityRole="button"
        >
          <Text className="text-bubble-active font-semibold">
            {mode === 'signup' ? t('auth.toLogin') : t('auth.toSignup')}
          </Text>
        </Pressable>

        <Pressable
          onPress={skip}
          className="items-center py-2"
          accessibilityRole="button"
          accessibilityLabel={t('auth.skip')}
        >
          <Text className="text-ink-mute text-sm underline">{t('auth.skip')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
