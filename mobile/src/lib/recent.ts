// "Recent searches" on Home: the last few stay searches, kept on this phone.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentSearch {
  kind: 'stay';
  where: string;
  checkIn: string | null; // yyyy-mm-dd
  checkOut: string | null;
  rooms: number;
  guests: number;
  at: number;
}

const KEY = 'mpn-recent-searches';
const listeners = new Set<() => void>();

export async function addRecentSearch(r: Omit<RecentSearch, 'at'>) {
  try {
    const list: RecentSearch[] = JSON.parse((await AsyncStorage.getItem(KEY)) || '[]');
    const same = (x: RecentSearch) => x.where === r.where && x.checkIn === r.checkIn && x.checkOut === r.checkOut;
    const next = [{ ...r, at: Date.now() }, ...list.filter((x) => !same(x as RecentSearch))].slice(0, 6);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    listeners.forEach((l) => l());
  } catch {
    /* not critical */
  }
}

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearch[]>([]);
  useEffect(() => {
    const load = () => AsyncStorage.getItem(KEY).then((v) => setItems(JSON.parse(v || '[]'))).catch(() => {});
    load();
    listeners.add(load);
    return () => {
      listeners.delete(load);
    };
  }, []);
  return items;
}
