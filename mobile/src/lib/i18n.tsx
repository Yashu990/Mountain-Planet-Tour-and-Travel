// App languages. English is the source; other languages fall back to English for any missing key.
// Translations of trip descriptions stay in English (they come from the database).
// Have a native speaker review ne / hi / zh before launch.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ne', label: 'नेपाली' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'zh', label: '中文' },
] as const;
export type Lang = (typeof LANGUAGES)[number]['code'];

const en = {
  'home.namaste': 'Namaste',
  'home.hi': 'Hi, {name}',
  'home.traveller': 'traveller',
  'home.search': 'Find a trek, place or thing to do',
  'home.headline': 'Heaven is a myth.\nThe Himalayas are real.',
  'home.sub': 'Treks, stays, rides and flights — one Kathmandu team.',
  'grid.hotels': 'Hotels',
  'grid.homestays': 'Homestays',
  'grid.flights': 'Flights',
  'grid.cabs': 'Cabs',
  'grid.treks': 'Treks',
  'grid.activities': 'Activities',
  'grid.map': 'Map',
  'grid.plan': 'Plan trip',
  'home.deals': 'Trek deals',
  'home.dealsKicker': 'Best value this season',
  'home.tools': 'Trek tools',
  'home.toolsSub': 'Mountain weather, altitude check, packing list, SOS numbers',
  'home.stays': 'Popular stays',
  'common.seeAll': 'See all',
  'common.from': 'From',
  'common.filters': 'Filters',
  'common.noPayment': 'No payment now. We confirm availability and price within 24 hours.',
  'common.yourDetails': 'Your details',
  'explore.title': 'Explore',
  'explore.search': 'Search treks, places, activities',
  'saved.title': 'My Himalaya board',
  'stories.title': 'Traveller stories',
  'stays.title': 'Where to stay',
  'stays.anywhere': 'Anywhere in Nepal',
  'tools.title': 'Trek tools',
  'trip.title': 'My trip',
  'settings.language': 'Language',
} as const;
type Key = keyof typeof en;
type Dict = Partial<Record<Key, string>>;

const ne: Dict = {
  'home.namaste': 'नमस्ते',
  'home.hi': 'नमस्ते, {name}',
  'home.traveller': 'यात्री',
  'home.search': 'ट्रेक, ठाउँ वा गतिविधि खोज्नुहोस्',
  'home.headline': 'स्वर्ग कल्पना हो।\nहिमालय वास्तविक हो।',
  'home.sub': 'ट्रेक, बास, सवारी र उडान — एउटै काठमाडौं टोली।',
  'grid.hotels': 'होटल',
  'grid.homestays': 'होमस्टे',
  'grid.flights': 'उडान',
  'grid.cabs': 'ट्याक्सी',
  'grid.treks': 'ट्रेक',
  'grid.activities': 'गतिविधि',
  'grid.map': 'नक्सा',
  'grid.plan': 'यात्रा योजना',
  'home.deals': 'ट्रेक अफर',
  'home.dealsKicker': 'यो सिजनको उत्तम मूल्य',
  'home.tools': 'ट्रेक उपकरण',
  'home.toolsSub': 'हिमाली मौसम, उचाइ जाँच, सामान सूची, आपतकालीन नम्बर',
  'home.stays': 'लोकप्रिय बास',
  'common.seeAll': 'सबै हेर्नुहोस्',
  'common.from': 'देखि',
  'common.filters': 'फिल्टर',
  'common.noPayment': 'अहिले भुक्तानी छैन। हामी २४ घण्टाभित्र उपलब्धता र मूल्य पुष्टि गर्छौं।',
  'common.yourDetails': 'तपाईंको विवरण',
  'explore.title': 'खोज्नुहोस्',
  'explore.search': 'ट्रेक, ठाउँ, गतिविधि खोज्नुहोस्',
  'saved.title': 'मेरो हिमालय बोर्ड',
  'stories.title': 'यात्रीका कथा',
  'stays.title': 'कहाँ बस्ने',
  'stays.anywhere': 'नेपालमा जहाँसुकै',
  'tools.title': 'ट्रेक उपकरण',
  'trip.title': 'मेरो यात्रा',
  'settings.language': 'भाषा',
};

