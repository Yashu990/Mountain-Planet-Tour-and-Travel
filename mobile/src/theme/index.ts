// Design tokens from degine.md — "Warm Heirloom Editorial Mobile".
import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#D95A40', // terracotta — one primary CTA per screen, active tab, inline links
  onPrimary: '#FFFFFF',
  secondary: '#5A6B41', // sage — selected / on states, focus ring
  onSecondary: '#FFFFFF',
  accent: '#8FA382',
  surface: '#FDFCF8', // cream paper — every page background
  surfaceAlt: '#F4EFE6', // biscuit — cards, inputs, inactive chips
  onSurface: '#2D2B26', // warm charcoal — all primary text
  onSurfaceVariant: '#8F8D84', // taupe — metadata, captions, inactive icons
  border: '#EAE5DB',
  destructive: '#C47055',
  // helpers
  primarySoft: 'rgba(217,90,64,0.10)',
  primarySoftPressed: 'rgba(217,90,64,0.20)',
  destructiveSoft: 'rgba(196,112,85,0.08)',
  glass: 'rgba(255,255,255,0.20)',
  night: '#070D18', // only for splash / intro / photo scrims
} as const;

export const fonts = {
  serif: 'Fraunces_500Medium',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
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

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, xxl: 40, hero: 32, full: 9999 } as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, gutter: 24, card: 24, section: 40 } as const;

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
