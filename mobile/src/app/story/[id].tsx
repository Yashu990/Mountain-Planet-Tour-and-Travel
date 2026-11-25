import { useState } from 'react';
import { useLayoutWidth } from '@/lib/layout';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, type } from '@/theme';
import { img } from '@/lib/images';
import { notifyStoriesChanged, removeLocalStory, useStories } from '@/lib/stories';
import { tours } from '@/data/tours';
import { GlassButton, Gutter, Hairline, Kicker, Stars, TextButton } from '@/components/ui';
import { XIcon } from '@/components/icons';
import NotFound from '@/components/NotFound';

const HERO = 460;

export default function StoryViewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { stories, loading } = useStories();
  const width = useLayoutWidth();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(0);

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.surface, justifyContent: 'center' }}><ActivityIndicator color={colors.primary} /></View>;
  const story = stories.find((s) => s.id === id);
  if (!story) return <NotFound />;

  const tour = tours.find((t) => t.title === story.trip);
  const date = new Date(story.createdAt);

  const remove = () =>
    Alert.alert('Remove your story?', 'It will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeLocalStory(story.id);
          notifyStoriesChanged();
          router.back();
        },
      },
    ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ height: HERO }}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {story.photos.map((p, i) => (
              <Image key={i} source={img(p)} style={{ width, height: HERO }} contentFit="cover" accessibilityLabel={`Photo ${i + 1} from ${story.name}`} />
            ))}
          </ScrollView>
          <LinearGradient colors={['rgba(0,0,0,0.40)', 'transparent']} locations={[0, 0.4]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          {story.photos.length > 1 && (
            <View style={styles.dots} pointerEvents="none">
              {story.photos.map((_, i) => <View key={i} style={[styles.dot, i === page && styles.dotOn]} />)}
            </View>
          )}
        </View>

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 40 }]}>
          <Gutter>
            <Stars n={story.rating} size={18} />
            <Text style={[type.displayMd, { marginTop: space.md }]}>{story.name}</Text>
            {story.country ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: 4 }]}>{story.country}</Text> : null}
            <View style={{ flexDirection: 'row', gap: space.xl, marginTop: space.lg }}>
              {story.trip ? (
                <View style={{ flex: 1 }}>
                  <Kicker>Trip</Kicker>
                  <Text style={[type.headlineSm, { marginTop: 4, fontSize: 16 }]}>{story.trip}</Text>
                </View>
              ) : null}
              <View>
                <Kicker>Shared</Kicker>
                <Text style={[type.headlineSm, { marginTop: 4, fontSize: 16 }]}>{isNaN(+date) ? '—' : date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</Text>
              </View>
            </View>
            <Hairline style={{ marginTop: space.lg }} />
            <Text style={[type.headlineMd, { marginTop: space.lg, lineHeight: 30 }]}>“{story.text}”</Text>
            {tour ? <TextButton label={`View ${tour.title}`} onPress={() => { router.back(); setTimeout(() => router.push(`/tour/${tour.slug}`), 50); }} style={{ marginTop: space.lg, alignSelf: 'flex-start' }} /> : null}
            {story.pending ? <Text style={[type.bodySm, { color: colors.onSurfaceVariant, marginTop: space.lg }]}>Awaiting approval — our team usually reviews new stories within a day.</Text> : null}
            {story.mine ? <TextButton label="Remove my story" arrow={false} onPress={remove} style={{ marginTop: space.md, alignSelf: 'flex-start' }} /> : null}
          </Gutter>
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', top: insets.top + 8, right: space.gutter }}>
        <GlassButton icon={XIcon} label="Close" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { marginTop: -64, backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, borderCurve: 'continuous', paddingTop: space.xl, minHeight: 500, ...shadow.sheet },
  dots: { position: 'absolute', bottom: 84, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotOn: { width: 20, backgroundColor: '#fff' },
});
