import { type ReactNode, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space } from '@/theme';
import { img } from '@/lib/images';
import { GlassButton } from './ui';
import { ArrowLeftIcon, type Icon } from './icons';

const HERO = 450;

/**
 * Detail screen: full-bleed 450px hero photo, glass top-bar buttons, and the signature
 * cream sheet curling up over the image (40px top radius, 64px overlap, soft upward shadow).
 */
export function DetailLayout({
  image,
  imageLabel,
  actions,
  children,
  footer,
  footerHeight = 0,
}: {
  image: string;
  imageLabel: string;
  actions?: { icon: Icon; label: string; onPress: () => void; active?: boolean }[];
  children: ReactNode;
  footer?: ReactNode;
  footerHeight?: number;
}) {
  const insets = useSafeAreaInsets();
  const y = useState(() => new Animated.Value(0))[0];
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      {/* parallax hero sits behind the scroll content */}
      <Animated.View
        style={[
          styles.hero,
          {
            transform: [
              { translateY: y.interpolate({ inputRange: [0, HERO], outputRange: [0, -HERO * 0.4], extrapolate: 'clamp' }) },
              { scale: y.interpolate({ inputRange: [-200, 0], outputRange: [1.5, 1], extrapolate: 'clamp' }) },
            ],
          },
        ]}
      >
        <Image source={img(image)} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} accessibilityLabel={imageLabel} />
        <LinearGradient colors={['rgba(0,0,0,0.40)', 'transparent']} locations={[0, 0.45]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true })}
        contentContainerStyle={{ paddingTop: HERO - 64 }}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 40 + footerHeight }]}>{children}</View>
      </Animated.ScrollView>

      {/* floating top bar */}
      <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
        <GlassButton icon={ArrowLeftIcon} label="Back" onPress={back} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {actions?.map((a) => <GlassButton key={a.label} icon={a.icon} label={a.label} onPress={a.onPress} active={a.active} />)}
        </View>
      </View>

      {footer ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO, backgroundColor: colors.surfaceAlt },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderCurve: 'continuous',
    paddingTop: space.xl,
    minHeight: 600,
    ...shadow.sheet,
  },
  topBar: { position: 'absolute', left: space.gutter, right: space.gutter, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space.gutter,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
