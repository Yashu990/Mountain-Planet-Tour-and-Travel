// Design tokens from newdegine.md — red on white / pale blue-grey, charcoal text, Roboto, 4–12px corners.
import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#dc354b', // terracotta — one primary CTA per screen, active tab, inline links
  onPrimary: '#FFFFFF',
  secondary: '#333333', // sage — selected / on states, focus ring
  onSecondary: '#FFFFFF',
  accent: '#eb4e62',
  surface: '#ffffff', // cream paper — every page background
  surfaceAlt: '#f2f5f9', // biscuit — cards, inputs, inactive chips
  onSurface: '#333333', // warm charcoal — all primary text
  onSurfaceVariant: '#808080', // taupe — metadata, captions, inactive icons
  border: '#e5e5e5',
  destructive: '#dc354b',
  // helpers
  primarySoft: 'rgba(220,53,75,0.08)',
  primarySoftPressed: 'rgba(220,53,75,0.16)',
  destructiveSoft: 'rgba(196,112,85,0.08)',
  glass: 'rgba(255,255,255,0.20)',
  night: '#070D18', // only for splash / intro / photo scrims
} as const;

export const fonts = {
  serif: 'Roboto_700Bold',
  sans: 'Roboto_400Regular',
  sansMedium: 'Roboto_500Medium',
  sansSemi: 'Roboto_500Medium',
  sansBold: 'Roboto_700Bold',
} as const;

const ls = (size: number, em: number) => size * em;

export const type = {
  displayLg: { fontFamily: fonts.serif, fontSize: 36, lineHeight: 40, letterSpacing: ls(36, -0.02), color: colors.onSurface },
  displayMd: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 34, letterSpacing: ls(30, -0.02), color: colors.onSurface },
  headlineLg: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 28, letterSpacing: ls(24, -0.01), color: colors.onSurface },
  headlineMd: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 24, letterSpacing: ls(20, -0.01), color: colors.onSurface },
  headlineSm: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 22, letterSpacing: ls(18, -0.005), color: colors.onSurface },
  bodyMd: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.onSurface },
  bodySm: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.onSurface },
  labelMd: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 18, color: colors.onSurface },
  labelSm: { fontFamily: fonts.sansSemi, fontSize: 12, lineHeight: 16, letterSpacing: ls(12, 0.02), color: colors.onSurface },
  labelUpper: { fontFamily: fonts.sansBold, fontSize: 10, lineHeight: 14, letterSpacing: ls(10, 0.2), textTransform: 'uppercase', color: colors.onSurfaceVariant },
  numeralStep: { fontFamily: fonts.serif, fontSize: 48, lineHeight: 52, letterSpacing: ls(48, -0.02), color: 'rgba(90,107,65,0.30)' },
} satisfies Record<string, TextStyle>;

export const radius = { sm: 4, md: 8, lg: 8, xl: 12, xxl: 16, hero: 16, full: 9999 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 40, gutter: 16, card: 16, section: 28 } as const;

/** Squircle-ish corners on iOS (continuous curve); plain rounding elsewhere. */
export const squircle = { borderCurve: 'continuous' as const };

export const shadow = {
  hairline: { boxShadow: '0 1px 2px rgba(90,80,70,0.04)' },
  sm: { boxShadow: '0 1px 3px rgba(90,80,70,0.10)' },
  cta: { boxShadow: '0 12px 30px rgba(217,90,64,0.25)' },
  tabBar: { boxShadow: '0 16px 50px rgba(90,80,70,0.12)' },
  glass: { boxShadow: '0 8px 24px rgba(0,0,0,0.20)' },
  sheet: { boxShadow: '0 -20px 50px rgba(45,43,38,0.18)' },
} satisfies Record<string, ViewStyle>;

/** Space reserved at the bottom of tab screens for the floating pill bar. */
/** Extra bottom space on tab screens (the bottom bar sits below the content, not over it). */
export const TAB_BAR_SPACE = 28;
/** Widest the bottom navigation row gets on tablets. */
export const MAX_TAB_WIDTH = 720;
