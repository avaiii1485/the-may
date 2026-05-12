import { ActivityIndicator, Platform, View } from 'react-native';

interface Props {
  visible: boolean;
}

export function LoadingOverlay({ visible }: Props): JSX.Element | null {
  if (!visible) return null;
  const blurStyle =
    Platform.OS === 'web'
      ? // Web: real frosted-glass via backdrop-filter
        ({ backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' } as unknown as object)
      : {};
  return (
    <View
      pointerEvents="auto"
      className="absolute inset-0 items-center justify-center"
      style={{ backgroundColor: 'rgba(255,255,255,0.6)', ...blurStyle }}
      accessibilityRole="progressbar"
      accessibilityLabel="Saving"
    >
      <View className="w-16 h-16 rounded-full bg-white items-center justify-center shadow">
        <ActivityIndicator size="large" color="#F39C3D" />
      </View>
    </View>
  );
}
