import { Pressable, Text, View } from 'react-native';
import { colors, radius, type } from '@/theme';
import { useCurrency } from '@/lib/currency';
import { Kicker } from './ui';

const CURRENCIES = ['USD', 'NPR', 'INR', 'EUR', 'GBP', 'AUD'];

/** Choose the currency prices are shown in (works without an account). */
export function CurrencyPicker() {
  const { currency, setCurrency } = useCurrency();
  return (
    <View style={{ gap: 10 }}>
      <Kicker>Show prices in</Kicker>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CURRENCIES.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCurrency(c)}
            accessibilityRole="radio"
            accessibilityState={{ checked: currency === c }}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: currency === c ? colors.secondary : colors.surfaceAlt }}
          >
            <Text style={[type.labelMd, { color: currency === c ? colors.onSecondary : colors.onSurface }]}>{c}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
