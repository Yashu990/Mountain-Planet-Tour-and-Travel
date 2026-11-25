# Mountain Planet — build checklist

Legend: ✅ done & tested · 🟢 done in code, switches on when you add the key/account · ⬜ not done yet

## Login & accounts
- ✅ Email + password sign-up / sign-in, forgot password, sign-out
- ✅ Email links (confirm sign-up, reset password) open the app; set-new-password screen
- ✅ Welcome screen after the intro on first launch: sign in or “Skip for now”
- ✅ Profile: name, phone/WhatsApp, nationality (for permits), currency
- ✅ Profile photo: profile button top-right on Home (photo / initial / person icon); tap your photo in Account to change it (stored in the `avatars` bucket). Tested on emulator against the live project.
- ✅ Local-currency prices: asks for location once (with an explanation first), picks NPR / INR / EUR / GBP / AUD / USD from the country; falls back to the phone's region if refused
- ✅ Responsive: centred column + 2-column trip/hotel lists on tablets; buttons and labels hold up on small phones with large text (tested 360dp @ 130% text and 800dp tablet)
- ✅ Delete my account (App Store requirement)
- 🟢 **Continue with Google** — turn on Google in Supabase → Authentication → Providers (needs a Google OAuth client ID)
- 🟢 **Continue with Apple** (iPhone) — turn on Apple in Supabase (needs Apple developer account)
- 🟢 **Continue with phone (SMS code)** — turn on Phone in Supabase and connect an SMS provider (e.g. Twilio)

## Bookings
- ✅ Hotels & homestays: Agoda-style search (place, dates, rooms, guests), Filters sheet, Sort, quick chips, result cards
- ✅ Stay detail: gallery, facts, location, reviews, Reserve (dates/guests carried through)
- ✅ Domestic flights (airline, departure time, baggage), cabs & airport transfers (extras), activities (time, pickup)
- ✅ Booking reference, confirmation emails, My bookings with live status
- ✅ Customer **Accept price** → **Pay**; cancel before payment
- ✅ Promo codes (create them in Supabase → promo_codes)
- 🟢 **Pay with Khalti (NPR)** — add `KHALTI_SECRET_KEY` + `KHALTI_USD_TO_NPR`
- 🟢 **Pay by card (Stripe, USD)** — add `STRIPE_SECRET_KEY`
- 🟢 Booking / payment emails — add `RESEND_API_KEY` + verified sender
- ⬜ Real partner hotels & homestays (6 “Sample” listings until you add yours)

## Staff
- ✅ In-app **Staff panel** (Account → Staff panel) for admin accounts: bookings by status, send price + note, change status, call/email/WhatsApp customer; trip requests; approve/delete stories and reviews
- ✅ Customer is emailed + notified when a price is sent / booking confirmed / cancelled
- ✅ Security: customers can’t make themselves admin, see others’ bookings, set their own price or mark bookings paid (52 database tests)
- ⬜ Make your staff admins: Supabase → Table Editor → profiles → set `role` = `admin`

## Partners (hotels & homestays) — phase 1: onboarding
- ✅ Separate **partner login** (Account → “Own a hotel or homestay?” → Partner sign in / Create partner account)
- ✅ 4-step application: business details → verification documents (photo or PDF, private storage) → bank for payouts → 10% partner agreement → Send
- ✅ Staff panel → **Partner applications**: details, bank, documents (10-minute private links), Approve / Send back with a reason
- ✅ Partner sees status (Under review / Needs changes + staff note / Verified) and a partner dashboard once approved
- ✅ Security: partners can’t approve themselves, change commission, edit after sending, or see anyone else’s data or documents (24 database tests)
- ✅ Tested end to end on the emulator against the live project (apply → upload 4 documents → send → staff approve → partner dashboard)
- ✅ **Phase 2: listings** — verified partners create their property (photos with cover, description, star rating, check-in/out, house rules, free cancellation, facilities) and room types (name, guests, beds, how many, **price per night in NPR**, breakfast, room photos)
- ✅ Send for review → Staff panel → **Partner listings** (photos, details, rooms in rupees, what travellers will see) → Approve / Send back with note / Hide
- ✅ Live listings appear in Hotels & homestays with a **Verified partner** badge, “from” price from the cheapest room (converted to the traveller’s currency), Rooms section with **Choose** → booking form carries the room
- ✅ Partner can edit a live listing (changes show straight away) and **pause / resume** it; samples hide automatically once 3 partner listings are live
- ✅ Security: one listing per partner, only approved partners, can’t publish themselves, fake ratings or touch other listings / sample stays (36 database tests)
- ✅ Tested end to end on the emulator against the live project
- ⬜ Phase 3: price & availability calendar, live prices in the app, bookings go to the partner (accept/decline in 2 hours), pay in app **or pay at property**
- ⬜ Phase 4: commission ledger both ways (we owe partner for app payments; partner owes 10% for pay-at-property), weekly payouts, monthly statements
- ⬜ Emails to partners (application received / approved / needs changes) — after the Edge Functions are deployed
- ⬜ Have a lawyer check the partner agreement text and confirm the document list per partner type

