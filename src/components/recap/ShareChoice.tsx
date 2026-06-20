import { ImageIcon, Type } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { useThemeStore } from '@/stores/themeStore';

interface Props {
  visible: boolean;
  onTextOnly: () => void;
  onWithPictures: () => void;
  onClose: () => void;
}

// Bottom-of-screen choice for how to share a recap: plain text or an image of
// the recap card (collage + stats + tagline).
export function ShareChoice({ visible, onTextOnly, onWithPictures, onClose }: Props): JSX.Element | null {
  const { t } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  if (!visible) return null;

  return (
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
        zIndex: 50,
      }}
    >
      <Pressable
        onPress={onClose}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        accessibilityLabel={t('common.close')}
      />
      <View className="bg-white dark:bg-[#241B12] rounded-3xl p-5 w-full" style={{ maxWidth: 360 }}>
        <Text className="text-ink text-base font-extrabold text-center mb-4">
          {t('share.choose')}
        </Text>

        <Pressable
          onPress={onTextOnly}
          className="flex-row items-center rounded-2xl p-4 mb-2 bg-bg-card"
          accessibilityRole="button"
          accessibilityLabel={t('share.textOnly')}
        >
          <Type size={20} color={dark ? '#D2C3AF' : '#0F172A'} />
          <Text className="text-ink font-semibold ml-3">{t('share.textOnly')}</Text>
        </Pressable>

        <Pressable
          onPress={onWithPictures}
          className="flex-row items-center rounded-2xl p-4 mb-3 bg-path-soft"
          accessibilityRole="button"
          accessibilityLabel={t('share.withPictures')}
        >
          <ImageIcon size={20} color="#D6791F" />
          <Text className="text-path-dark font-semibold ml-3">{t('share.withPictures')}</Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          className="rounded-full py-3 items-center bg-bg-card"
          accessibilityRole="button"
          accessibilityLabel={t('common.cancel')}
        >
          <Text className="text-ink font-bold tracking-wide">{t('common.cancel')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
