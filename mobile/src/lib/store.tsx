import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Share, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadow } from '@/theme';
import { CheckIcon } from '@/components/icons';
import { useAuth } from './auth';
import { supabase } from './supabase';

interface StoreCtx {
  saved: string[];
  isSaved: (slug: string) => boolean;
  toggleSave: (slug: string) => void;
  toast: (msg: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);
const KEY = 'mpn-saved';
export const WEBSITE = 'https://mountainplanetnepal.com';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<string[]>([]);
  const savedRef = useRef<string[]>([]);
  useEffect(() => {
    savedRef.current = saved;
  }, [saved]);
  const [hydrated, setHydrated] = useState(false);
  const { user } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);
  const anim = useState(() => new Animated.Value(0))[0];
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v) setSaved(JSON.parse(v));
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(KEY, JSON.stringify(saved)).catch(() => {});
  }, [saved, hydrated]);

  const toast = useCallback(
    (m: string) => {
      if (timer.current) clearTimeout(timer.current);
      setMsg(m);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
      timer.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setMsg(null));
      }, 2200);
    },
    [anim],
  );

  // Signed in: merge this phone's board with the account's, then keep them in sync.
  const userId = user?.id;
  // Signed out: clear the phone's copy (it stays in the account), so the next person who signs in
  // on this phone doesn't inherit — and sync into their own account — someone else's saved trips.
  const prevUser = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (prevUser.current && !userId) {
      setSaved([]);
    }
    prevUser.current = userId;
  }, [userId]);
  useEffect(() => {
    if (!supabase || !userId || !hydrated) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('saved_trips').select('tour_slug, created_at').order('created_at', { ascending: false });
      if (error || !alive) return;
      const remote = (data ?? []).map((r) => r.tour_slug as string);
      const local = savedRef.current;
      const onlyLocal = local.filter((s) => !remote.includes(s));
      if (onlyLocal.length) {
        await supabase.from('saved_trips').upsert(onlyLocal.map((tour_slug) => ({ user_id: userId, tour_slug })), { ignoreDuplicates: true });
      }
      if (alive) setSaved([...local, ...remote.filter((s) => !local.includes(s))]);
    })().catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId, hydrated]);

  const toggleSave = useCallback(
    (slug: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      const has = savedRef.current.includes(slug);
      toast(has ? 'Removed from your board' : 'Saved to your Himalaya board');
      setSaved((s) => (has ? s.filter((x) => x !== slug) : [slug, ...s.filter((x) => x !== slug)]));
      if (supabase && userId) {
        const q = has
          ? supabase.from('saved_trips').delete().eq('user_id', userId).eq('tour_slug', slug)
          : supabase.from('saved_trips').upsert({ user_id: userId, tour_slug: slug }, { ignoreDuplicates: true });
        Promise.resolve(q).catch(() => {});
      }
    },
    [toast, userId],
  );

  return (
    <Ctx.Provider value={{ saved, isSaved: (s) => saved.includes(s), toggleSave, toast }}>
      {children}
      {msg && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            { bottom: insets.bottom + 108, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] },
          ]}
        >
          <View style={styles.toast}>
            <CheckIcon size={16} color={colors.accent} weight="bold" />
            <Text style={styles.toastText}>{msg}</Text>
          </View>
        </Animated.View>
      )}
    </Ctx.Provider>
  );
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

/** Open Planet AI, optionally sending a first question. */
export function askAgent(q?: string) {
  router.push(q ? { pathname: '/ai', params: { q } } : '/ai');
}

export async function shareLink(path: string, title: string) {
  try {
    await Share.share({ title, message: `${title} · Mountain Planet Nepal\n${WEBSITE}${path}` });
  } catch {
    /* dismissed */
  }
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.onSurface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.full,
    ...shadow.glass,
  },
  toastText: { color: colors.surface, fontFamily: fonts.sansMedium, fontSize: 14 },
});
