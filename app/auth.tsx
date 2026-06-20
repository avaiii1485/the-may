import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import {
  authErrorKey,
  continueAnonymously,
  resetPassword,
  signIn,
  signInWithGoogle,
  signUp,
  updatePassword,
} from '@/services/auth';
import { claimLocalMeals } from '@/lib/mealClaim';
import { LOCAL_USER_ID, useAuthStore } from '@/stores/authStore';
import { useAuthPromptStore } from '@/stores/authPromptStore';
import { useThemeStore } from '@/stores/themeStore';

interface AuthedUserLite {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

// Applies the signed-in user and claims any local/anonymous meals into the new
// account, so a user logging in keeps the meals they logged beforehand.
function applyUser(user: AuthedUserLite): void {
  const prevId = useAuthStore.getState().userId;
  const prevAnon = useAuthStore.getState().isAnonymous;
  useAuthStore.getState().setUser(user.id, user.email, user.isAnonymous);
  if (user.id !== prevId && (prevId === LOCAL_USER_ID || prevAnon)) {
    claimLocalMeals(prevId, user.id);
  }
}

type Mode = 'signup' | 'login';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthScreen(): JSX.Element {
  const { t } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const setDismissed = useAuthPromptStore((s) => s.setDismissed);
  const recovery = useAuthStore((s) => s.recovery);
  const setRecovery = useAuthStore((s) => s.setRecovery);

  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const submit = async () => {
    setError(null);
    setInfo(null);
    const e = email.trim();
    if (!e || !password) {
      setError(t('auth.errFields'));
      return;
    }
    if (!EMAIL_RE.test(e)) {
      setError(t('auth.errInvalidEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.errPassword'));
      return;
    }
    setBusy(true);
    try {
      const user = mode === 'signup' ? await signUp(e, password) : await signIn(e, password);
      // Apply auth state synchronously so the Path tab doesn't briefly see
      // "logged out" and re-open this screen (the bounce-on-first-login bug).
      if (user) applyUser(user);
      close();
    } catch (err) {
      setError(t(authErrorKey(err, mode)));
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        applyUser(user);
        close();
      }
      // On web the page redirects; nothing else to do here.
    } catch (err) {
      setError(t(authErrorKey(err, mode)));
      setBusy(false);
    }
  };

  const onForgot = async () => {
    setError(null);
    setInfo(null);
    const e = email.trim();
    if (!EMAIL_RE.test(e)) {
      setError(t('auth.resetNeedEmail'));
      return;
    }
    setBusy(true);
    try {
      await resetPassword(e);
      setInfo(t('auth.resetSent'));
    } catch (err) {
      setError(t(authErrorKey(err, mode)));
    } finally {
      setBusy(false);
    }
  };

  const onSaveNewPassword = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t('auth.errPassword'));
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      setRecovery(false);
      close();
    } catch (err) {
      setError(t(authErrorKey(err, 'login')));
      setBusy(false);
    }
  };

  const Header = (
    <View className="items-center mb-8">
      <View
        className="w-16 h-16 rounded-3xl items-center justify-center mb-4"
        style={{ backgroundColor: '#FCEBD3' }}
      >
        <Text style={{ fontSize: 30 }}>🍽️</Text>
      </View>
      <Text className="text-ink text-2xl font-extrabold text-center">
        {recovery ? t('auth.resetTitle') : t('auth.title')}
      </Text>
      {!recovery ? <Text className="text-ink-soft text-center mt-2 px-2">{t('auth.subtitle')}</Text> : null}
    </View>
  );

  const Feedback = (
    <>
      {error ? (
        <Text className="text-center text-sm mb-2" style={{ color: '#F25C8B' }}>
          {error}
        </Text>
      ) : null}
      {info ? (
        <Text className="text-center text-sm mb-2" style={{ color: '#34C9A2' }}>
          {info}
        </Text>
      ) : null}
    </>
  );

  // Password-reset completion: the user arrived from the reset email link.
  if (recovery) {
    return (
      <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {Header}
          <View className="mb-2">
            <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
              {t('auth.newPassword')}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder={t('auth.passwordPh')}
              placeholderTextColor={dark ? '#8A7860' : '#94A3B8'}
              secureTextEntry
              autoCapitalize="none"
              className="text-ink text-base py-3 px-4 rounded-2xl bg-bg-card"
            />
          </View>
          {Feedback}
          <Pressable
            onPress={onSaveNewPassword}
            disabled={busy}
            className={`rounded-full py-4 items-center mt-3 ${busy ? 'bg-ink-mute' : 'bg-bubble-active'}`}
            accessibilityRole="button"
            accessibilityLabel={t('auth.savePassword')}
          >
            <Text className="text-white font-extrabold tracking-widest">
              {busy ? t('auth.working') : t('auth.savePassword')}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const primaryLabel = mode === 'signup' ? t('auth.createAccount') : t('auth.logIn');

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {Header}

        <View className="mb-3">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
            {t('auth.email')}
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPh')}
            placeholderTextColor={dark ? '#8A7860' : '#94A3B8'}
            autoCapitalize="none"
            keyboardType="email-address"
            className="text-ink text-base py-3 px-4 rounded-2xl bg-bg-card"
          />
        </View>

        <View className="mb-1">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
            {t('auth.password')}
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t('auth.passwordPh')}
            placeholderTextColor={dark ? '#8A7860' : '#94A3B8'}
            secureTextEntry
            autoCapitalize="none"
            className="text-ink text-base py-3 px-4 rounded-2xl bg-bg-card"
          />
        </View>

        {mode === 'login' ? (
          <Pressable onPress={onForgot} className="self-end py-2" accessibilityRole="button">
            <Text className="text-bubble-active text-sm font-semibold">{t('auth.forgot')}</Text>
          </Pressable>
        ) : (
          <View className="mb-1" />
        )}

        {Feedback}

        <Pressable
          onPress={submit}
          disabled={busy}
          className={`rounded-full py-4 items-center mt-2 ${busy ? 'bg-ink-mute' : 'bg-bubble-active'}`}
          accessibilityRole="button"
          accessibilityLabel={primaryLabel}
        >
          <Text className="text-white font-extrabold tracking-widest">
            {busy ? t('auth.working') : primaryLabel}
          </Text>
        </Pressable>

        {/* Divider */}
        <View className="flex-row items-center my-4">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="text-ink-mute text-xs mx-3 uppercase tracking-widest">{t('auth.or')}</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        <Pressable
          onPress={onGoogle}
          disabled={busy}
          className="rounded-full py-4 items-center flex-row justify-center bg-white dark:bg-[#241B12] border border-slate-200"
          accessibilityRole="button"
          accessibilityLabel={t('auth.google')}
        >
          <Text className="text-ink font-bold mr-2" style={{ fontSize: 16 }}>
            G
          </Text>
          <Text className="text-ink font-semibold">{t('auth.google')}</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setError(null);
            setInfo(null);
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
          onPress={async () => {
            try {
              await continueAnonymously();
            } catch (e) {
              console.warn('[auth] continue anonymously failed:', e instanceof Error ? e.message : String(e));
            }
            setDismissed(true);
            close();
          }}
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
