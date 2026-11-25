// Map coordinates for destinations, stay towns and the main trek routes.
// Route waypoints are approximate (village-level) and meant for orientation, not navigation.

export type LatLng = [number, number];

export const DESTINATION_COORDS: Record<string, LatLng> = {
  Everest: [28.0026, 86.8528],
  Annapurna: [28.5306, 83.8781],
  'Poon Hill': [28.4006, 83.6879],
  Langtang: [28.2113, 85.5622],
  'Gokyo Lakes': [27.9553, 86.695],
  Manaslu: [28.5833, 84.6333],
  'Upper Mustang': [29.181, 83.957],
  Kathmandu: [27.7172, 85.324],
  Bhaktapur: [27.671, 85.4298],
  Pokhara: [28.2096, 83.9856],
  Lumbini: [27.484, 83.276],
  Chitwan: [27.5793, 84.4935],
};

/** Town coordinates used for stays that have no exact pin yet. */
export const CITY_COORDS: Record<string, LatLng> = {
  Kathmandu: [27.7154, 85.3123],
  Pokhara: [28.2096, 83.9586],
  Chitwan: [27.5793, 84.4935],
  Ghandruk: [28.377, 83.807],
  Bhaktapur: [27.672, 85.428],
  Langtang: [28.16, 85.33],
  Nagarkot: [27.715, 85.52],
  Lumbini: [27.484, 83.276],
  Bandipur: [27.937, 84.408],
};

export interface Route { slug: string; name: string; points: { name: string; at: LatLng }[] }

export const TREK_ROUTES: Route[] = [
  {
    slug: 'everest-base-camp-trek',
    name: 'Everest Base Camp',
    points: [
      { name: 'Lukla', at: [27.687, 86.7314] },
      { name: 'Phakding', at: [27.7397, 86.7136] },
      { name: 'Namche Bazaar', at: [27.8048, 86.7101] },
      { name: 'Tengboche', at: [27.8361, 86.7644] },
      { name: 'Dingboche', at: [27.8925, 86.8317] },
      { name: 'Lobuche', at: [27.9483, 86.8106] },
      { name: 'Gorak Shep', at: [27.98, 86.8289] },
      { name: 'Everest Base Camp', at: [28.0026, 86.8528] },
      { name: 'Kala Patthar', at: [27.9958, 86.8285] },
    ],
  },
  {
    slug: 'annapurna-base-camp',
    name: 'Annapurna Base Camp',
    points: [
      { name: 'Nayapul', at: [28.2852, 83.7942] },
      { name: 'Ghandruk', at: [28.377, 83.807] },
      { name: 'Chhomrong', at: [28.417, 83.817] },
      { name: 'Bamboo', at: [28.458, 83.835] },
      { name: 'Deurali', at: [28.498, 83.865] },
      { name: 'Machapuchare Base Camp', at: [28.516, 83.878] },
      { name: 'Annapurna Base Camp', at: [28.5306, 83.8781] },
    ],
  },
  {
    slug: 'ghorepani-poon-hill',
    name: 'Ghorepani Poon Hill',
    points: [
      { name: 'Nayapul', at: [28.2852, 83.7942] },
      { name: 'Tikhedhunga', at: [28.326, 83.748] },
      { name: 'Ghorepani', at: [28.4006, 83.6994] },
      { name: 'Poon Hill', at: [28.4006, 83.6879] },
      { name: 'Tadapani', at: [28.39, 83.76] },
      { name: 'Ghandruk', at: [28.377, 83.807] },
    ],
  },
  {
    slug: 'langtang-valley',
    name: 'Langtang Valley',
    points: [
      { name: 'Syabrubesi', at: [28.1606, 85.346] },
      { name: 'Lama Hotel', at: [28.158, 85.43] },
      { name: 'Langtang Village', at: [28.214, 85.518] },
      { name: 'Kyanjin Gompa', at: [28.2113, 85.5622] },
    ],
  },
];

export const routeFor = (tourSlug: string) => TREK_ROUTES.find((r) => r.slug === tourSlug);
