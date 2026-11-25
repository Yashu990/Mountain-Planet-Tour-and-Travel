import { Pressable, Text, View } from 'react-native';
import { colors, radius, type } from '@/theme';
import { LANGUAGES, useI18n } from '@/lib/i18n';
import { Kicker } from './ui';

/** Row of language chips (English · नेपाली · हिन्दी · 中文). */
export function LanguagePicker() {
  const { lang, setLang, t } = useI18n();
  return (
    <View style={{ gap: 10 }}>
      <Kicker>{t('settings.language')}</Kicker>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {LANGUAGES.map((l) => (
          <Pressable
            key={l.code}
            onPress={() => setLang(l.code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: lang === l.code }}
            style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full, backgroundColor: lang === l.code ? colors.secondary : colors.surfaceAlt }}
          >
            <Text style={[type.labelMd, { color: lang === l.code ? colors.onSecondary : colors.onSurface }]}>{l.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
