import { Tabs } from 'expo-router';
import { Lightbulb, Plus } from 'lucide-react-native';
import { View } from 'react-native';
import { PathSquiggle } from '@/components/icons/PathSquiggle';
import { useI18n } from '@/i18n';
import { useThemeStore } from '@/stores/themeStore';

export default function TabsLayout(): JSX.Element {
  const { t } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: dark ? '#241B12' : '#FFFCF7',
          borderTopColor: dark ? '#33271A' : '#F0E2CE',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: '#D6791F',
        tabBarInactiveTintColor: dark ? '#8A7860' : '#C4A98A',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.path'),
          tabBarIcon: ({ color, focused }) => (
            <View>
              <PathSquiggle size={26} color={color} strokeWidth={focused ? 2.4 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: t('tab.insights'),
          tabBarIcon: ({ color, focused }) => (
            <Lightbulb size={26} color={color} strokeWidth={focused ? 2.4 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: t('tab.capture'),
          tabBarIcon: ({ color }) => <Plus size={28} color={color} strokeWidth={2.4} />,
        }}
      />
    </Tabs>
  );
}
