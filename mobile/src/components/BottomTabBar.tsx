// Full-width bottom navigation with labels (travel-app layout), styled with the degine.md tokens:
// cream surface, hairline top border, terracotta for the active tab, Phosphor duotone icons.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { colors, fonts, MAX_TAB_WIDTH } from '@/theme';
import { CompassIcon, HeartIcon, HouseIcon, StorefrontIcon, SuitcaseRollingIcon, type Icon } from './icons';

export const TABS: Record<string, { icon: Icon; label: string }> = {
  index: { icon: HouseIcon, label: 'Home' },
  trips: { icon: SuitcaseRollingIcon, label: 'My Trips' },
  explore: { icon: CompassIcon, label: 'Where to Go' },
  saved: { icon: HeartIcon, label: 'Wishlist' },
  host: { icon: StorefrontIcon, label: 'Be a Host' },
};

export function BottomTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {state.routes.map((route, i) => {
          const meta = TABS[route.name];
          if (!meta) return null;
          const focused = state.index === i;
          const I = meta.icon;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                const e = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => {});
                  navigateToTab(route.key);
                }
              }}
              style={({ pressed }) => [styles.item, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.indicator, focused && { backgroundColor: colors.primary }]} />
              <I size={26} weight={focused ? 'fill' : 'duotone'} color={focused ? colors.primary : colors.onSurfaceVariant} />
              <Text numberOfLines={1} style={[styles.label, { color: focused ? colors.primary : colors.onSurfaceVariant, fontFamily: focused ? fonts.sansBold : fonts.sansMedium }]}>
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderTopColor: colors.border,
    boxShadow: '0 -6px 20px rgba(45,43,38,0.06)',
  },
  row: { flexDirection: 'row', width: '100%', maxWidth: MAX_TAB_WIDTH, alignSelf: 'center' },
  item: { flex: 1, alignItems: 'center', paddingTop: 6, paddingBottom: 4, gap: 2 },
  indicator: { width: 28, height: 3, borderRadius: 2, backgroundColor: 'transparent', marginBottom: 4 },
  label: { fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
});
