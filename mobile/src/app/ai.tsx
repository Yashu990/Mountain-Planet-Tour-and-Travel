import { track } from '@/lib/monitoring';
import { useCurrency } from '@/lib/currency';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius, space, squircle, type } from '@/theme';
import { respond, type AgentReply, type Prefs } from '@/lib/agentBrain';
import { supabase } from '@/lib/supabase';
import { getGuide, getTour } from '@/data/tours';
import { brand, img } from '@/lib/images';
import { Kicker } from '@/components/ui';
import { ArrowCounterClockwiseIcon, ArrowRightIcon, BookOpenIcon, PaperPlaneRightIcon, SparkleIcon, StarIcon, XIcon } from '@/components/icons';

interface Msg extends Partial<AgentReply> {
  id: number;
  role: 'user' | 'bot';
  text: string;
}

const WELCOME: Msg = {
  id: 0,
  role: 'bot',
  text: 'Namaste! 🙏 I’m **Planet AI** — Mountain Planet’s travel assistant. I can recommend trips, explain seasons, permits & altitude, and help you request a quote.',
  chips: ['Plan my trip', 'Best time to visit', 'Easy treks for beginners', '2 weeks, Everest, $1500'],
};

/** Renders **bold** segments from the assistant's replies. */
function Rich({ text }: { text: string }) {
  return (
    <Text style={[type.bodyMd, { fontSize: 15, lineHeight: 22 }]}>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? '\n' : null}
          {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') ? <Text key={j} style={{ fontFamily: fonts.sansSemi }}>{part.slice(2, -2)}</Text> : <Text key={j}>{part}</Text>,
          )}
        </Fragment>
      ))}
    </Text>
  );
}

function Typing() {
  const a = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(a, { toValue: 3, duration: 900, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return (
    <View style={[styles.bot, { flexDirection: 'row', gap: 5, paddingVertical: 16 }]}>
      {[0, 1, 2].map((i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: a.interpolate({ inputRange: [i, i + 0.5, i + 1, 3], outputRange: [0.3, 1, 0.3, 0.3], extrapolate: 'clamp' }) }]} />
      ))}
    </View>
  );
}

/** Ask the Claude-powered planet-ai function. Returns null when the backend/AI isn't available. */
async function askClaude(history: Msg[]): Promise<AgentReply | null> {
  if (!supabase) return null;
  const messages = history.slice(-12).map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
  const call = supabase.functions.invoke('planet-ai', { body: { messages } });
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 25000));
  const res = await Promise.race([call, timeout]);
  if (!res || res.error || !res.data?.reply) return null;
  const d = res.data as { reply: string; tours: string[]; guides: string[]; link: { label: string; to: string } | null; chips: string[] };
  return { text: d.reply, tours: d.tours, guides: d.guides, link: d.link ?? undefined, chips: d.chips };
}

