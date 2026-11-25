// One place that knows a stay's nightly price: our own stays are priced in USD, partner listings
// in NPR (from their cheapest room). Everything — cards, filters, sorting, totals — goes through here.
import { useCallback } from 'react';
import { useCurrency } from './currency';
import type { Stay } from '@/data/stays';

export function useStayPrice() {
  const { price, priceNpr, nprToUsd } = useCurrency();

  /** Nightly "from" price in USD (for filters / sorting), or null when on request. */
  const usd = useCallback(
    (s: Stay): number | null => (s.priceUsdNight != null ? s.priceUsdNight : s.priceFromNpr != null ? nprToUsd(s.priceFromNpr) : null),
    [nprToUsd],
  );

  /** Formatted price for `times` nights × rooms (default 1), in the traveller's currency; null when on request. */
  const label = useCallback(
    (s: Stay, times = 1): string | null =>
      s.priceUsdNight != null ? price(s.priceUsdNight * times) : s.priceFromNpr != null ? priceNpr(s.priceFromNpr * times) : null,
    [price, priceNpr],
  );

  return { usd, label };
}
