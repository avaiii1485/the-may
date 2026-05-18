import { Pressable, Text, View } from 'react-native';
import { OffPathArrow, OnPathArrow } from '@/components/icons/OnPathArrow';
import { useI18n } from '@/i18n';

interface Props {
  onSaveOnPath: () => void;
  onSaveOffPath: () => void;
  disabled: boolean;
}

export function SaveAsBar({ onSaveOnPath, onSaveOffPath, disabled }: Props): JSX.Element {
  const { t } = useI18n();
  return (
    <View className="border-t border-slate-200 bg-white px-6 pt-4 pb-6">
      <Text className="text-center text-ink-soft mb-3">{t('capture.saveAs')}</Text>
      <View className="flex-row justify-around items-center">
        <View className="items-center">
          <Pressable
            onPress={onSaveOffPath}
            disabled={disabled}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              disabled ? 'bg-ink-mute' : 'bg-ink'
            }`}
            accessibilityLabel="Save as off path"
          >
            <OffPathArrow color="#FFFFFF" />
          </Pressable>
          <Text className="text-ink mt-2 text-sm">{t('path.offPath')}</Text>
        </View>
        <View className="items-center">
          <Pressable
            onPress={onSaveOnPath}
            disabled={disabled}
            className={`w-16 h-16 rounded-full items-center justify-center ${
              disabled ? 'bg-ink-mute' : 'bg-ink'
            }`}
            accessibilityLabel="Save as on path"
          >
            <OnPathArrow color="#FFFFFF" />
          </Pressable>
          <Text className="text-ink mt-2 text-sm">{t('path.onPath')}</Text>
        </View>
      </View>
    </View>
  );
}
