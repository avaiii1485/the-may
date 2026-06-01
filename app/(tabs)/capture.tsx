import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { ImageIcon, Type, X, Zap, ZapOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '@/i18n';
import { useCaptureDraftStore } from '@/stores/captureDraftStore';

export default function CaptureScreen(): JSX.Element {
  const { t } = useI18n();
  const setPhotoUri = useCaptureDraftStore((s) => s.setPhotoUri);
  const reset = useCaptureDraftStore((s) => s.reset);
  const [flash, setFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  const granted = permission?.granted === true;

  // Ask once when the camera hasn't been decided yet.
  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const goToForm = useCallback(
    (uri: string) => {
      reset();
      setPhotoUri(uri);
      router.push('/capture-form');
    },
    [reset, setPhotoUri],
  );

  const takePhoto = useCallback(async () => {
    if (!granted) {
      void requestPermission();
      return;
    }
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) goToForm(photo.uri);
    } catch {
      // ignore capture failure
    } finally {
      setBusy(false);
    }
  }, [granted, busy, goToForm, requestPermission]);

  const importPhoto = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) goToForm(result.assets[0].uri);
  }, [goToForm]);

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
        <Text className="text-white text-lg font-semibold">{t('capture.addPhoto')}</Text>
        <Pressable
          onPress={() => setFlash((f) => !f)}
          className="w-10 h-10 items-center justify-center"
          accessibilityLabel="Toggle flash"
        >
          {flash ? <Zap size={22} color="#F4C04C" /> : <ZapOff size={22} color="#FFFFFF" />}
        </Pressable>
      </View>

      {/* Square frame holding the live camera */}
      <View className="flex-1 items-center justify-center px-4">
        <View className="aspect-square w-full max-w-[420px] rounded-2xl overflow-hidden border border-white/30 bg-black/40 items-center justify-center">
          {granted && isFocused ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="back"
              enableTorch={flash}
            />
          ) : granted ? (
            <View className="flex-1" />
          ) : (
            <View className="items-center px-6">
              <Text className="text-white/70 text-center mb-4">
                {t('capture.cameraPermission')}
              </Text>
              <Pressable
                onPress={() => requestPermission()}
                className="px-5 py-2 rounded-full bg-white"
                accessibilityRole="button"
                accessibilityLabel={t('capture.allowCamera')}
              >
                <Text className="text-ink font-bold">{t('capture.allowCamera')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-around px-6 pb-6 pt-4">
        <Pressable
          onPress={launchTextOnly}
          className="items-center w-20"
          accessibilityLabel="Add meal via text"
        >
          <Type size={26} color="#FFFFFF" />
          <Text className="text-white text-xs mt-1">{t('capture.viaText')}</Text>
        </Pressable>
        <Pressable
          onPress={takePhoto}
          disabled={busy}
          className="w-20 h-20 rounded-full bg-white items-center justify-center border-4 border-white/40"
          style={{ opacity: busy ? 0.6 : 1 }}
          accessibilityLabel="Take photo"
        />
        <Pressable
          onPress={importPhoto}
          className="items-center w-20"
          accessibilityLabel="Import photo"
        >
          <ImageIcon size={26} color="#FFFFFF" />
          <Text className="text-white text-xs mt-1">{t('capture.import')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