const hi: Dict = {
  'home.namaste': 'नमस्ते',
  'home.hi': 'नमस्ते, {name}',
  'home.traveller': 'यात्री',
  'home.search': 'ट्रेक, जगह या करने की चीज़ खोजें',
  'home.headline': 'स्वर्ग एक कल्पना है।\nहिमालय सच्चाई है।',
  'home.sub': 'ट्रेक, ठहरने की जगह, सवारी और उड़ानें — काठमांडू की एक ही टीम।',
  'grid.hotels': 'होटल',
  'grid.homestays': 'होमस्टे',
  'grid.flights': 'उड़ानें',
  'grid.cabs': 'कैब',
  'grid.treks': 'ट्रेक',
  'grid.activities': 'गतिविधियाँ',
  'grid.map': 'नक्शा',
  'grid.plan': 'यात्रा योजना',
  'home.deals': 'ट्रेक डील',
  'home.dealsKicker': 'इस सीज़न का सबसे अच्छा दाम',
  'home.tools': 'ट्रेक टूल्स',
  'home.toolsSub': 'पहाड़ी मौसम, ऊँचाई जाँच, पैकिंग सूची, आपातकालीन नंबर',
  'home.stays': 'लोकप्रिय ठहरने की जगहें',
  'common.seeAll': 'सभी देखें',
  'common.from': 'से',
  'common.filters': 'फ़िल्टर',
  'common.noPayment': 'अभी कोई भुगतान नहीं। हम 24 घंटे में उपलब्धता और कीमत की पुष्टि करेंगे।',
  'common.yourDetails': 'आपकी जानकारी',
  'explore.title': 'खोजें',
  'explore.search': 'ट्रेक, जगहें, गतिविधियाँ खोजें',
  'saved.title': 'मेरा हिमालय बोर्ड',
  'stories.title': 'यात्रियों की कहानियाँ',
  'stays.title': 'कहाँ ठहरें',
  'stays.anywhere': 'नेपाल में कहीं भी',
  'tools.title': 'ट्रेक टूल्स',
  'trip.title': 'मेरी यात्रा',
  'settings.language': 'भाषा',
};

const zh: Dict = {
  'home.namaste': '你好',
  'home.hi': '你好，{name}',
  'home.traveller': '旅行者',
  'home.search': '搜索徒步路线、地点或活动',
  'home.headline': '天堂是传说，\n喜马拉雅是真实的。',
  'home.sub': '徒步、住宿、用车和航班 —— 加德满都一个团队全包。',
  'grid.hotels': '酒店',
  'grid.homestays': '民宿',
  'grid.flights': '航班',
  'grid.cabs': '用车',
  'grid.treks': '徒步',
  'grid.activities': '活动',
  'grid.map': '地图',
  'grid.plan': '定制行程',
  'home.deals': '徒步特惠',
  'home.dealsKicker': '本季超值',
  'home.tools': '徒步工具',
  'home.toolsSub': '山区天气、高原反应自测、行李清单、紧急电话',
  'home.stays': '热门住宿',
  'common.seeAll': '查看全部',
  'common.from': '起',
  'common.filters': '筛选',
  'common.noPayment': '现在无需付款。我们会在24小时内确认空位和价格。',
  'common.yourDetails': '您的信息',
  'explore.title': '探索',
  'explore.search': '搜索徒步、地点、活动',
  'saved.title': '我的喜马拉雅收藏',
  'stories.title': '旅行者故事',
  'stays.title': '住在哪里',
  'stays.anywhere': '尼泊尔任意地点',
  'tools.title': '徒步工具',
  'trip.title': '我的行程',
  'settings.language': '语言',
};

const DICTS: Record<Lang, Dict> = { en, ne, hi, zh };
const KEY = 'mpn-lang';

function deviceLang(): Lang {
  try {
    const code = getLocales()[0]?.languageCode ?? 'en';
    return (LANGUAGES.some((l) => l.code === code) ? code : 'en') as Lang;
  } catch {
    return 'en';
  }
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key, vars?: Record<string, string>) => string }>({
  lang: 'en',
  setLang: () => {},
  t: (k) => en[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(deviceLang);
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        if (v && v in DICTS) setLangState(v as Lang);
      })
      .catch(() => {});
  }, []);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(KEY, l).catch(() => {});
  }, []);
  const t = useCallback(
    (k: Key, vars?: Record<string, string>) => {
      let s: string = DICTS[lang][k] ?? en[k];
      if (vars) for (const [n, v] of Object.entries(vars)) s = s.replace(`{${n}}`, v);
      return s;
    },
    [lang],
  );
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
