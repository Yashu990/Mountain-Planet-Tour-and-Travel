import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { colors, radius, shadow } from '@/theme';
import { BookmarkSimpleIcon, BookOpenTextIcon, CompassIcon, HouseIcon, type Icon } from './icons';

const ICONS: Record<string, { icon: Icon; label: string }> = {
  index: { icon: HouseIcon, label: 'Home' },
  explore: { icon: CompassIcon, label: 'Explore' },
  stories: { icon: BookOpenTextIcon, label: 'Traveller stories' },
  saved: { icon: BookmarkSimpleIcon, label: 'Saved' },
};

/**
 * degine.md tab-bar: a 260×64 translucent cream pill floating above the bottom edge,
 * four duotone Phosphor icons, no labels — colour alone shows the active tab.
 */
export function FloatingTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const ios = Platform.OS === 'ios';
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: Math.max(insets.bottom, 12) + 8 }]}>
      <View style={styles.shadow}>
        {/* BlurView ignores borderRadius, so the pill clips it with overflow: hidden. */}
        <View style={[styles.bar, !ios && { backgroundColor: 'rgba(253,252,248,0.97)' }]}>
          {ios ? <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} /> : null}
          {ios ? <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(253,252,248,0.85)' }]} /> : null}
          {state.routes.map((route, i) => {
            const meta = ICONS[route.name];
            if (!meta) return null;
            const focused = state.index === i;
            const I = meta.icon;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={meta.label}
                accessibilityState={{ selected: focused }}
                hitSlop={8}
                onPress={() => {
                  const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                  if (!focused && !e.defaultPrevented) {
                    Haptics.selectionAsync().catch(() => {});
                    navigateToTab(route.key);
                  }
                }}
                style={({ pressed }) => [styles.item, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
              >
                <I size={28} weight="duotone" color={focused ? colors.primary : colors.onSurfaceVariant} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  shadow: { borderRadius: radius.full, ...shadow.tabBar },
  bar: {
    width: 260,
    height: 64,
    borderRadius: radius.full,
    overflow: 'hidden',
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  item: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
});
