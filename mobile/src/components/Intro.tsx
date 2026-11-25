import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, introPlaces } from '@/lib/images';
import { colors, fonts, radius, type } from '@/theme';

// Timeline in seconds. Places fly in → orbit → merge into a glow → the logo appears.
const T = 7.2;
const s = (sec: number) => sec / T;

const rand = (i: number) => {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

/**
 * Launch intro, ported from the website's Intro: the places of Nepal orbit as little planets,
 * merge into a warm core, and the Mountain Planet logo is revealed. Plays on every launch; skippable.
 */
export function Intro({ onDone }: { onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const t = useState(() => new Animated.Value(0))[0];
  const out = useState(() => new Animated.Value(1))[0];
  const finished = useRef(false);

  const minSide = Math.min(width, height);
  const orbitR = minSide * 0.36;
  const far = Math.max(width, height) * 0.75;
  const planet = Math.round(Math.max(52, Math.min(80, minSide * 0.15)));
  const logoW = Math.min(width * 0.78, 420);
  const logoH = logoW / (1100 / 725);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(out, { toValue: 0, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start(() => onDone());
  };

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((calm) => {
      if (!alive) return;
      if (calm) {
        t.setValue(s(5.0));
        Animated.timing(t, { toValue: s(6.2), duration: 900, useNativeDriver: true }).start(() => setTimeout(finish, 600));
      } else {
        Animated.timing(t, { toValue: 1, duration: T * 1000, easing: Easing.linear, useNativeDriver: true }).start(({ finished: f }) => f && finish());
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stars = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ x: rand(i) * width, y: rand(i + 500) * height, r: rand(i + 900) * 1.8 + 0.6, o: 0.25 + rand(i + 1300) * 0.6 })), [width, height]);

  const n = introPlaces.length;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: out, zIndex: 1000 }]}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1D3557', '#13233A', '#070D18', '#03060C']} locations={[0, 0.35, 0.75, 1]} start={{ x: 0.5, y: 0.35 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />

      {/* starfield */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t.interpolate({ inputRange: [0, s(0.8)], outputRange: [0, 1], extrapolate: 'clamp' }) }]}>
        {stars.map((st, i) => (
          <View key={i} style={{ position: 'absolute', left: st.x, top: st.y, width: st.r, height: st.r, borderRadius: st.r, backgroundColor: '#fff', opacity: st.o }} />
        ))}
      </Animated.View>

      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {/* orbit ring */}
        <Animated.View
          style={{
            position: 'absolute',
            width: orbitR * 2,
            height: orbitR * 2,
            borderRadius: orbitR,
            borderWidth: 1,
            borderColor: 'rgba(232,162,74,0.35)',
            opacity: t.interpolate({ inputRange: [s(1.2), s(1.9), s(3.4), s(4.1)], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }),
            transform: [{ scale: t.interpolate({ inputRange: [s(1.2), s(1.9), s(3.4), s(4.1)], outputRange: [0.6, 1, 1, 0.2], extrapolate: 'clamp' }) }],
          }}
        />

        {/* the places of Nepal, orbiting then merging */}
        {introPlaces.map((p, i) => {
          const slot = (i / n) * 360;
          const d0 = rand(i + 3) * 0.7;
          const entry = slot - 140 - rand(i + 7) * 60;
          const rotIn = [s(d0), s(1.7 + d0 * 0.3), s(3.4), s(4.2)];
          const rot = t.interpolate({ inputRange: [0, ...rotIn], outputRange: [entry, entry, slot, slot + 120, slot + 230].map((d) => `${d}deg`), extrapolate: 'clamp' });
          const unrot = t.interpolate({ inputRange: [0, ...rotIn], outputRange: [entry, entry, slot, slot + 120, slot + 230].map((d) => `${-d}deg`), extrapolate: 'clamp' });
          const r = t.interpolate({ inputRange: [0, ...rotIn], outputRange: [far, far, orbitR, orbitR * 0.92, 0], extrapolate: 'clamp' });
          const op = t.interpolate({ inputRange: [s(d0), s(d0 + 0.5), s(3.9), s(4.2)], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
          const sc = t.interpolate({ inputRange: [s(d0), s(1.8), s(3.4), s(4.2)], outputRange: [0.45, 1, 1, 0.1], extrapolate: 'clamp' });
          const labelOp = t.interpolate({ inputRange: [s(1.8), s(2.2), s(3.0), s(3.3)], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' });
          return (
            <Animated.View key={p.name} style={{ position: 'absolute', opacity: op, transform: [{ rotate: rot }, { translateX: r }, { rotate: unrot }, { scale: sc }] }}>
              <View style={{ width: planet, height: planet, borderRadius: planet / 2, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(232,162,74,0.75)', boxShadow: '0 0 24px rgba(232,162,74,0.55)' }}>
                <Image source={p.src} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['rgba(255,255,255,0.35)', 'transparent', 'rgba(0,0,0,0.55)']} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.85, y: 0.95 }} style={StyleSheet.absoluteFill} />
              </View>
              <Animated.Text style={[styles.placeLabel, { opacity: labelOp, width: planet * 2, left: -planet / 2 }]}>{p.name}</Animated.Text>
            </Animated.View>
          );
        })}

        {/* glowing core + shockwave */}
        <Animated.View
          style={{
            position: 'absolute',
            width: minSide * 0.5,
            height: minSide * 0.5,
            borderRadius: minSide,
            backgroundColor: 'rgba(255,224,170,0.9)',
            boxShadow: '0 0 80px 40px rgba(232,162,74,0.55)',
            opacity: t.interpolate({ inputRange: [s(3.8), s(4.3), s(4.9), s(5.4)], outputRange: [0, 0.9, 0.75, 0], extrapolate: 'clamp' }),
            transform: [{ scale: t.interpolate({ inputRange: [s(3.8), s(4.3), s(4.9), s(5.4)], outputRange: [0, 0.55, 0.45, 1.4], extrapolate: 'clamp' }) }],
          }}
        />
        <Animated.View
          style={{
            position: 'absolute',
            width: minSide * 0.5,
            height: minSide * 0.5,
            borderRadius: minSide,
            borderWidth: 2,
            borderColor: 'rgba(232,162,74,0.8)',
            opacity: t.interpolate({ inputRange: [s(4.9), s(5.0), s(6.1)], outputRange: [0, 0.9, 0], extrapolate: 'clamp' }),
            transform: [{ scale: t.interpolate({ inputRange: [s(4.9), s(6.1)], outputRange: [0.3, 2.8], extrapolate: 'clamp' }) }],
          }}
        />

        {/* the logo + welcome */}
        <Animated.View
          style={{
            alignItems: 'center',
            opacity: t.interpolate({ inputRange: [s(4.8), s(5.5)], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ scale: t.interpolate({ inputRange: [s(4.8), s(5.7)], outputRange: [0.82, 1], extrapolate: 'clamp' }) }],
          }}
        >
          <Image source={brand.full} style={{ width: logoW, height: logoH }} contentFit="contain" accessibilityLabel="Mountain Planet — Heaven is a myth, Himalayas are real" />
        </Animated.View>
        <Animated.Text
          style={[
            styles.welcome,
            {
              opacity: t.interpolate({ inputRange: [s(5.8), s(6.4)], outputRange: [0, 1], extrapolate: 'clamp' }),
              transform: [{ translateY: t.interpolate({ inputRange: [s(5.8), s(6.4)], outputRange: [12, 0], extrapolate: 'clamp' }) }],
            },
          ]}
        >
          Welcome to Mountain Planet
        </Animated.Text>
        <Animated.View style={[styles.flagLine, { transform: [{ scaleX: t.interpolate({ inputRange: [s(6.0), s(7.0)], outputRange: [0, 1], extrapolate: 'clamp' }) }] }]} />
      </View>

      <Pressable onPress={finish} style={[styles.skip, { bottom: insets.bottom + 28 }]} accessibilityRole="button" accessibilityLabel="Skip intro" hitSlop={10}>
        <Text style={[type.labelMd, { color: 'rgba(255,255,255,0.75)' }]}>Skip intro</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  placeLabel: { position: 'absolute', top: '100%', marginTop: 6, textAlign: 'center', fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#E8A24A' },
  welcome: { marginTop: 18, fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, letterSpacing: -0.4, color: colors.surface, textAlign: 'center' },
  flagLine: { marginTop: 18, width: 180, height: 3, borderRadius: radius.full, backgroundColor: colors.primary },
  skip: { position: 'absolute', alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
});
