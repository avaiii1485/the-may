import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Camera, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/common/Avatar';
import { BadgeStrip } from '@/components/profile/BadgeStrip';
import { useMeals } from '@/hooks/useMeals';
import { useGoal } from '@/hooks/useProfile';
import { getAllBadges } from '@/lib/badges';
import { type ProfileData, useProfileStore } from '@/stores/profileStore';

function formatJoinedDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function normalizeHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-zA-Z0-9_.]/g, '')
    .toLowerCase();
}

export default function ProfileScreen(): JSX.Element {
  const profile = useProfileStore();
  const update = useProfileStore((s) => s.update);
  const { data: meals } = useMeals();

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
        const d = new Date(m.eatenAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      }),
    ).size;
    return { total, pct, uniqueDays };
  }, [meals]);

  const { goal } = useGoal();
  const badges = useMemo(
    () =>
      getAllBadges({
        meals,
        goal,
        preferredName: profile.preferredName,
        handle: profile.handle,
      }),
    [meals, goal, profile.preferredName, profile.handle],
  );

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
    update({
      ...form,
      handle: form.handle ? normalizeHandle(form.handle) : '',
    });
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
          accessibilityLabel="Close"
        >
          <X size={22} color="#0F172A" />
        </Pressable>
        <Text className="text-lg font-bold text-ink">Profile</Text>
        <Pressable
          onPress={onSave}
          disabled={!dirty}
          className="px-3 py-1"
          accessibilityRole="button"
          accessibilityLabel="Save profile"
        >
          <Text className={`font-bold ${dirty ? 'text-bubble-active' : 'text-ink-mute'}`}>
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar + name preview */}
        <View className="items-center py-6 bg-path-soft">
          <Pressable
            onPress={pickAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
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
              <Text className="text-ink-soft text-xs">Remove photo</Text>
            </Pressable>
          ) : null}
          <Text className="text-ink text-xl font-bold mt-3">
            {form.preferredName || 'Your name'}
          </Text>
          {form.handle ? (
            <Text className="text-ink-mute text-sm">@{normalizeHandle(form.handle)}</Text>
          ) : null}
        </View>

        {/* Stats */}
        <View className="flex-row justify-around py-5 border-b border-slate-100">
          <View className="items-center">
            <Text className="text-ink text-2xl font-extrabold">{stats.total}</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1">MEALS</Text>
          </View>
          <View className="items-center">
            <Text className="text-ink text-2xl font-extrabold">{stats.pct}%</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1">
              ON-PATH
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-ink text-2xl font-extrabold">{stats.uniqueDays}</Text>
            <Text className="text-path-dark text-[11px] tracking-widest font-bold mt-1">
              DAYS LOGGED
            </Text>
          </View>
        </View>

        {/* Badges strip — tap to open the full list */}
        <BadgeStrip badges={badges} />

        {/* Editable fields */}
        <View className="px-5 pt-6">
          <Field label="Preferred name">
            <TextInput
              value={form.preferredName}
              onChangeText={(v) => setForm((s) => ({ ...s, preferredName: v }))}
              placeholder="e.g. Ross"
              placeholderTextColor="#94A3B8"
              className="text-ink text-base py-2"
            />
          </Field>

          <Field label="Handle">
            <View className="flex-row items-center">
              <Text className="text-ink-mute text-base mr-1">@</Text>
              <TextInput
                value={form.handle}
                onChangeText={(v) => setForm((s) => ({ ...s, handle: v }))}
                placeholder="username"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                className="flex-1 text-ink text-base py-2"
              />
            </View>
          </Field>

          <Field label="Phone number">
            <TextInput
              value={form.phoneNumber}
              onChangeText={(v) => setForm((s) => ({ ...s, phoneNumber: v }))}
              placeholder="+1 555 123 4567"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              className="text-ink text-base py-2"
            />
          </Field>

          <Field label="Email">
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

          <Field label="Short bio">
            <TextInput
              value={form.bio}
              onChangeText={(v) => setForm((s) => ({ ...s, bio: v }))}
              placeholder="One line about what you're working on"
              placeholderTextColor="#94A3B8"
              multiline
              className="text-ink text-base py-2"
            />
          </Field>

          <View className="mt-4 mb-2">
            <Text className="text-xs uppercase tracking-widest text-ink-mute mb-1">Joined</Text>
            <Text className="text-ink text-base">{formatJoinedDate(form.joinedAt)}</Text>
          </View>
        </View>
      </ScrollView>
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
