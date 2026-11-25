import { CONTACT } from '@/data/tours';

/** Google Maps directions to the Kathmandu office (opens the Maps app or browser). */
export function directionsUrl(mode: 'driving' | 'walking' | 'transit' = 'driving') {
  const q = encodeURIComponent(CONTACT.coords || CONTACT.address);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=${mode}`;
}
