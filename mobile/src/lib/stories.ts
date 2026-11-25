// Traveller stories: customers share their experience + photos.
//
//  1. With the backend (mobile/.env set): photos go to the `story-photos` bucket and the story to the
//     `stories` table. It appears for everyone once approved in Supabase (Table Editor → stories).
//  2. Without the backend: stories are kept on this phone only.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { backendEnabled, supabase } from './supabase';

export interface Story {
  id: string;
  name: string;
  country: string;
  trip: string;
  rating: number;
  text: string;
  photos: string[];
  createdAt: string;
  mine?: boolean;
  pending?: boolean;
}

export interface StoryInput {
  name: string;
  country: string;
  trip: string;
  rating: number;
  text: string;
}

export interface PickedPhoto { uri: string; width: number; height: number }

const BUCKET = 'story-photos';
const LOCAL_KEY = 'mpn-stories';

export const sharedStorage = backendEnabled;
export const MAX_PHOTOS = 6;

// The company's existing testimonials, shown alongside customer uploads.
const featured: Story[] = [
  { id: 'f-sophie', name: 'Sophie L.', country: 'Lyon, France', trip: 'Everest Base Camp Trek', rating: 5, photos: ['/img/ebc.jpg', '/img/amadablam.jpg', '/img/bridge.jpg'], createdAt: '2025-10-20', text: 'Our guide Pasang felt like family by Namche. Every detail — permits, flights, lodges — was handled perfectly. Standing at Kala Patthar at sunrise was unreal.' },
  { id: 'f-daniel', name: 'Daniel & Mei', country: 'Singapore', trip: 'Annapurna Base Camp Trek', rating: 5, photos: ['/img/annapurna.jpg', '/img/poonhill.jpg'], createdAt: '2025-04-12', text: 'Tailored the pace for us as first-time trekkers. Hot springs on the way down were the cherry on top. Already planning Manaslu!' },
  { id: 'f-rahul', name: 'Rahul S.', country: 'Mumbai, India', trip: 'Chitwan Jungle Safari', rating: 5, photos: ['/img/chitwan.jpg'], createdAt: '2025-02-02', text: 'Smooth transfer from Kathmandu to Chitwan and a jungle safari we will never forget. Highly professional team.' },
];

const shortId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

/** The `stories.id` column is a uuid, so shared mode needs a v4-shaped id. */
function uuid() {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  const h = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) s += '-';
    else if (i === 14) s += '4';
    else if (i === 19) s += h[(Math.random() * 4) | 8];
    else s += h[(Math.random() * 16) | 0];
  }
  return s;
}

async function readLocal(): Promise<Story[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(LOCAL_KEY)) || '[]');
  } catch {
    return [];
  }
}

interface Row { id: string; created_at: string; name: string; country: string | null; trip: string | null; rating: number | null; story: string; photos: string[] | null; approved: boolean }

const fromRow = (r: Row): Story => ({ id: r.id, name: r.name, country: r.country ?? '', trip: r.trip ?? '', rating: r.rating ?? 5, text: r.story, photos: r.photos ?? [], createdAt: r.created_at });

export async function fetchStories(): Promise<Story[]> {
  const mine = (await readLocal()).map((s) => ({ ...s, mine: true }));
  if (!supabase) return [...mine, ...featured];
  try {
    // RLS returns approved stories, plus the signed-in author's own pending ones.
    const { data, error } = await supabase.from('stories').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    const remote = rows.map((r) => ({ ...fromRow(r), mine: mine.some((m) => m.id === r.id) || undefined, pending: !r.approved || undefined }));
    // Copies of this phone's posts that the server doesn't show yet are awaiting approval.
    const pending = mine.filter((m) => !remote.some((r) => r.id === m.id)).map((m) => ({ ...m, pending: true }));
    return [...pending, ...remote, ...featured];
  } catch {
    return [...mine, ...featured];
  }
}

/** Resize (never upscale) + re-encode a photo on the device so uploads stay small and fast. */
export async function compress(p: PickedPhoto, maxSide: number, quality: number) {
  const ctx = ImageManipulator.manipulate(p.uri);
  const scale = p.width && p.height ? Math.min(1, maxSide / Math.max(p.width, p.height)) : 1;
  if (scale < 1) ctx.resize({ width: Math.round(p.width * scale), height: Math.round(p.height * scale) });
  const image = await ctx.renderAsync();
  return image.saveAsync({ format: SaveFormat.JPEG, compress: quality, base64: true });
}

/** Returns 'published' (visible now, on this phone) or 'pending' (waiting for team approval). */
export async function submitStory(input: StoryInput, picked: PickedPhoto[]): Promise<'published' | 'pending'> {
  const createdAt = new Date().toISOString();

  if (!supabase) {
    const photos: string[] = [];
    for (const p of picked) photos.push(`data:image/jpeg;base64,${(await compress(p, 1100, 0.72)).base64}`);
    const story: Story = { id: shortId(), createdAt, photos, ...input };
    try {
      await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([story, ...(await readLocal())]));
    } catch {
      throw new Error('Phone storage is full. Try fewer photos.');
    }
    return 'published';
  }

  const id = uuid();
  const photos: string[] = [];
  for (const p of picked) {
    const out = await compress(p, 1800, 0.82);
    const path = `${createdAt.slice(0, 10)}/${shortId()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, decode(out.base64 ?? ''), { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error('Photo upload failed. Please check your connection and try again.');
    photos.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
  }

  const { data: auth } = await supabase.auth.getSession();
  const { error } = await supabase.from('stories').insert({
    id,
    user_id: auth.session?.user.id ?? null,
    name: input.name,
    country: input.country,
    trip: input.trip,
    rating: input.rating,
    story: input.text,
    photos,
  });
  if (error) throw new Error('Could not save your story. Please try again.');

  // Keep a copy so the author sees their post (marked "awaiting approval").
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify([{ id, createdAt, photos, ...input }, ...(await readLocal())].slice(0, 20)));
  } catch {
    /* not critical */
  }
  return 'pending';
}

export async function removeLocalStory(id: string) {
  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify((await readLocal()).filter((s) => s.id !== id)));
  // Signed-in authors can also delete it from the server (RLS: own stories only).
  if (supabase) await supabase.from('stories').delete().eq('id', id);
}

// Simple in-app event so every screen refreshes after a new story.
const listeners = new Set<() => void>();
export const notifyStoriesChanged = () => listeners.forEach((l) => l());

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    setStories(await fetchStories());
    setLoading(false);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from storage / network
    reload();
    listeners.add(reload);
    return () => {
      listeners.delete(reload);
    };
  }, [reload]);
  return { stories, loading, reload };
}
