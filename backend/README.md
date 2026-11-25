# Mountain Planet — backend (Supabase)

Database, photo storage, sign-in and server functions for the Mountain Planet app in `../mobile`.
Nothing here needs its own server: it all runs on Supabase.

## What's inside

| Path | What it does |
| --- | --- |
| `supabase/migrations/…_content.sql` | `tours`, `guides`, `destinations` tables. Public can read published rows; only you (dashboard) can edit. |
| `supabase/migrations/…_stories.sql` | Traveller Stories table + `story-photos` bucket. New stories stay hidden until you tick **approved**. (Same as the website's old `stories.sql`, plus author linking.) |
| `supabase/migrations/…_accounts_saved_enquiries.sql` | `profiles` (auto-created on sign-up), `saved_trips` (sync across devices, owner-only), `enquiries` (trip requests). |
| `supabase/migrations/…_bookings.sql` | `bookings` for hotels, homestays, cabs, domestic flights and activity tickets, with status (requested → quoted → confirmed / cancelled / completed), your price (`quote_usd`) and a note to the customer (`team_note`). Customers can read and cancel only their own. |
| `supabase/migrations/…_stays.sql` | `stays` — partner hotels and homestays shown in the app (gallery, rooms, price per night). |
| `supabase/seed.sql` | The 18 tours, 3 guides, 12 destinations and 6 **sample** stays, generated from `mobile/src/data` by `npm run seed:generate`. |
| `supabase/functions/create-booking` | Saves a booking, gives it a reference like `MP-C-7K3Q9`, emails your team and emails the customer a confirmation. |
| `supabase/functions/submit-enquiry` | Saves a Plan-a-trip request and emails it to your team (via Resend). Validates input, honeypot + 5-per-hour limit per email. |
| `supabase/functions/delete-account` | Lets a signed-in user delete their account from the app (required by the App Store). |

Security rules (row-level security) were tested: visitors only see published content and approved stories,
can't approve their own story, can't read anyone's saved trips or enquiries, and deleting an account
removes the profile and saved trips while keeping stories and enquiries (unlinked).

## Set up (about 15 minutes)

1. Create a project at [supabase.com](https://supabase.com) (free plan is fine).
   You can reuse the website's existing project — the migrations are safe to run on top of `stories.sql`.
2. In this folder:
   ```bash
   npm run login          # opens the browser once
   npm run link           # pick your project
   npm run db:push        # creates the tables + loads the tours/guides/destinations
   npm run functions:deploy
   ```
3. Email for trip enquiries (optional but recommended): create a free [Resend](https://resend.com) account,
   verify `mountainplanetnepal.com`, then copy `supabase/functions/.env.example` to `supabase/functions/.env`,
   fill it in and run `npm run secrets:set`. Without it, enquiries are still saved — see them in
   **Table Editor → enquiries**.
4. Connect the app: in Supabase open **Project Settings → API**, copy the **Project URL** and the
   **anon / publishable** key into `mobile/.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=…
   ```
   Restart `npx expo start`. (These two values are public by design; never put the service/secret key in the app.)
5. Sign-in emails open the app: in **Authentication → URL Configuration** set **Site URL** to `mountainplanet://`
   and add these **Redirect URLs**: `mountainplanet://**` and `exp://**` (the second one is for testing in Expo Go).
   Then the "confirm your email" and "reset password" links open the app and sign the user in.

## Staff, payments, sign-in options

- **Make someone staff:** Table Editor → `profiles` → set `role` to `admin`. They then see **Staff panel** in the app's Account screen.
- **Payments:** add the Khalti and/or Stripe keys in `supabase/functions/.env` (see `.env.example`), run `npm run secrets:set`. Customers can then **Accept price → Pay** in My bookings. Payments are verified with the provider before a booking is marked paid.
- **Google / Apple / phone sign-in:** Supabase → Authentication → Providers. Turn on Google (OAuth client ID + secret), Apple, and Phone (needs an SMS provider such as Twilio). The buttons in the app work as soon as a provider is on.
- **Promo codes:** Table Editor → `promo_codes` → add `code` (CAPITALS), `percent_off`, optional `expires_on`.
- **Push notifications** go out automatically when staff send a price, confirm, cancel, or a payment arrives (needs the real app build, not Expo Go).

## Day-to-day

- **Change a price, add a trip, hide a trip:** Table Editor → `tours` (set `published` off to hide). The app updates on next launch.
  Photos: use a full `https://` image URL in `img` (e.g. from Storage), or one of the bundled paths like `/img/ebc.jpg`.
- **Handle a booking:** Table Editor → `bookings`. Fill `quote_usd` (+ optional `team_note`) and set `status` to
  `quoted`, then `confirmed` once paid. Signed-in customers see the status and price in **My bookings**.
  (No online payment yet — collect payment the way you do today.)
- **Real hotels / homestays:** Table Editor → `stays`. Add your partners (`images` can be full https:// URLs —
  upload photos to Storage first), then delete the rows where `is_sample` is true. Leave `price_usd_night` empty
  for "price on request".
- **Approve a story:** Table Editor → `stories` → tick `approved`. Delete the row to reject it.
- **Trip requests:** Table Editor → `enquiries` (update `status` as you reply: new → replied → booked / closed).
- **Changed the bundled data in `mobile/src/data`?** Run `npm run seed:generate`, then `npm run db:push`.
  Note: re-seeding overwrites dashboard edits to those same rows.

## Local development (optional, needs Docker)

```bash
npm run db:start        # local Supabase at http://127.0.0.1:54321 (Studio on :54323)
npm run db:reset        # re-applies migrations + seed
npm run functions:serve
```
