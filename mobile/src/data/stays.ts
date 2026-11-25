// Hotels and homestays shown under Stays.
// These are SAMPLE listings (is_sample) so the screens work before real partners are added.
// They have no rating and no price ("Price on request"). Replace them in Supabase → stays.

export type StayKind = 'hotel' | 'homestay';

export interface Stay {
  slug: string;
  kind: StayKind;
  name: string;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  images: string[];
  rating: number | null;
  reviews: number;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  priceUsdNight: number | null;
  /** Official star category (1–5), if the property has one */
  starRating: number | null;
  freeCancellation: boolean;
  breakfastIncluded: boolean;
  amenities: string[];
  description: string;
  isSample: boolean;
  /** Set for listings created by a verified partner (prices come from their rooms, in NPR). */
  partnerId?: string | null;
  /** Cheapest room per night, in NPR (partner listings). */
  priceFromNpr?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  houseRules?: string | null;
}

/** A room type of a partner listing. */
export interface StayRoom {
  id: string;
  stay_slug: string;
  name: string;
  description: string | null;
  max_guests: number;
  beds: string | null;
  units: number;
  price_npr: number;
  breakfast_included: boolean;
  amenities: string[];
  images: string[];
  sort_order: number;
}

export const stays: Stay[] = [
  {
    slug: 'sample-lakeside-hotel-pokhara',
    kind: 'hotel',
    name: 'Lakeside hotel, Pokhara',
    city: 'Pokhara',
    address: 'Lakeside, Pokhara, Gandaki Province',
    images: ['/img/pokhara.jpg', '/img/poonhill.jpg', '/img/annapurna.jpg', '/img/paragliding.jpg'],
    rating: null,
    reviews: 0,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    priceUsdNight: null,
    starRating: null,
    freeCancellation: false,
    breakfastIncluded: true,
    amenities: ['Lake view', 'Breakfast', 'Wi-Fi', 'Airport pickup', 'Hot shower'],
    description: 'A calm base by Phewa Lake, a short walk from the boats and cafés, with the Annapurna range on clear mornings. Ideal before or after a trek.',
    isSample: true,
  },
  {
    slug: 'sample-heritage-hotel-kathmandu',
    kind: 'hotel',
    name: 'Heritage hotel, Kathmandu',
    city: 'Kathmandu',
    address: 'Thamel, Kathmandu, Bagmati Province',
    images: ['/img/kathmandu.jpg', '/img/bhaktapur.jpg', '/img/people.jpg'],
    rating: null,
    reviews: 0,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    priceUsdNight: null,
    starRating: null,
    freeCancellation: false,
    breakfastIncluded: true,
    amenities: ['Breakfast', 'Wi-Fi', 'Airport pickup', 'Luggage storage', 'Rooftop'],
    description: 'Walk to Thamel’s gear shops and Durbar Square. We use this kind of stay for arrival nights and trek briefings.',
    isSample: true,
  },
  {
    slug: 'sample-jungle-lodge-chitwan',
    kind: 'hotel',
    name: 'Jungle lodge, Chitwan',
    city: 'Chitwan',
    address: 'Sauraha, Chitwan, Bagmati Province',
    images: ['/img/chitwan.jpg', '/img/rafting.jpg', '/img/people.jpg'],
    rating: null,
    reviews: 0,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    priceUsdNight: null,
    starRating: null,
    freeCancellation: false,
    breakfastIncluded: true,
    amenities: ['All meals', 'Safari desk', 'Garden', 'Wi-Fi'],
    description: 'Wake up near the edge of Chitwan National Park, with jeep and canoe safaris arranged from the lodge.',
    isSample: true,
  },
  {
    slug: 'sample-gurung-homestay-ghandruk',
    kind: 'homestay',
    name: 'Gurung family homestay, Ghandruk',
    city: 'Ghandruk',
    address: 'Ghandruk, Kaski, Gandaki Province',
    images: ['/img/annapurna.jpg', '/img/people.jpg', '/img/poonhill.jpg'],
    rating: null,
    reviews: 0,
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    priceUsdNight: null,
    starRating: null,
    freeCancellation: false,
    breakfastIncluded: true,
    amenities: ['Home-cooked dal bhat', 'Mountain view', 'Cultural evening', 'Hot shower'],
    description: 'Stay with a Gurung family in a stone-roofed village on the Annapurna trails. Meals are cooked at home and shared with the family.',
    isSample: true,
  },
  {
    slug: 'sample-newar-homestay-bhaktapur',
    kind: 'homestay',
    name: 'Newar homestay, Bhaktapur',
    city: 'Bhaktapur',
    address: 'Old town, Bhaktapur, Bagmati Province',
    images: ['/img/bhaktapur.jpg', '/img/kathmandu.jpg'],
    rating: null,
    reviews: 0,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    priceUsdNight: null,
    starRating: null,
    freeCancellation: false,
    breakfastIncluded: true,
    amenities: ['Breakfast', 'Old-town location', 'Cooking class on request'],
    description: 'A brick townhouse in the medieval old town, minutes from Nyatapola temple and Pottery Square.',
    isSample: true,
  },
  {
    slug: 'sample-tamang-homestay-langtang',
    kind: 'homestay',
    name: 'Tamang homestay, Langtang',
    city: 'Langtang',
    address: 'Tamang Heritage Trail, Rasuwa, Bagmati Province',
    images: ['/img/langtang.jpg', '/img/people.jpg', '/img/bridge.jpg'],
    rating: null,
    reviews: 0,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    priceUsdNight: null,
    starRating: null,
    freeCancellation: false,
    breakfastIncluded: true,
    amenities: ['All meals', 'Mountain view', 'Local guide on request'],
    description: 'Family-run rooms in a Tamang village close to Kathmandu. Staying here supports the community rebuilding after 2015.',
    isSample: true,
  },
];

export const getStay = (slug: string) => stays.find((s) => s.slug === slug);
