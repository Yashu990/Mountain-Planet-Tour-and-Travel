// Crash reporting (Sentry) and product analytics (PostHog).
// Both are off until you set the keys in mobile/.env:
//   EXPO_PUBLIC_SENTRY_DSN=https://…@….ingest.sentry.io/…
//   EXPO_PUBLIC_POSTHOG_KEY=phc_…            (optional EXPO_PUBLIC_POSTHOG_HOST, default https://us.i.posthog.com)
// Analytics records only screen names and booking/app events — no names, emails or free text.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = (process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: !!SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});

export const wrapRoot = Sentry.wrap;

let anonId: string | null = null;
async function distinctId() {
  if (anonId) return anonId;
  try {
    anonId = await AsyncStorage.getItem('mpn-anon-id');
    if (!anonId) {
      anonId = `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await AsyncStorage.setItem('mpn-anon-id', anonId);
    }
  } catch {
    anonId = 'anon';
  }
  return anonId;
}

/** Record an app event. Never pass personal data in props. */
export function track(event: string, props: Record<string, string | number | boolean> = {}) {
  if (!POSTHOG_KEY) return;
  distinctId()
    .then((id) =>
      fetch(`${POSTHOG_HOST}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: POSTHOG_KEY, event, distinct_id: id, properties: { ...props, platform: Platform.OS } }),
      }),
    )
    .catch(() => {});
}

export function reportError(e: unknown, context?: string) {
  if (SENTRY_DSN) Sentry.captureException(e, context ? { tags: { context } } : undefined);
}
