# Mountain Planet — mobile app

React Native (Expo SDK 58 + Expo Router) version of the Mountain Planet Nepal website,
built to the "Warm Heirloom Editorial" design in `../degine.md`.

## Run it

```bash
cd mobile
npm install
npx expo start        # scan the QR code with the Expo Go app (Android / iOS)
```

Checks: `npx tsc --noEmit` and `npx expo-doctor`.

## Screens

| Route | Screen |
| --- | --- |
| `(tabs)/index` | Home — featured trek, altitude ladder, category feed, destinations, services, boards, journey steps, stories, CTA |
| `(tabs)/explore` | Search, categories, difficulty / length / sort filters, list or grid, curated boards |
| `(tabs)/stories` | Traveller Stories masonry wall, pull to refresh |
| `(tabs)/saved` | My Himalaya board, request a quote for saved trips |
| `tour/[slug]`, `guide/[slug]`, `destinations/[slug]` | Detail screens with the hero photo + curling cream sheet |
| `destinations` | All destinations by area |
| `plan` | Trip request form (sent to the team via the backend; falls back to the email app) |
| `ai` | Planet AI chat (rule-based, runs fully on the phone) |
| `share-story`, `story/[id]` | Share a story with up to 6 photos, photo viewer |
| `about` | About the company |
| `account` | Sign in / create account, synced board, set new password, sign out, delete account |
| `stays`, `stays/[slug]` | Hotels & homestays list; stay detail with photo gallery, facts, location and **Reserve** |
| `book/stay`, `book/flight`, `book/cab`, `book/ticket` | Booking forms for hotels/homestays, domestic flights, cabs/airport transfers and activities |
| `bookings` | My bookings with status, price from the team and cancel |
| `auth/callback` | Opened by email links (confirm sign-up, reset password) |

The intro animation (places of Nepal orbiting into the logo) plays on every launch and can be skipped.

## Where things live

- `src/theme` — colours, type scale, radii, spacing, shadows from `degine.md`
- `src/components/ui.tsx` — buttons, chips, cards, inputs, kickers, step numerals
- `src/components/cards.tsx` — hero card, list row, tiles, destination / board / guide / story cards
- `src/data` — tours, guides, destinations, place stories (copied from the website — edit here)
- `src/lib/stories.ts` — Traveller Stories storage
- `assets/img`, `assets/brand` — photos and logos from the website (brand also has the wordmark,
  tagline and a 1536×1024 dark logo for store graphics)

## Backend

The app runs offline on its bundled content. Set up `../backend` (Supabase) and create `mobile/.env`
from `.env.example` to turn on:

- **Live content** — tours, guides and destinations load from the database (cached for offline use).
- **Traveller Stories** — photos upload to Supabase Storage; stories appear after you approve them.
- **Trip requests** — the Plan form sends to the `submit-enquiry` function, which stores and emails it
  (falls back to the phone's email app if the backend is unreachable).
- **Accounts** — email + password sign-in (Saved tab → “Sign in to sync your board”); saved journeys
  sync across devices; users can delete their account in-app.

Code: `src/lib/supabase.ts` (client), `content.tsx`, `auth.tsx`, `stories.ts`, `store.tsx` (saved sync),
`src/app/account.tsx`.

## Building for the stores

Use EAS: `npx eas-cli@latest build -p android` / `-p ios`. Bundle id / package:
`com.mountainplanetnepal.app` (change in `app.json` if needed). The app icon currently uses
`assets/brand/logo-square.png` (256×256) — replace it with a 1024×1024 version before publishing.
