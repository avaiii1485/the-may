import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Check, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/common/Avatar';
import { BadgeStrip } from '@/components/profile/BadgeStrip';
import { useI18n } from '@/i18n';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { getAllBadges } from '@/lib/badges';
import { toJalali } from '@/lib/jalali';
import { isSupabaseConfigured } from '@/lib/supabase';
import { signOut } from '@/services/auth';
import { LOCAL_USER_ID, useAuthStore } from '@/stores/authStore';
import { useAuthPromptStore } from '@/stores/authPromptStore';
import { useLanguageStore } from '@/stores/languageStore';
import { type ProfileData, useProfileStore } from '@/stores/profileStore';

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_.]/g, '')
    .toLowerCase();
}

export default function ProfileScreen(): JSX.Element {
  const { t, d, lang } = useI18n();
  const setLang = useLanguageStore((s) => s.setLang);
  const profile = useProfileStore();
  const update = useProfileStore((s) => s.update);
  const { data: meals } = useMeals();
  const accountEmail = useAuthStore((s) => s.email);
  const setAuthDismissed = useAuthPromptStore((s) => s.setDismissed);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const onLogout = async () => {
    setLogoutConfirm(false);
    try {
      await signOut();
    } catch (e) {
      console.warn('[auth] sign out failed:', e instanceof Error ? e.message : String(e));
    }
    // Force the logged-out state immediately rather than waiting on the auth
    // event, so logout can't appear to "do nothing".
    useAuthStore.getState().setUser(LOCAL_USER_ID, null, false);
    setAuthDismissed(false);
    router.push('/auth');
  };

  const openSignIn = () => router.push('/auth');

  const [form, setForm] = useState<ProfileData>({
    avatarUri: profile.avatarUri,
    preferredName: profile.preferredName,
    handle: profile.handle,
    phoneNumber: profile.phoneNumber,
    email: profile.email,
    bio: profile.bio,
    joinedAt: profile.joinedAt,
  });

  useEffect(() => {
    setForm({
      avatarUri: profile.avatarUri,
      preferredName: profile.preferredName,
      handle: profile.handle,
      phoneNumber: profile.phoneNumber,
      email: profile.email,
      bio: profile.bio,
      joinedAt: profile.joinedAt,
    });
  }, [
    profile.avatarUri,
    profile.preferredName,
    profile.handle,
    profile.phoneNumber,
    profile.email,
    profile.bio,
    profile.joinedAt,
  ]);

  const stats = useMemo(() => {
    const total = meals.length;
    const onPath = meals.filter((m) => m.onPath).length;
    const pct = total === 0 ? 0 : Math.round((onPath / total) * 100);
    const uniqueDays = new Set(
      meals.map((m) => {
        const dt = new Date(m.eatenAt);
        return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      }),
    ).size;
    return { total, pct, uniqueDays };
  }, [meals]);

  const { goal } = useGoal();
  const badges = useMemo(
    () =>
      getAllBadges(
        {
          meals,
          goal,
          preferredName: profile.preferredName,
          handle: profile.handle,
        },
        lang,
      ),
    [meals, goal, profile.preferredName, profile.handle, lang],
  );

  const formatJoined = (iso: string): string => {
    const dt = new Date(iso);
    if (lang === 'fa') {
      const j = toJalali(dt);
      return `${j.jd} ${j.monthName} ${j.jy}`;
    }
    return `${MONTHS_EN[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`;
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((s) => ({ ...s, avatarUri: result.assets[0]?.uri ?? null }));
    }
  };

  const removeAvatar = () => setForm((s) => ({ ...s, avatarUri: null }));

  const onSave = () => {
    update({ ...form, handle: form.handle ? normalizeHandle(form.handle) : '' });
    router.back();
  };

  const dirty =
    form.avatarUri !== profile.avatarUri ||
    form.preferredName !== profile.preferredName ||
    form.handle !== profile.handle ||
    form.phoneNumber !== profile.phoneNumber ||
    form.email !== profile.email ||
    form.bio !== profile.bio;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel={t('common.close')}
        >
          <X size={22} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">{t('profile.title')}</Text>
        <Pressable
          onPress={onSave}
          disabled={!dirty}
          className="px-3 py-1"
          accessibilityRole="button"
          accessibilityLabel={t('profile.save')}
        >
          <Text className={`font-bold ${dirty ? 'text-bubble-active' : 'text-ink-mute'}`}>
            {t('profile.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center py-6 bg-path-soft">
          <Pressable
            onPress={pickAvatar}
            accessibilityRole="button"
            accessibilityLabel={t('profile.title')}
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              borderWidth: 3,
              borderColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              shadowColor: '#0F172A',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Avatar uri={form.avatarUri} name={form.preferredName} handle={form.handle} size={98} />
            <View
              style={{
                position: 'absolute',
                right: 2,
                bottom: 2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#0F172A',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: '#FFFFFF',
              }}
            >
              <Camera size={14} color="#FFFFFF" />
            </View>
          </Pressable>
          {form.avatarUri ? (
            <Pressable onPress={removeAvatar} className="mt-2">
              <Text className="text-ink-soft text-xs">{t('profile.removePhoto')}</Text>
            </Pressable>
          ) : null}
          <Text className="text-ink text-xl font-bold mt-3">
            {form.preferredName || t('profile.yourName')}
          </Text>
          {form.handle ? (
            <Text className="text-ink-mute text-sm">@{normalizeHandle(form.handle)}</Text>
          ) : null}
        </View>

        {/* Language switch */}
        <View className="px-5 py-4 border-b border-slate-100">
          <Text className="text-xs uppercase tracking-widest text-ink-mute mb-2">
            {t('profile.language')}
          </Text>
          <View className="flex-row" style={{ gap: 8 }}>
            {(['en', 'fa'] as const).map((code) => {
              const active = lang === code;
              return (
                <Pressable
                  key={code}
                  onPress={() => setLang(code)}
                  className={`flex-1 flex-row items-center justify-center rounded-full py-3 ${
                    active ? 'bg-bubble-active' : 'bg-bg-card'
                  }`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={code === 'en' ? 'English' : 'فارسی'}
                >
                  {active ? (
                    <Check size={16} color="#FFFFFF" style={{ marginHorizontal: 4 }} />
                  ) : null}
                  <Text
                    className={`font-bold ${active ? 'text-white' : 'text-ink'}`}
                  >
                    {code === 'en' ? 'English' : 'فارسی'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {isSupabaseConfigured ? (
          <View className="px-5 py-4 border-b border-slate-100">
            <Text className="text-xs uppercase tracking-widest text-ink-mute mb-2">
              {t('auth.account')}
            </Text>
            {accountEmail ? (
              <>
                <Text className="text-ink text-sm mb-3">
                  {t('auth.signedInAs', { email: accountEmail })}
                </Text>
                <Pressable
                  onPress={() => setLogoutConfirm(true)}
                  className="rounded-full py-3 items-center bg-bg-card"
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.logOut')}
                >
                  <Text className="text-ink font-bold tracking-widest">{t('auth.logOut')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text className="text-ink-soft text-sm mb-3">{t('auth.anonNote')}</Text>
                <Pressable
                  onPress={openSignIn}
                  className="rounded-full py-3 items-center bg-bubble-active"
                  accessibilityRole="button"
                  accessibilityLabel={t('auth.signInCta')}
                >
                  <Text className="text-white font-bold tracking-widest">{t('auth.signInCta')}</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <View className="flex-row justify-around py-5 border-b border-slate-100">
          <View className="items-center">
            <Text className="text-ink text-2xl font-extrabold">{d(stats.total)}</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1">
              {t('profile.meals')}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-ink text-2xl font-extrabold">{d(stats.pct)}%</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1">
              {t('profile.onPath')}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-ink text-2xl font-extrabold">{d(stats.uniqueDays)}</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1">
              {t('profile.daysLogged')}
            </Text>
          </View>
        </View>

        <BadgeStrip badges={badges} />

        <View className="px-5 pt-6">
          <Field label={t('profile.fld.name')}>
            <TextInput
              value={form.preferredName}
              onChangeText={(v) => setForm((s) => ({ ...s, preferredName: v }))}
              placeholder={t('profile.fld.namePh')}
              placeholderTextColor="#94A3B8"
              className="text-ink text-base py-2"
            />
          </Field>

          <Field label={t('profile.fld.handle')}>
            <View className="flex-row items-center">
              <Text className="text-ink-mute text-base mr-1">@</Text>
              <TextInput
                value={form.handle}
                onChangeText={(v) => setForm((s) => ({ ...s, handle: v }))}
                placeholder={t('profile.fld.handlePh')}
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                className="flex-1 text-ink text-base py-2"
              />
            </View>
          </Field>

          <Field label={t('profile.fld.phone')}>
            <TextInput
              value={form.phoneNumber}
              onChangeText={(v) => setForm((s) => ({ ...s, phoneNumber: v }))}
              placeholder="+1 555 123 4567"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              className="text-ink text-base py-2"
            />
          </Field>

          <Field label={t('profile.fld.email')}>
            <TextInput
              value={form.email}
              onChangeText={(v) => setForm((s) => ({ ...s, email: v }))}
              placeholder="you@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              className="text-ink text-base py-2"
            />
          </Field>

          <Field label={t('profile.fld.bio')}>
            <TextInput
              value={form.bio}
              onChangeText={(v) => setForm((s) => ({ ...s, bio: v }))}
              placeholder={t('profile.fld.bioPh')}
              placeholderTextColor="#94A3B8"
              multiline
              className="text-ink text-base py-2"
            />
          </Field>

          <View className="mt-4 mb-2">
            <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">
              {t('profile.joined')}
            </Text>
            <Text className="text-ink text-base">{formatJoined(form.joinedAt)}</Text>
          </View>
        </View>
      </ScrollView>

      {logoutConfirm ? (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View className="bg-white rounded-3xl p-6 w-full" style={{ maxWidth: 360 }}>
            <Text className="text-ink text-lg font-extrabold text-center mb-1">
              {t('auth.logoutConfirmTitle')}
            </Text>
            <Text className="text-ink-soft text-sm text-center mb-5">
              {t('auth.logoutConfirmBody')}
            </Text>
            <Pressable
              onPress={onLogout}
              className="rounded-full py-3 items-center mb-2 bg-ink"
              accessibilityRole="button"
              accessibilityLabel={t('auth.logOut')}
            >
              <Text className="text-white font-bold tracking-wide">{t('auth.logOut')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setLogoutConfirm(false)}
              className="rounded-full py-3 items-center bg-bg-card"
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text className="text-ink font-bold tracking-wide">{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <View className="mb-4">
      <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">{label}</Text>
      <View className="border-b border-slate-200">{children}</View>
    </View>
  );
}
