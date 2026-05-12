import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ImageIcon, Type, X, Zap, ZapOff } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCaptureDraftStore } from '@/stores/captureDraftStore';

export default function CaptureScreen(): JSX.Element {
  const setPhotoUri = useCaptureDraftStore((s) => s.setPhotoUri);
  const reset = useCaptureDraftStore((s) => s.reset);
  const [flash, setFlash] = useState(false);

  const launchPicker = useCallback(
    async (source: 'camera' | 'library') => {
      reset();
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      };
      const result =
        source === 'camera' && Platform.OS !== 'web'
          ? await ImagePicker.launchCameraAsync(opts)
          : await ImagePicker.launchImageLibraryAsync(opts);
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        router.push('/capture-form');
      }
    },
    [reset, setPhotoUri],
  );

  const launchTextOnly = useCallback(() => {
    reset();
    setPhotoUri(null);
    router.push('/text-meal');
  }, [reset, setPhotoUri]);

  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Close"
        >
          <X size={26} color="#FFFFFF" />
        </Pressable>
        <Text className="text-white text-lg font-semibold">Add meal photo</Text>
        <Pressable
          onPress={() => setFlash((f) => !f)}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Toggle flash"
        >
          {flash ? <Zap size={22} color="#F4C04C" /> : <ZapOff size={22} color="#FFFFFF" />}
        </Pressable>
      </View>

      {/* Square frame */}
      <View className="flex-1 items-center justify-center px-4">
        <View
          className="aspect-square w-full max-w-[420px] rounded-2xl border border-white/30 bg-black/40 items-center justify-center"
        >
          <Text className="text-white/70 text-center px-6">
            {Platform.OS === 'web'
              ? 'Tap the shutter or import a photo'
              : 'Camera preview here on device'}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-around px-6 pb-6 pt-4">
        <Pressable
          onPress={launchTextOnly}
          className="items-center w-20"
          accessibilityLabel="Add meal via text"
        >
          <Type size={26} color="#FFFFFF" />
          <Text className="text-white text-xs mt-1">meal via text</Text>
        </Pressable>
        <Pressable
          onPress={() => launchPicker('camera')}
          className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-white/40"
          accessibilityLabel="Take photo"
        />
        <Pressable
          onPress={() => launchPicker('library')}
          className="items-center w-20"
          accessibilityLabel="Import photo"
        >
          <ImageIcon size={26} color="#FFFFFF" />
          <Text className="text-white text-xs mt-1">import photo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
