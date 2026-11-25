import type { ImageSource } from 'expo-image';

/** Bundled photos, keyed by the same paths the website uses (e.g. '/img/ebc.jpg'). */
const local: Record<string, number> = {
  '/img/amadablam.jpg': require('../../assets/img/amadablam.jpg'),
  '/img/annapurna.jpg': require('../../assets/img/annapurna.jpg'),
  '/img/bhaktapur.jpg': require('../../assets/img/bhaktapur.jpg'),
  '/img/bridge.jpg': require('../../assets/img/bridge.jpg'),
  '/img/chitwan.jpg': require('../../assets/img/chitwan.jpg'),
  '/img/climb.jpg': require('../../assets/img/climb.jpg'),
  '/img/ebc.jpg': require('../../assets/img/ebc.jpg'),
  '/img/gokyo.jpg': require('../../assets/img/gokyo.jpg'),
  '/img/heli.jpg': require('../../assets/img/heli.jpg'),
  '/img/hero.jpg': require('../../assets/img/hero.jpg'),
  '/img/kathmandu.jpg': require('../../assets/img/kathmandu.jpg'),
  '/img/langtang.jpg': require('../../assets/img/langtang.jpg'),
  '/img/lumbini.jpg': require('../../assets/img/lumbini.jpg'),
  '/img/manaslu.jpg': require('../../assets/img/manaslu.jpg'),
  '/img/mustang.jpg': require('../../assets/img/mustang.jpg'),
  '/img/paragliding.jpg': require('../../assets/img/paragliding.jpg'),
  '/img/people.jpg': require('../../assets/img/people.jpg'),
  '/img/pokhara.jpg': require('../../assets/img/pokhara.jpg'),
  '/img/poonhill.jpg': require('../../assets/img/poonhill.jpg'),
  '/img/rafting.jpg': require('../../assets/img/rafting.jpg'),
};

/** Resolve a bundled path, a remote URL or a data: URI to something expo-image can show. */
export function img(src: string | undefined): ImageSource | number | undefined {
  if (!src) return undefined;
  if (local[src] !== undefined) return local[src];
  return { uri: src };
}

export const brand = {
  mark: require('../../assets/brand/logo-mark.png'),
  full: require('../../assets/brand/logo-full.png'),
  fullDark: require('../../assets/brand/logo.jpg'),
  square: require('../../assets/brand/logo-square.png'),
  boticx: require('../../assets/brand/boticx-logo.png'),
};

export const introPlaces = [
  { name: 'Everest', src: require('../../assets/img/intro/ebc.jpg') },
  { name: 'Annapurna', src: require('../../assets/img/intro/annapurna.jpg') },
  { name: 'Kathmandu', src: require('../../assets/img/intro/kathmandu.jpg') },
  { name: 'Pokhara', src: require('../../assets/img/intro/pokhara.jpg') },
  { name: 'Chitwan', src: require('../../assets/img/intro/chitwan.jpg') },
  { name: 'Mustang', src: require('../../assets/img/intro/mustang.jpg') },
  { name: 'Lumbini', src: require('../../assets/img/intro/lumbini.jpg') },
  { name: 'Bhaktapur', src: require('../../assets/img/intro/bhaktapur.jpg') },
  { name: 'Langtang', src: require('../../assets/img/intro/langtang.jpg') },
];
