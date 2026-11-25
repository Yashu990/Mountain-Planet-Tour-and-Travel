# Mountain Planet — website

A fast static site generated from the app's own data (`../mobile/src/data`), so prices, trips,
destinations and stays never get out of sync with the app.

```bash
cd website
node build.ts        # → dist/ (43 pages)
```

Deploy: import this `website/` folder into Vercel (or any static host). `vercel.json` already sets
the build command and output folder.

## What's in it

- Home page with every journey, destination and guide
- A page for every tour, guide, destination and stay — the same links the app's **Share** button sends,
  with link previews (image + title) for WhatsApp, Facebook, etc. and an **Open in app** button
- `/privacy` and `/terms` (required by Google Play and the App Store — give the stores these URLs)
- `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` so links open straight in the app

## Before launch

1. In `build.ts`, set `PLAY_URL` / `APPSTORE_URL` once the app is published (until then the site says "coming soon").
2. **Android app links:** after the first EAS build run `npx eas-cli credentials -p android`, copy the
   **SHA-256 fingerprint**, and put it in place of `REPLACE_WITH_EAS_SHA256_FINGERPRINT` in `build.ts`.
3. **iOS universal links:** replace `REPLACE_TEAM_ID` with your Apple Team ID.
4. Rebuild (`node build.ts`) and redeploy whenever you change trips in the app data.
