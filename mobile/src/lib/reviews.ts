// Traveller reviews for tours and stays. New reviews are hidden until staff approve them.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export interface Review { id: string; name: string; country: string | null; rating: number; text: string; created_at: string; approved: boolean }

export function useReviews(target: { tour?: string; stay?: string }) {
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!!supabase);
  const load = useCallback(async () => {
    if (!supabase || (!target.tour && !target.stay)) return setLoading(false);
    let q = supabase.from('reviews').select('id, name, country, rating, text, created_at, approved').order('created_at', { ascending: false }).limit(30);
    q = target.tour ? q.eq('tour_slug', target.tour) : q.eq('stay_slug', target.stay!);
    const { data } = await q;
    setItems((data ?? []) as Review[]);
    setLoading(false);
  }, [target.tour, target.stay]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from the network
    load();
  }, [load]);
  return { items, loading, reload: load };
}

export async function submitReview(input: { tour?: string; stay?: string; name: string; country?: string; rating: number; text: string }) {
  if (!supabase) throw new Error('Reviews need the app to be connected.');
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user.id;
  if (!uid) throw new Error('Please sign in to write a review.');
  const { error } = await supabase.from('reviews').insert({
    user_id: uid,
    name: input.name.trim().slice(0, 60),
    country: input.country?.trim().slice(0, 60) || null,
    tour_slug: input.tour ?? null,
    stay_slug: input.stay ?? null,
    rating: input.rating,
    text: input.text.trim().slice(0, 2000),
  });
  if (error) throw new Error(/check/i.test(error.message) ? 'Please write at least a short sentence (10+ characters).' : 'Could not send your review. Please try again.');
}
