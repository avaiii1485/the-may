import { Pressable, Text, View } from 'react-native';
import { OffPathArrow, OnPathArrow } from '@/components/icons/OnPathArrow';

interface Props {
  onSaveOnPath: () => void;
  onSaveOffPath: () => void;
  disabled: boolean;
}

export function SaveAsBar({ onSaveOnPath, onSaveOffPath, disabled }: Props): JSX.Element {
  return (
    <View className="border-t border-slate-200 bg-white px-6 pt-4 pb-6">
      <Text className="text-center text-ink-soft mb-3">Save meal as...</Text>
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
          <Text className="text-ink mt-2 text-sm">Off-path</Text>
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
          <Text className="text-ink mt-2 text-sm">On-path</Text>
        </View>
      </View>
    </View>
  );
}
