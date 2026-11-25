// Live content from the backend (tours, guides, destinations).
//
// The app always starts with the bundled data in src/data, so it works offline and on first
// launch. When the backend is configured, fresh rows are fetched, cached on the phone, and
// swapped into the same arrays the screens already use; screens re-render via useContent().
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tours, guides, type Tour, type Guide } from '@/data/tours';
import { destinations, slug as destSlug, type Destination } from '@/data/destinations';
import { stories as placeStories } from '@/data/placeStories';
import { stays, type Stay } from '@/data/stays';
import { supabase } from './supabase';

const CACHE_KEY = 'mpn-content-v4';

interface TourRow { slug: string; title: string; region: string; category: Tour['category']; days: number; price_usd: number; difficulty: Tour['difficulty']; max_alt_m: number; season: string; img: string; ratio: number; rating: number; reviews: number; group_size: string; tags: string[]; summary: string; highlights: string[]; itinerary: Tour['itinerary']; includes: string[] }
interface GuideRow { slug: string; title: string; kicker: string; img: string; ratio: number; minutes: number; intro: string; sections: Guide['sections'] }
interface DestRow { slug: string; name: string; area: Destination['area']; img: string; alt: string; fact: string; best: string; q: string; story: string; highlights: string[] }
interface StayRow { slug: string; kind: Stay['kind']; name: string; city: string; address: string; lat: number | null; lng: number | null; images: string[]; rating: number | null; reviews: number; max_guests: number; bedrooms: number; beds: number; baths: number; price_usd_night: number | null; star_rating: number | null; free_cancellation: boolean; breakfast_included: boolean; amenities: string[]; description: string; is_sample: boolean; partner_id?: string | null; status?: string; price_from_npr?: number | null; check_in_time?: string | null; check_out_time?: string | null; house_rules?: string | null }
interface Snapshot { stays?: Stay[]; tours: Tour[]; guides: Guide[]; destinations: Destination[]; place: Record<string, { story: string; highlights: string[] }> }

const toTour = (r: TourRow): Tour => ({
  slug: r.slug, title: r.title, region: r.region, category: r.category, days: r.days, price: r.price_usd, difficulty: r.difficulty,
  maxAlt: r.max_alt_m, season: r.season, img: r.img, ratio: Number(r.ratio), rating: Number(r.rating), reviews: r.reviews,
  groupSize: r.group_size, tags: r.tags, summary: r.summary, highlights: r.highlights, itinerary: r.itinerary, includes: r.includes,
});
const toGuide = (r: GuideRow): Guide => ({ slug: r.slug, title: r.title, kicker: r.kicker, img: r.img, ratio: Number(r.ratio), minutes: r.minutes, intro: r.intro, sections: r.sections });
const toStay = (r: StayRow): Stay => ({ slug: r.slug, kind: r.kind, name: r.name, city: r.city, address: r.address, lat: r.lat ?? undefined, lng: r.lng ?? undefined, images: r.images, rating: r.rating === null ? null : Number(r.rating), reviews: r.reviews, maxGuests: r.max_guests, bedrooms: r.bedrooms, beds: r.beds, baths: r.baths, priceUsdNight: r.price_usd_night, starRating: r.star_rating ?? null, freeCancellation: !!r.free_cancellation, breakfastIncluded: !!r.breakfast_included, amenities: r.amenities, description: r.description, isSample: r.is_sample, partnerId: r.partner_id ?? null, priceFromNpr: r.price_from_npr ?? null, checkInTime: r.check_in_time ?? null, checkOutTime: r.check_out_time ?? null, houseRules: r.house_rules ?? null });
const toDest = (r: DestRow): Destination => ({ name: r.name, area: r.area, img: r.img, alt: r.alt, fact: r.fact, best: r.best, q: r.q });

/** Samples are placeholders: once 3 real partner listings are live, stop showing them. */
const withoutSamplesOnceReal = (list: Stay[]) => (list.filter((x) => x.partnerId).length >= 3 ? list.filter((x) => !x.isSample) : list);

function apply(s: Snapshot) {
  if (s.tours.length) tours.splice(0, tours.length, ...s.tours);
  if (s.guides.length) guides.splice(0, guides.length, ...s.guides);
  if (s.destinations.length) destinations.splice(0, destinations.length, ...s.destinations);
  if (s.stays) stays.splice(0, stays.length, ...s.stays);
  for (const [name, v] of Object.entries(s.place)) placeStories[name] = v;
}

async function fetchSnapshot(): Promise<Snapshot | null> {
  if (!supabase) return null;
  const [t, g, d, st] = await Promise.all([
    supabase.from('tours').select('*').order('sort_order'),
    supabase.from('guides').select('*').order('sort_order'),
    supabase.from('destinations').select('*').order('sort_order'),
    // Only what travellers may see: our own stays + LIVE partner listings (partners/staff can read more).
    supabase.from('stays').select('*').or('partner_id.is.null,status.eq.live').order('sort_order'),
  ]);
  if (t.error || g.error || d.error) return null;
  const rows = (d.data ?? []) as DestRow[];
  return {
    // stays may legitimately be empty (all samples removed); undefined only if the table is missing
    stays: st.error ? undefined : withoutSamplesOnceReal(((st.data ?? []) as StayRow[]).map(toStay)),
    tours: ((t.data ?? []) as TourRow[]).map(toTour),
    guides: ((g.data ?? []) as GuideRow[]).map(toGuide),
    destinations: rows.map(toDest),
    place: Object.fromEntries(rows.filter((r) => r.story).map((r) => [r.name, { story: r.story, highlights: r.highlights }])),
  };
}

const Ctx = createContext({ version: 0, live: false });

export function ContentProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ version: 0, live: false });

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1) last good copy from the phone
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached && alive) {
          apply(JSON.parse(cached));
          setState((s) => ({ ...s, version: s.version + 1 }));
        }
      } catch {
        /* ignore a bad cache */
      }
      // 2) fresh copy from the backend
      try {
        const fresh = await fetchSnapshot();
        if (fresh && alive && fresh.tours.length) {
          apply(fresh);
          setState((s) => ({ version: s.version + 1, live: true }));
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {});
        }
      } catch {
        /* offline — keep bundled / cached content */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

/** Subscribe a screen to content updates (call it at the top of any screen that lists content). */
export const useContent = () => useContext(Ctx);

export { destSlug };
