// Show prices in the traveller's currency. Prices are stored in USD; rates come from a free
// public feed (open.er-api.com), cached for a day. Bookings and payments stay in USD / NPR.
// The starting currency comes from the phone's region, and from the actual location once the
// traveller allows it (see components/LocationPrompt.tsx). A manual choice always wins.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import * as Location from 'expo-location';

const PREF_KEY = 'mpn-currency';
const RATES_KEY = 'mpn-rates';
const DAY = 24 * 3600 * 1000;
const SYMBOL: Record<string, string> = { USD: '$', NPR: 'Rs ', INR: '₹', EUR: '€', GBP: '£', AUD: 'A$' };
const EURO = ['AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES'];

/** The price currency for a country (ISO code); anything we don't price in shows USD. */
export function currencyForCountry(cc?: string | null): string {
  const c = (cc ?? '').toUpperCase();
  if (c === 'NP') return 'NPR';
  if (c === 'IN') return 'INR';
  if (c === 'GB') return 'GBP';
  if (c === 'AU') return 'AUD';
  if (EURO.includes(c)) return 'EUR';
  return 'USD';
}

/** Asks for location and returns the matching currency and country, or null if refused / unavailable. */
export async function detectCurrencyFromLocation(): Promise<{ currency: string; country: string } | null> {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') return null;
  // A fresh (coarse) fix first — a traveller who just landed in Nepal may still have a stale
  // "last known" position from home. Fall back to the last known one if no fix within 8s.
  const fresh = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null),
    new Promise<null>((r) => setTimeout(() => r(null), 8000)),
  ]);
  const pos = fresh ?? (await Location.getLastKnownPositionAsync());
  if (!pos) return null;
  const [place] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
  if (!place?.isoCountryCode) return null;
  return { currency: currencyForCountry(place.isoCountryCode), country: place.country ?? place.isoCountryCode };
}

interface Ctx {
  currency: string;
  setCurrency: (c: string) => void;
  /** Format a USD amount in the chosen currency, e.g. "$1,450" or "Rs 1,93,000". */
  price: (usd: number) => string;
  /** Format an NPR amount (partner prices) — exact in rupees, converted for other currencies. */
  priceNpr: (npr: number) => string;
  /** NPR → USD at today's rate (for filters and sorting). */
  nprToUsd: (npr: number) => number;
}
const FALLBACK_NPR_PER_USD = 135;
/** Exact rupee amount, e.g. "Rs 6,500" — what partners typed, never converted. */
export const rupees = (npr: number) => 'Rs ' + Math.round(npr).toLocaleString('en-IN');
const C = createContext<Ctx>({ currency: 'USD', setCurrency: () => {}, price: (n) => `$${n.toLocaleString('en-US')}`, priceNpr: (n) => `Rs ${n.toLocaleString('en-IN')}`, nprToUsd: (n) => n / FALLBACK_NPR_PER_USD });

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCur] = useState('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });

  useEffect(() => {
    (async () => {
      try {
        const pref = await AsyncStorage.getItem(PREF_KEY);
        if (pref && SYMBOL[pref]) setCur(pref);
        // No choice yet: start from the phone's region (no permission needed) until location is allowed.
        else setCur(currencyForCountry(getLocales()[0]?.regionCode));
        const cached = JSON.parse((await AsyncStorage.getItem(RATES_KEY)) || 'null') as { at: number; rates: Record<string, number> } | null;
        if (cached?.rates) setRates(cached.rates);
        if (!cached || Date.now() - cached.at > DAY) {
          const res = await fetch('https://open.er-api.com/v6/latest/USD');
          const d = await res.json();
          if (d?.result === 'success' && d.rates) {
            const keep = Object.fromEntries(Object.keys(SYMBOL).map((k) => [k, Number(d.rates[k]) || (k === 'USD' ? 1 : 0)]).filter(([, v]) => v));
            setRates(keep);
            AsyncStorage.setItem(RATES_KEY, JSON.stringify({ at: Date.now(), rates: keep })).catch(() => {});
          }
        }
      } catch {
        /* offline: stay in the current currency with the last cached rates */
      }
    })();
  }, []);

  const setCurrency = useCallback((c: string) => {
    if (!SYMBOL[c]) return;
    setCur(c);
    AsyncStorage.setItem(PREF_KEY, c).catch(() => {});
  }, []);

  const price = useCallback(
    (usd: number) => {
      const rate = rates[currency];
      if (!rate || currency === 'USD') return `$${Math.round(usd).toLocaleString('en-US')}`;
      const v = usd * rate;
      const rounded = v >= 1000 ? Math.round(v / 10) * 10 : Math.round(v);
      return `${SYMBOL[currency]}${rounded.toLocaleString(currency === 'INR' || currency === 'NPR' ? 'en-IN' : 'en-US')}`;
    },
    [currency, rates],
  );

  const nprToUsd = useCallback((npr: number) => npr / (rates.NPR || FALLBACK_NPR_PER_USD), [rates]);
  const priceNpr = useCallback(
    (npr: number) => (currency === 'NPR' ? `Rs ${Math.round(npr).toLocaleString('en-IN')}` : price(nprToUsd(npr))),
    [currency, price, nprToUsd],
  );

  return <C.Provider value={{ currency, setCurrency, price, priceNpr, nprToUsd }}>{children}</C.Provider>;
}

export const useCurrency = () => useContext(C);
