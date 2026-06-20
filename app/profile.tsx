import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, Check, Moon, Sun, X } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/common/Avatar';
import { SlideToggle } from '@/components/common/SlideToggle';
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
import { useThemeStore } from '@/stores/themeStore';

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
  const mode = useThemeStore((s) => s.mode);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const dark = mode === 'dark';
  const profile = useProfileStore();
  const update = useProfileStore((s) => s.update);
  const { data: meals } = useMeals();
  const accountEmail = useAuthStore((s) => s.email);
  const setAuthDismissed = useAuthPromptStore((s) => s.setDismissed);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  // Theme-aware values for inline (non-className) colors.
  const iconColor = dark ? '#D2C3AF' : '#0F172A';
  const placeholderColor = dark ? '#8B7A66' : '#94A3B8';
  const trackColor = dark ? '#33271A' : '#E7DCCB';
  // Calmer avatar header in dark mode: muted taupe circle, soft warm ring, and a
  // low-key camera badge instead of the bright amber + white ring.
  const avatarBg = dark ? '#6E5A42' : '#F39C3D';
  const avatarFg = dark ? '#C7B6A0' : '#FFFFFF';
  const ringColor = dark ? '#4D3D2A' : '#FFFFFF';
  const badgeBg = dark ? '#4D3D2A' : '#0F172A';
  const badgeBorder = dark ? '#2B2014' : '#FFFFFF';
  const badgeIcon = dark ? '#D2C3AF' : '#FFFFFF';

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

  const snapshot = (): ProfileData => ({
    avatarUri: profile.avatarUri,
    preferredName: profile.preferredName,
    handle: profile.handle,
    phoneNumber: profile.phoneNumber,
    email: profile.email,
    bio: profile.bio,
    joinedAt: profile.joinedAt,
  });

  const [form, setForm] = useState<ProfileData>(snapshot);
  // Last store values the form was synced from — used to tell apart the user's
  // own edits from a background sync (so a cross-device update doesn't wipe
  // in-progress typing, but a fresh login's pulled profile still shows up).
  const lastStore = useRef<ProfileData>(snapshot());

  useEffect(() => {
    const incoming: ProfileData = {
      avatarUri: profile.avatarUri,
      preferredName: profile.preferredName,
      handle: profile.handle,
      phoneNumber: profile.phoneNumber,
      email: profile.email,
      bio: profile.bio,
      joinedAt: profile.joinedAt,
    };
    setForm((cur) => {
      const userEdited = JSON.stringify(cur) !== JSON.stringify(lastStore.current);
      lastStore.current = incoming;
      return userEdited ? cur : incoming;
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
    <SafeAreaView className="flex-1 bg-cream dark:bg-[#160F09]" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-[#33271A]">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel={t('common.close')}
        >
          <X size={22} color={iconColor} />
        </Pressable>
        <Text className="text-lg font-bold text-ink dark:text-[#D2C3AF]">{t('profile.title')}</Text>
        <Pressable
          onPress={onSave}
          disabled={!dirty}
          className="px-3 py-1"
          accessibilityRole="button"
          accessibilityLabel={t('profile.save')}
        >
          <Text
            className="font-bold"
            style={{ color: dirty ? '#7FA37B' : dark ? '#4F5E4D' : '#B4C8B1' }}
          >
            {t('profile.save')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header — avatar + name */}
        <View className="items-center py-6 bg-path-soft dark:bg-[#2B2014]">
          <Pressable
            onPress={pickAvatar}
            accessibilityRole="button"
            accessibilityLabel={t('profile.title')}
            style={{
              width: 104,
              height: 104,
              borderRadius: 52,
              borderWidth: 3,
              borderColor: ringColor,
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
            <Avatar
              uri={form.avatarUri}
              name={form.preferredName}
              handle={form.handle}
              size={98}
              bg={avatarBg}
              fg={avatarFg}
            />
            <View
              style={{
                position: 'absolute',
                right: 2,
                bottom: 2,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: badgeBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: badgeBorder,
              }}
            >
              <Camera size={14} color={badgeIcon} />
            </View>
          </Pressable>
          {form.avatarUri ? (
            <Pressable onPress={removeAvatar} className="mt-2">
              <Text className="text-ink-soft dark:text-[#AD9C86] text-xs">{t('profile.removePhoto')}</Text>
            </Pressable>
          ) : null}
          <Text className="text-ink dark:text-[#D2C3AF] text-xl font-bold mt-3">
            {form.preferredName || t('profile.yourName')}
          </Text>
          {form.handle ? (
            <Text className="text-ink-mute dark:text-[#8A7860] text-sm">@{normalizeHandle(form.handle)}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View className="flex-row py-5 border-b border-slate-100 dark:border-[#33271A]">
          <View className="flex-1 items-center px-1">
            <Text className="text-ink dark:text-[#D2C3AF] text-2xl font-extrabold">{d(stats.total)}</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1 text-center">
              {t('profile.meals')}
            </Text>
          </View>
          <View className="flex-1 items-center px-1">
            <Text className="text-ink dark:text-[#D2C3AF] text-2xl font-extrabold">{d(stats.pct)}%</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1 text-center">
              {t('profile.onPath')}
            </Text>
          </View>
          <View className="flex-1 items-center px-1">
            <Text className="text-ink dark:text-[#D2C3AF] text-2xl font-extrabold">{d(stats.uniqueDays)}</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1 text-center">
              {t('profile.daysLogged')}
            </Text>
          </View>
        </View>

        {/* Badges */}
        <BadgeStrip badges={badges} />

        {/* Appearance — language + theme */}
        <SectionTitle dark={dark}>{t('profile.appearance')}</SectionTitle>
        <View className="px-5 pb-5 border-b border-slate-100 dark:border-[#33271A]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-ink dark:text-[#D2C3AF] text-base">{t('profile.language')}</Text>
            <SlideToggle
              on={lang === 'fa'}
              onToggle={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              width={116}
              trackColor={trackColor}
              knobContent={<Check size={16} color="#FFFFFF" />}
              sideContent={
                <Text style={{ color: iconColor, fontWeight: '700', fontSize: 13 }}>
                  {lang === 'fa' ? 'فارسی' : 'English'}
                </Text>
              }
              accessibilityLabel={t('profile.language')}
            />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-ink dark:text-[#D2C3AF] text-base">{t('profile.theme')}</Text>
            <SlideToggle
              on={dark}
              onToggle={toggleTheme}
              width={116}
              trackColor={trackColor}
              knobContent={
                dark ? <Moon size={16} color="#FFFFFF" /> : <Sun size={16} color="#FFFFFF" />
              }
              sideContent={
                dark ? <Sun size={15} color="#8A7860" /> : <Moon size={15} color="#94A3B8" />
              }
              accessibilityLabel={t('profile.theme')}
            />
          </View>
        </View>

        {/* Personal info */}
        <SectionTitle dark={dark}>{t('profile.personalInfo')}</SectionTitle>
        <View className="px-5">
          <Field label={t('profile.fld.name')} dark={dark}>
            <TextInput
              value={form.preferredName}
              onChangeText={(v) => setForm((s) => ({ ...s, preferredName: v }))}
              placeholder={t('profile.fld.namePh')}
              placeholderTextColor={placeholderColor}
              className="text-ink dark:text-[#D2C3AF] text-base py-2"
            />
          </Field>

          <Field label={t('profile.fld.handle')} dark={dark}>
            <View className="flex-row items-center">
              <Text className="text-ink-mute dark:text-[#8A7860] text-base mr-1">@</Text>
              <TextInput
                value={form.handle}
                onChangeText={(v) => setForm((s) => ({ ...s, handle: v }))}
                placeholder={t('profile.fld.handlePh')}
                placeholderTextColor={placeholderColor}
                autoCapitalize="none"
                className="flex-1 text-ink dark:text-[#D2C3AF] text-base py-2"
              />
            </View>
          </Field>

          <Field label={t('profile.fld.phone')} dark={dark}>
            <TextInput
              value={form.phoneNumber}
              onChangeText={(v) => setForm((s) => ({ ...s, phoneNumber: v }))}
              placeholder="+1 555 123 4567"
              placeholderTextColor={placeholderColor}
              keyboardType="phone-pad"
              className="text-ink dark:text-[#D2C3AF] text-base py-2"
            />
          </Field>

          <Field label={t('profile.fld.email')} dark={dark}>
            <TextInput
              value={form.email}
              onChangeText={(v) => setForm((s) => ({ ...s, email: v }))}
              placeholder="you@example.com"
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              className="text-ink dark:text-[#D2C3AF] text-base py-2"
            />
          </Field>

          <Field label={t('profile.fld.bio')} dark={dark}>
            <TextInput
              value={form.bio}
              onChangeText={(v) => setForm((s) => ({ ...s, bio: v }))}
              placeholder={t('profile.fld.bioPh')}
              placeholderTextColor={placeholderColor}
              multiline
              className="text-ink dark:text-[#D2C3AF] text-base py-2"
            />
          </Field>
        </View>

        {/* Account */}
        {isSupabaseConfigured ? (
          <>
            <SectionTitle dark={dark}>{t('auth.account')}</SectionTitle>
            <View className="px-5 pb-4">
              {accountEmail ? (
                <>
                  <Text className="text-ink dark:text-[#D2C3AF] text-sm mb-3">
                    {t('auth.signedInAs', { email: accountEmail })}
                  </Text>
                  <Pressable
                    onPress={() => setLogoutConfirm(true)}
                    className="rounded-full py-3 items-center bg-bg-card dark:bg-[#241B12]"
                    accessibilityRole="button"
                    accessibilityLabel={t('auth.logOut')}
                  >
                    <Text className="text-ink dark:text-[#D2C3AF] font-bold tracking-widest">
                      {t('auth.logOut')}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text className="text-ink-soft dark:text-[#AD9C86] text-sm mb-3">{t('auth.anonNote')}</Text>
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
          </>
        ) : null}

        {/* Joined — bottom of the page */}
        <View className="px-5 pt-4 pb-2 border-t border-slate-100 dark:border-[#33271A]">
          <Text className="text-xs uppercase tracking-widest text-ink-mute dark:text-[#8A7860] mb-1">
            {t('profile.joined')}
          </Text>
          <Text className="text-ink dark:text-[#D2C3AF] text-base">{formatJoined(form.joinedAt)}</Text>
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
          <View className="bg-white dark:bg-[#241B12] rounded-3xl p-6 w-full" style={{ maxWidth: 360 }}>
            <Text className="text-ink dark:text-[#D2C3AF] text-lg font-extrabold text-center mb-1">
              {t('auth.logoutConfirmTitle')}
            </Text>
            <Text className="text-ink-soft dark:text-[#AD9C86] text-sm text-center mb-5">
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
              className="rounded-full py-3 items-center bg-bg-card dark:bg-[#160F09]"
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <Text className="text-ink dark:text-[#D2C3AF] font-bold tracking-wide">{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function SectionTitle({ children, dark }: { children: React.ReactNode; dark: boolean }): JSX.Element {
  return (
    <Text
      className={`px-5 pt-5 pb-2 text-xs uppercase tracking-widest ${
        dark ? 'text-[#8A7860]' : 'text-ink-mute'
      }`}
    >
      {children}
    </Text>
  );
}

function Field({
  label,
  children,
  dark,
}: {
  label: string;
  children: React.ReactNode;
  dark: boolean;
}): JSX.Element {
  return (
    <View className="mb-4">
      <Text className="text-xs uppercase tracking-widest text-ink-mute dark:text-[#8A7860] mb-1">{label}</Text>
      <View className={`border-b ${dark ? 'border-[#33271A]' : 'border-slate-200'}`}>{children}</View>
    </View>
  );
}
