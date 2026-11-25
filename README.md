# Mountain-Planet-Tour-and-Travel

Treks, tours and Himalayan adventures — mobile app + backend.

| Folder | What it is |
| --- | --- |
| [`mobile/`](mobile/) | The React Native app (Expo SDK 58, Expo Router). Run it with `cd mobile && npm install && npx expo start`. |
| [`backend/`](backend/) | Supabase backend: database tables, security rules, seed data, photo storage and Edge Functions. |
| [`website/`](website/) | Static website generated from the app data: every trip page the app shares, privacy & terms. `cd website && node build.ts`. |
| [`degine.md`](degine.md) | The design system the app follows (colours, type, components). |
| [`CHECKLIST.md`](CHECKLIST.md) | What is built, what switches on with your keys, and what only you can provide. |

The app works on its own with bundled content. Connect it to the backend (see `backend/README.md`)
to get live trip data, shared Traveller Stories, trip requests emailed to the team, and accounts
that sync saved journeys.

## History

This project started from the Mountain Planet website repo. The website code was removed after its
photos, logos, trip data, Planet AI logic and Supabase SQL were moved into `mobile/` and `backend/`.
Two hidden malware payloads were found in that website code (`init` and `eslint.config.js`) and are
gone; if anyone ran `npm run dev`, `npm run build` or `npm run lint` in the old repo, treat that
machine as exposed and rotate its passwords and keys.
