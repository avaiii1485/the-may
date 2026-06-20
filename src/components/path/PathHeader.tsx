import { router } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Avatar } from '@/components/common/Avatar';
import { useI18n } from '@/i18n';
import { useProfileStore } from '@/stores/profileStore';
import { useThemeStore } from '@/stores/themeStore';

interface Props {
  goal: string;
}

export function PathHeader({ goal }: Props): JSX.Element {
  const { t, tv } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const avatarUri = useProfileStore((s) => s.avatarUri);
  const preferredName = useProfileStore((s) => s.preferredName);
  const handle = useProfileStore((s) => s.handle);

  return (
    <View className="bg-path dark:bg-[#8A7860] px-5 pt-4 pb-5 rounded-b-[28px]">
      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel="Choose focus"
          className="w-10 h-10 items-center justify-center rounded-full bg-white/20 dark:bg-[#6E5A42]"
        >
          <Pencil size={18} color={dark ? '#D2C3AF' : '#FFFFFF'} />
        </Pressable>
        <View className="items-center flex-1 mx-2">
          <Text className="text-white/80 text-xs uppercase tracking-wider">
            {t('path.currentFocus')}
          </Text>
          <Text className="text-white text-lg font-bold mt-1 text-center" numberOfLines={1}>
            {tv('focus', goal)}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: dark ? '#4D3D2A' : 'rgba(255,255,255,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <Avatar
            uri={avatarUri}
            name={preferredName}
            handle={handle}
            size={36}
            bg={dark ? '#6E5A42' : '#D6791F'}
            fg={dark ? '#C7B6A0' : '#FFFFFF'}
          />
        </Pressable>
      </View>
    </View>
  );
}
