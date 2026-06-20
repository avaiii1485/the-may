import { useFocusEffect } from 'expo-router';
import { ChevronDown, ChevronUp, MoreHorizontal, Pin, PinOff } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useI18n } from '@/i18n';
import { usePinnedInsightsStore } from '@/stores/pinnedInsightsStore';
import { useThemeStore } from '@/stores/themeStore';

interface Props {
  id: string;
  title: string;
  children: ReactNode;
  variant?: 'default' | 'highlight';
  leftAdornment?: ReactNode;
  defaultOpen?: boolean;
  /** Long-press on the title starts a drag (used by the sortable Insights list). */
  onLongPress?: () => void;
}

// A card that shows just its title + chevron until tapped. A three-dots menu
// offers Pin / Unpin. Pinned cards are hoisted to the top by the parent list,
// open by default, and are NOT auto-collapsed on tab blur (they only close
// when the user closes them). Unpinned cards collapse when the screen blurs.
export function CollapsibleCard({
  id,
  title,
  children,
  variant = 'default',
  leftAdornment,
  defaultOpen = false,
  onLongPress,
}: Props): JSX.Element {
  const { t, isRTL } = useI18n();
  const dark = useThemeStore((s) => s.mode) === 'dark';
  const pinned = usePinnedInsightsStore((s) => s.pinned.includes(id));
  const togglePin = usePinnedInsightsStore((s) => s.toggle);

  const [open, setOpen] = useState(pinned || defaultOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const wasPinned = useRef(pinned);

  // When a card becomes pinned, force it open.
  useEffect(() => {
    if (pinned && !wasPinned.current) setOpen(true);
    wasPinned.current = pinned;
  }, [pinned]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setMenuOpen(false);
        if (!pinned) setOpen(false);
      };
    }, [pinned]),
  );

  const bgClass = variant === 'highlight' ? 'bg-path-soft' : 'bg-bg-card';
  const titleClass = variant === 'highlight' ? 'text-path-dark' : 'text-ink';

  return (
    <View className={`${bgClass} rounded-2xl mb-3`} style={{ position: 'relative' }}>
      <View className="flex-row items-center p-4">
        <Pressable
          onPress={() => setOpen((o) => !o)}
          onLongPress={onLongPress}
          delayLongPress={250}
          className="flex-row items-center flex-1"
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityLabel={title}
        >
          {leftAdornment ? (
            <View style={isRTL ? { marginLeft: 12 } : { marginRight: 10 }}>{leftAdornment}</View>
          ) : null}
          <Text
            className={`${titleClass} text-xs uppercase tracking-widest font-bold flex-1`}
            numberOfLines={1}
          >
            {title}
          </Text>
          {pinned ? (
            <View style={{ marginLeft: 6 }}>
              <Pin size={12} color="#D6791F" />
            </View>
          ) : null}
        </Pressable>

        <Pressable
          onPress={() => setMenuOpen((m) => !m)}
          className="w-8 h-8 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={`${title} options`}
          hitSlop={6}
        >
          <MoreHorizontal size={18} color={dark ? '#8A7860' : '#94A3B8'} />
        </Pressable>

        <Pressable
          onPress={() => setOpen((o) => !o)}
          className="w-7 h-7 items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel={open ? 'Collapse' : 'Expand'}
        >
          {open ? (
            <ChevronUp size={18} color={dark ? '#8A7860' : '#94A3B8'} />
          ) : (
            <ChevronDown size={18} color={dark ? '#8A7860' : '#94A3B8'} />
          )}
        </Pressable>
      </View>

      {open ? <View className="px-4 pb-4">{children}</View> : null}

      {menuOpen ? (
        <>
          {/* Tap-outside backdrop to dismiss the dropdown. */}
          <Pressable
            onPress={() => setMenuOpen(false)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
            accessibilityLabel={t('common.close')}
          />
          <View
            style={{
              position: 'absolute',
              top: 44,
              ...(isRTL ? { left: 8 } : { right: 8 }),
              zIndex: 30,
              minWidth: 140,
              backgroundColor: dark ? '#241B12' : '#FFFFFF',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: dark ? '#33271A' : '#E2E8F0',
              shadowColor: '#0F172A',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={() => {
                togglePin(id);
                setMenuOpen(false);
              }}
              className="flex-row items-center px-4 py-3"
              accessibilityRole="button"
              accessibilityLabel={pinned ? t('ins.unpin') : t('ins.pin')}
            >
              {pinned ? (
                <PinOff size={16} color={dark ? '#D2C3AF' : '#0F172A'} />
              ) : (
                <Pin size={16} color={dark ? '#D2C3AF' : '#0F172A'} />
              )}
              <Text className="text-ink font-semibold ml-3">
                {pinned ? t('ins.unpin') : t('ins.pin')}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </View>
  );
}
