import { useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
  title: string;
  children: ReactNode;
  variant?: 'default' | 'highlight';
  leftAdornment?: ReactNode;
  defaultOpen?: boolean;
  /** If true, the card renders without a toggle — always expanded, no chevron. */
  alwaysOpen?: boolean;
}

// A card that shows just its title + a chevron handle until tapped.
// Tap toggles open/closed. All cards automatically collapse when the
// screen loses focus (tab switch / navigation away).
export function CollapsibleCard({
  title,
  children,
  variant = 'default',
  leftAdornment,
  defaultOpen = false,
  alwaysOpen = false,
}: Props): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (!alwaysOpen) setOpen(false);
      };
    }, [alwaysOpen]),
  );

  const bgClass = variant === 'highlight' ? 'bg-path-soft' : 'bg-bg-card';
  const titleClass = variant === 'highlight' ? 'text-path-dark' : 'text-ink';

  if (alwaysOpen) {
    return (
      <View className={`${bgClass} rounded-2xl mb-3 p-4`}>
        <View className="flex-row items-center mb-3">
          {leftAdornment ? <View style={{ marginRight: 10 }}>{leftAdornment}</View> : null}
          <Text
            className={`${titleClass} text-xs uppercase tracking-widest font-bold flex-1`}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {children}
      </View>
    );
  }

  return (
    <View className={`${bgClass} rounded-2xl mb-3 overflow-hidden`}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="flex-row items-center justify-between p-4"
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <View className="flex-row items-center flex-1">
          {leftAdornment ? <View style={{ marginRight: 10 }}>{leftAdornment}</View> : null}
          <Text
            className={`${titleClass} text-xs uppercase tracking-widest font-bold flex-1`}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        {open ? (
          <ChevronUp size={18} color="#94A3B8" />
        ) : (
          <ChevronDown size={18} color="#94A3B8" />
        )}
      </Pressable>
      {open ? <View className="px-4 pb-4">{children}</View> : null}
    </View>
  );
}