export default function PlanetAI() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const insets = useSafeAreaInsets();
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const prefs = useRef<Prefs>({ interests: [] });
  const list = useRef<FlatList<Msg>>(null);
  const asked = useRef(false);
  const { price } = useCurrency();

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || typing) return;
    const history = [...msgs, { id: Date.now(), role: 'user' as const, text: t }];
    setMsgs(history);
    setInput('');
    setTyping(true);

    // Rule-based answer is always computed, so it can stand in if the AI is unavailable.
    const { reply: local, prefs: next } = respond(t, prefs.current);
    prefs.current = next;

    const ai = await askClaude(history.filter((m) => m.id !== 0)).catch(() => null);
    track('ai_message', { source: ai ? 'claude' : 'rules' });
    if (ai) {
      setMsgs((m) => [...m, { id: Date.now() + 1, role: 'bot', ...ai }]);
      setTyping(false);
      return;
    }
    setTimeout(() => {
      setMsgs((m) => [...m, { id: Date.now() + 1, role: 'bot', ...local }]);
      setTyping(false);
    }, 500 + Math.min(local.text.length * 3, 700));
  };

  useEffect(() => {
    if (q && !asked.current) {
      asked.current = true;
      setTimeout(() => send(q), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const reset = () => {
    prefs.current = { interests: [] };
    setMsgs([WELCOME]);
  };

  const go = (href: string) => {
    router.back();
    setTimeout(() => router.push(href as Href), 50);
  };

  const renderItem = ({ item: m, index }: { item: Msg; index: number }) =>
    m.role === 'user' ? (
      <View style={styles.user}>
        <Text style={[type.bodyMd, { color: colors.onSecondary, fontSize: 15, lineHeight: 22 }]}>{m.text}</Text>
      </View>
    ) : (
      <View style={{ maxWidth: '94%' }}>
        <View style={styles.bot}><Rich text={m.text} /></View>
        {m.tours?.length ? (
          <FlatList
            horizontal
            data={m.tours}
            keyExtractor={(s) => s}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
            renderItem={({ item: s }) => {
              const t = getTour(s);
              if (!t) return null;
              return (
                <Pressable onPress={() => go(`/tour/${s}`)} style={styles.tourCard} accessibilityRole="button" accessibilityLabel={t.title}>
                  <Image source={img(t.img)} style={{ height: 96, width: '100%' }} contentFit="cover" />
                  <View style={{ padding: 10 }}>
                    <Text style={[type.headlineSm, { fontSize: 14, lineHeight: 18 }]} numberOfLines={2}>{t.title}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={[type.bodySm, { fontSize: 12, color: colors.onSurfaceVariant }]}>{t.days}d · {price(t.price)}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        <StarIcon size={12} color={colors.primary} weight="fill" />
                        <Text style={[type.bodySm, { fontSize: 12, color: colors.onSurfaceVariant }]}>{t.rating}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        ) : null}
        {m.guides?.map((g) => {
          const gd = getGuide(g);
          return gd ? (
            <Pressable key={g} onPress={() => go(`/guide/${g}`)} style={styles.guideRow} accessibilityRole="button">
              <Image source={img(gd.img)} style={{ width: 44, height: 44, borderRadius: radius.md }} contentFit="cover" />
              <Text style={[type.labelMd, { flex: 1 }]}>{gd.title}</Text>
              <BookOpenIcon size={18} color={colors.primary} />
            </Pressable>
          ) : null;
        })}
        {m.link ? (
          <Pressable onPress={() => go(m.link!.to)} style={styles.link} accessibilityRole="button">
            <Text style={[type.labelMd, { color: colors.primary, fontFamily: fonts.sansSemi }]}>{m.link.label}</Text>
            <ArrowRightIcon size={14} color={colors.primary} />
          </Pressable>
        ) : null}
        {m.chips && index === msgs.length - 1 && !typing ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {m.chips.map((c) => (
              <Pressable key={c} onPress={() => send(c)} style={({ pressed }) => [styles.chip, pressed && { backgroundColor: colors.border }]} accessibilityRole="button">
                <Text style={type.labelMd}>{c}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 12 }]}>
        <View style={styles.avatar}>
          <Image source={brand.mark} style={{ width: 34, height: 20 }} contentFit="contain" />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={type.headlineMd}>Planet AI</Text>
            <SparkleIcon size={16} color={colors.primary} weight="fill" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Kicker style={{ fontSize: 8 }}>Powered by</Kicker>
            <Image source={brand.boticx} style={{ width: 70, height: 15 }} contentFit="contain" accessibilityLabel="Boticx Labs" />
          </View>
        </View>
        <Pressable onPress={reset} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Restart conversation">
          <ArrowCounterClockwiseIcon size={20} color={colors.onSurface} />
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn} accessibilityLabel="Close">
          <XIcon size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(m) => String(m.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: space.gutter, gap: space.md }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={typing ? <Typing /> : undefined}
        keyboardShouldPersistTaps="handled"
      />

      <View style={[styles.composer, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="e.g. 10 days, moderate, under $1200…"
          placeholderTextColor={colors.onSurfaceVariant}
          selectionColor={colors.secondary}
          style={styles.input}
          returnKeyType="send"
          onSubmitEditing={() => send(input)}
          blurOnSubmit={false}
        />
        <Pressable
          onPress={() => send(input)}
          disabled={!input.trim() || typing}
          style={[styles.send, (!input.trim() || typing) && { opacity: 0.4 }]}
          accessibilityRole="button"
          accessibilityLabel="Send"
        >
          <PaperPlaneRightIcon size={20} color={colors.onPrimary} weight="fill" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.gutter, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  user: { alignSelf: 'flex-end', maxWidth: '82%', backgroundColor: colors.secondary, borderRadius: radius.xl, borderBottomRightRadius: 6, paddingHorizontal: 16, paddingVertical: 10, ...squircle },
  bot: { alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, borderBottomLeftRadius: 6, paddingHorizontal: 16, paddingVertical: 12, ...squircle },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.onSurfaceVariant },
  tourCard: { width: 168, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surfaceAlt, ...squircle },
  guideRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, padding: 8, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, ...squircle },
  link: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(244,239,230,0.5)' },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: space.gutter, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, height: 52, borderRadius: radius.full, backgroundColor: colors.surfaceAlt, paddingHorizontal: 20, fontFamily: fonts.sans, fontSize: 15, color: colors.onSurface },
  send: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
