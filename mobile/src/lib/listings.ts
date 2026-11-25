// Partner listings (phase 2): a verified partner's property (a `stays` row) and its room types
// (`stay_rooms`). Photos go to the public `listing-photos` bucket under the partner's own folder.
import { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { compress } from './stories';
import type { StayRoom } from '@/data/stays';
import type { Partner } from './partners';

export type ListingStatus = 'draft' | 'pending' | 'live' | 'rejected' | 'paused';

export interface Listing {
  slug: string;
  partner_id: string;
  kind: 'hotel' | 'homestay';
  name: string;
  city: string;
  address: string;
  images: string[];
  description: string;
  amenities: string[];
  star_rating: number | null;
  free_cancellation: boolean;
  breakfast_included: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
  house_rules: string | null;
  bedrooms: number;
  beds: number;
  baths: number;
  max_guests: number;
  price_from_npr: number | null;
  status: ListingStatus;
  review_note: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export type ListingFields = Partial<Pick<Listing, 'name' | 'city' | 'address' | 'images' | 'description' | 'amenities' | 'star_rating' | 'free_cancellation' | 'check_in_time' | 'check_out_time' | 'house_rules'>>;
export type RoomFields = Partial<Pick<StayRoom, 'name' | 'description' | 'max_guests' | 'beds' | 'units' | 'price_npr' | 'breakfast_included' | 'amenities' | 'images' | 'sort_order'>>;

export const LISTING_STATUS: Record<ListingStatus, string> = {
  draft: 'Not sent yet',
  pending: 'Waiting for review',
  live: 'Live in the app',
  rejected: 'Needs changes',
  paused: 'Paused (hidden)',
};

export const PROPERTY_AMENITIES = [
  'Wi-Fi', 'Hot shower', 'Breakfast', 'Restaurant', 'Mountain view', 'Lake view', 'Garden', 'Rooftop', 'Parking',
  'Airport pickup', 'Laundry', 'Luggage storage', 'Heating', '24-hour reception', 'Power backup', 'Home-cooked meals', 'Cultural evening',
];
export const ROOM_AMENITIES = ['Attached bathroom', 'Hot shower', 'Balcony', 'Mountain view', 'Lake view', 'TV', 'Heater', 'Air conditioning', 'Kettle', 'Desk'];

const friendly = (m?: string) => (m ?? 'Something went wrong. Please try again.').replace(/^.*?ERROR:\s*/i, '');
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'stay';

/** The partner's own listing and rooms (or null if they haven't started one). */
export function useMyListing(partnerId?: string) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [rooms, setRooms] = useState<StayRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !partnerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('stays').select('*').eq('partner_id', partnerId).maybeSingle();
    setListing((data as Listing) ?? null);
    if (data) {
      const { data: r } = await supabase.from('stay_rooms').select('*').eq('stay_slug', data.slug).order('sort_order').order('created_at');
      setRooms((r as StayRoom[]) ?? []);
    } else setRooms([]);
    setLoading(false);
  }, [partnerId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading data from the server for this partner
    refresh();
  }, [refresh]);

  return { listing, rooms, loading, refresh };
}

export async function createListing(partner: Partner): Promise<Listing> {
  if (!supabase) throw new Error('Needs an internet connection.');
  const kind = partner.kind === 'homestay' ? 'homestay' : 'hotel';
  const slug = `${slugify(partner.business_name)}-${Math.random().toString(36).slice(2, 6)}`;
  const { data, error } = await supabase
    .from('stays')
    .insert({ slug, partner_id: partner.id, kind, name: partner.business_name, city: partner.city ?? '', address: partner.address ?? '', description: partner.about ?? '', images: [], amenities: [], status: 'draft', published: true, is_sample: false })
    .select('*')
    .single();
  if (error) throw new Error(friendly(error.message));
  return data as Listing;
}

export async function updateListing(slug: string, fields: ListingFields): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('stays').update(fields).eq('slug', slug);
  if (error) throw new Error(friendly(error.message));
}

/** Pick photos from the gallery, shrink them and upload; returns their public URLs. */
export async function pickAndUploadPhotos(userId: string, max: number): Promise<string[]> {
  if (!supabase) throw new Error('Needs an internet connection.');
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: Math.max(1, max), quality: 1 });
  if (res.canceled) return [];
  const urls: string[] = [];
  for (const a of res.assets.slice(0, max)) {
    const out = await compress({ uri: a.uri, width: a.width, height: a.height }, 1600, 0.8);
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const { error } = await supabase.storage.from('listing-photos').upload(path, decode(out.base64 ?? ''), { contentType: 'image/jpeg', upsert: false });
    if (error) throw new Error('Photo upload failed. Please check your connection and try again.');
    urls.push(supabase.storage.from('listing-photos').getPublicUrl(path).data.publicUrl);
  }
  return urls;
}

export async function saveRoom(staySlug: string, id: string | null, fields: RoomFields): Promise<void> {
  if (!supabase) return;
  const { error } = id
    ? await supabase.from('stay_rooms').update(fields).eq('id', id)
    : await supabase.from('stay_rooms').insert({ stay_slug: staySlug, ...fields });
  if (error) throw new Error(error.message.includes('price_npr') ? 'Please enter a price of at least Rs 100.' : friendly(error.message));
}

export async function deleteRoom(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('stay_rooms').delete().eq('id', id);
  if (error) throw new Error(friendly(error.message));
}

export async function submitListing(slug: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('submit_listing', { stay: slug });
  if (error) throw new Error(friendly(error.message));
}

export async function setListingPaused(slug: string, paused: boolean): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('set_listing_paused', { stay: slug, paused });
  if (error) throw new Error(friendly(error.message));
}

/* ---------- staff ---------- */

export async function listListings(status: ListingStatus | 'all'): Promise<(Listing & { partners: { business_name: string } | null })[]> {
  if (!supabase) return [];
  let q = supabase.from('stays').select('*, partners(business_name)').not('partner_id', 'is', null).order('submitted_at', { ascending: false, nullsFirst: false });
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw new Error(friendly(error.message));
  return (data as (Listing & { partners: { business_name: string } | null })[]) ?? [];
}

export async function getListingForStaff(slug: string): Promise<{ listing: Listing; rooms: StayRoom[] } | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('stays').select('*').eq('slug', slug).maybeSingle();
  if (!data) return null;
  const { data: r } = await supabase.from('stay_rooms').select('*').eq('stay_slug', slug).order('price_npr');
  return { listing: data as Listing, rooms: (r as StayRoom[]) ?? [] };
}

export async function reviewListing(slug: string, decision: 'live' | 'rejected' | 'paused', note?: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.rpc('review_listing', { stay: slug, decision, note: note ?? null });
  if (error) throw new Error(friendly(error.message));
}