## Notifications
- 🟢 Push notifications (price ready, confirmed, payment received) — works in the real APK after the first EAS build; Expo Go on Android can’t receive push

## Trust & content
- ✅ Reviews on tours and stays (signed-in travellers, approved by staff)
- ✅ Traveller stories with photos (approved by staff)
- ✅ Privacy policy & terms screens (have a lawyer review the text)

## Traveller tools
- ✅ Trek tools: 5-day mountain weather (live, Open-Meteo), altitude-sickness self-check, packing lists, Nepal emergency numbers (1144 / 100 / 102 / 101)
- ✅ Prices shown in USD / NPR / INR / EUR / GBP / AUD (live rates, cached)
- ✅ Planet AI understands hotels, homestays, cabs, flights, activities, bookings, weather/SOS

## Store & release
- ✅ 1024×1024 app icon + Android adaptive icon from your logo
- ✅ EAS build profiles (`preview` = APK, `production` = Play Store bundle)
- ⬜ Expo login on this computer, then `npx eas-cli build -p android --profile preview` → download link
- ⬜ Google Play developer account ($25 once), Apple developer account ($99/year)
- ⬜ Store screenshots + description

## Next phase
- ✅ **Maps** — OpenStreetMap (no API key): Places, Stays and Trek routes (Everest Base Camp, Annapurna Base Camp, Poon Hill, Langtang); from Home grid, Stays, Destinations and tour pages. Tested on emulator.
- 🟢 **Real AI assistant** — Planet AI answers with Claude (Opus 5.5) using your live trip catalogue, with trip cards, links and follow-up chips; falls back to the built-in assistant if unavailable. Add `ANTHROPIC_API_KEY` to the function secrets.
- ✅ **Languages** — English, नेपाली, हिन्दी, 中文 for the main screens (auto from phone language; picker in About and Account). ⬜ Native-speaker review; trip descriptions stay in English.
- ✅ **My trip hub** (Saved → My trip) — upcoming bookings with countdown (cached for offline), day-by-day itinerary you tick off, route map, help numbers.
- 🟢 **Crash reporting (Sentry)** — add `EXPO_PUBLIC_SENTRY_DSN`; for readable stack traces later add Sentry's Expo plugin with your org/project.
- 🟢 **Analytics (PostHog)** — add `EXPO_PUBLIC_POSTHOG_KEY`; tracks screens, bookings, payments, AI chats, stories (no personal data).
- ✅ **Website** (`website/`) — 43 pages built from the app data: home, every tour/guide/destination/stay (the links the app shares, with previews), privacy & terms for the stores.
- 🟢 **Links open the app** (Android app links / iOS universal links) — fill in the SHA-256 fingerprint and Apple Team ID (see website/README.md).

## Things only you can provide
1. Supabase project URL + anon key (→ `mobile/.env`)
2. Run the backend setup once (`backend/README.md`)
3. Keys: Resend, Khalti, Stripe, Anthropic (Planet AI); Google (and Apple) sign-in; SMS provider; optionally Sentry and PostHog
4. Phone / WhatsApp numbers (→ `mobile/src/data/tours.ts` → `CONTACT`)
5. Real hotel / homestay partners with photos and prices
6. Expo account login (for the APK download link) and store accounts
7. Deploy the website (website/README.md) and add your Play / App Store links
