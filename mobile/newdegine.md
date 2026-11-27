---
version: alpha
name: BookMyShow-design-analysis
description: "A movie and live events ticketing app in BookMyShow red (#dc354b, sign in #eb4e62) on white and pale blue-gray, Roboto throughout, dark charcoal footer bands, red text for filters and links, poster-led rows and 8 to 16px corners."
status: Draft
appVersion: "measured in a browser, 2026-10-15"
platformsCovered: [Web]
reviewer: ""
verifiedAt: ""

colors:
  primary: "#dc354b"
  on-primary: "#ffffff"
  signin: "#eb4e62"
  ink: "#333333"
  ink-strong: "#222222"
  ink-body: "#666666"
  ink-muted: "#808080"
  ink-faint: "#999999"
  canvas: "#ffffff"
  page: "#f2f5f9"
  band: "#f5f5f5"
  border: "#e5e5e5"
  border-mid: "#cccccc"
  charcoal: "#333333"
  footer: "#404040"
  on-dark: "#ffffff"

typography:
  headline:
    fontFamily: "Roboto, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
  section:
    fontFamily: "Roboto, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 28.08px
  dialog-title:
    fontFamily: "Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0.2px
  button:
    fontFamily: "Roboto, sans-serif"
    fontSize: 16px
    fontWeight: 500
    lineHeight: 20px
  body:
    fontFamily: "Roboto, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0.2px
  small:
    fontFamily: "Roboto, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0.2px

rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px

spacing:
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px

components:
  signin-button:
    backgroundColor: "{colors.signin}"
    textColor: "{colors.on-primary}"
    typography: "{typography.small}"
    rounded: "{rounded.xs}"
    height: 25px
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.sm}"
    height: 50px
  filter-chip:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.small}"
    rounded: "{rounded.lg}"
    height: 32px
    padding: 1px 12px 0
  filter-tag:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    typography: "{typography.body}"
    height: 32px
    padding: 0 12px
  search-field:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    height: 36px
  footer-band:
    backgroundColor: "{colors.footer}"
    textColor: "{colors.on-dark}"
    typography: "{typography.small}"
---

## Overview

BookMyShow sells tickets for movies, plays, concerts, sports and other live events across India. Its site is white and pale blue-gray with BookMyShow red for signing in, links and selected filters, Roboto for all text, poster-led carousels and dark charcoal bands at the foot of the page. [Observed]

What defines the look:

1. **BookMyShow red.** `#dc354b` sets links ("See All", "View All Cities"), selected filter text and the Contact button, and a lighter `#eb4e62` fills the small Sign in button. [Measured]
2. **Charcoal text and bands.** Text is `#333333` and `#666666`, and footer bands are `#333333` and `#404040`. [Measured]
3. **Roboto, slightly open.** Roboto at 400 to 700 with +0.2px tracking on body and small text. [Measured]
4. **Pale page, white rows.** The page is `#f2f5f9` with white content rows of posters. [Measured]
5. **Rounded filters.** Language and format filters are 32 high, white with red text, either 16px pills or square tags with a hairline. [Measured]

Source for this file: the home page (which asks for a region first), the Mumbai movies listing and the Mumbai home, measured in a browser at 1440 and 390 wide on 2026-10-15, with a dark color scheme pass. BookMyShow does not publish its design system. Seat selection and checkout need an account. No app captures were used. See Known Gaps.

## Core

### Colors

| Role | Value | Where |
|------|-------|-------|
| Red | `#dc354b` | Links, selected filter text, Contact button, location ring [Measured] |
| Sign in red | `#eb4e62` | Sign in button [Measured] |
| Text | `#333333`, `#222222` | Headings and nav [Measured] |
| Body and muted | `#666666`, `#808080`, `#999999` | Descriptions, FAQ, city names [Measured] |
| Canvas | `#ffffff` | Rows and dialogs [Measured] |
| Page | `#f2f5f9`, `#f5f5f5` | Page and region dialog [Measured] |
| Borders | `#e5e5e5`, `#cccccc`, `#eeeeee` | Filters and search [Measured] |
| Charcoal | `#333333`, `#404040` | Footer and customer care bands [Measured] |

### Typography

Roboto at 400, 500 and 700. [Measured]

| Role | Desktop | Mobile | Weight |
|------|---------|--------|--------|
| Page headline | 24 on 30 | not shown | 700 [Measured] |
| Section headline | 24 on 28.08 | not shown | 700 [Measured] |
| Dialog title | 16 on 20, 0.2px | same | 500 [Measured] |
| Button | 16 | same | 500 [Measured] |
| Body and nav | 14 on 20, 0.2px | same | 400 to 500 [Measured] |
| Small and labels | 12 on 16, 0.2px | 11 to 12 | 400 [Measured] |

### Shape and spacing

Cards and buttons use 8, posters 12 and 16, filter pills 16, the search field and Sign in 4, and avatars full round. [Measured] Filters carry 12px side padding. [Measured]

### Iconography and motion

Not measured. [Inferred]

### Themes

Light only. The dark color scheme pass changed nothing. [Measured]

## Platform: iOS

How the BookMyShow iOS app looks and behaves was not captured. BookMyShow does not publish a design system, so every item below is inferred from the web design and platform conventions. No device capture was done.

### Back and up navigation

Expected on iOS: Chevron plus previous title, swipe from the left edge.

Not measured. [Inferred]

### Primary navigation

Expected on iOS: Bottom tab bar, about five items.

A bottom tab bar for home, movies, live events and the profile is expected. [Inferred]

### Main action

Expected on iOS: Nav bar or bottom bar button.

A red Book tickets button on a movie or event screen. [Inferred]

### Sheets, dialogs and messages

Expected on iOS: Action sheets, alerts, modals.

Not measured. [Inferred]

### Controls

Expected on iOS: Cupertino switches, pickers, segmented controls.

Not measured. [Inferred]

### Text sizing

Expected on iOS: Dynamic Type.

Not measured. [Inferred]

### Touch and pointer targets

Expected on iOS: 44pt minimum.

Not measured. [Inferred]

### Insets and system bars

Expected on iOS: Safe areas, status bar.

Not measured. [Inferred]

### Icons

Expected on iOS: SF Symbols or custom.

Not measured. [Inferred]

### Account and sign-in rules

Expected on iOS: Equivalent login option when third-party sign-in exists (Guideline 4.8) and in-app account deletion. Note the date checked.

Not verified. Sign-in rules and account deletion were not checked. [Inferred] Checked: 2026-10-15 against the public web only.

### Platform conformance

Expected on iOS: For each important component: what iOS expects, what this app does, and why it deviates.

The app is expected to share the red, Roboto-like type and poster rows with the web. [Inferred]

## Platform: Android

How the BookMyShow Android app looks and behaves was not captured. BookMyShow does not publish a design system, so every item below is inferred from the web design and platform conventions. No device capture was done.

### Back and up navigation

Expected on Android: System back and gesture, up arrow in the top bar.

Not measured. [Inferred]

### Primary navigation

Expected on Android: Navigation bar, rail on tablets.

A bottom navigation bar for home, movies, live events and the profile is expected. [Inferred]

### Main action

Expected on Android: Floating action button.

A red Book tickets button on a movie or event screen. [Inferred]

### Sheets, dialogs and messages

Expected on Android: Bottom sheets, dialogs, snackbars.

Not measured. [Inferred]

### Controls

Expected on Android: Material switches, pickers, chips.

Not measured. [Inferred]

### Text sizing

Expected on Android: Font scale.

Not measured. [Inferred]

### Touch and pointer targets

Expected on Android: 48dp minimum.

Not measured. [Inferred]

### Insets and system bars

Expected on Android: Edge to edge, system bars.

Not measured. [Inferred]

### Icons

Expected on Android: Material Symbols or custom.

Not measured. [Inferred]

### Account and sign-in rules

Expected on Android: Account deletion and data safety requirements. Note the date checked.

Not verified. Sign-in rules and account deletion were not checked. [Inferred] Checked: 2026-10-15 against the public web only.

### Platform conformance

Expected on Android: For each important component: what Android expects, what this app does, and why it deviates.

The app is expected to share the red, Roboto-like type and poster rows with the web. [Inferred]

## Platform: Web

The home page, a city movie listing and a city home, measured at 1440 and 390 wide.

### Back and up navigation

Expected on Web: Browser back, breadcrumbs.

Browser back. [Observed]

### Primary navigation

Expected on Web: Top nav or sidebar.

A white header with a 36 high search field (4px corner, `#eeeeee` border), a region chooser and a small red Sign in button, 25 high. Below it, a row of category links (Movies, Stream, Events, Plays, Sports) at 14. [Measured]

### Main action

Expected on Web: Page-level button.

Choosing a poster in a row. The Contact button for listing an event is red `#dc354b`, 50 high with an 8px corner. [Measured]

### Sheets, dialogs and messages

Expected on Web: Modals, toasts.

On first visit a "Pick a region" dialog opens over a dark scrim, with popular city icons and a red "Detect my location" link. [Measured]

### Controls

Expected on Web: Native or custom.

Filters on the movie listing are 32 high: language pills with a 16px corner and a `#cccccc` hairline, and format tags with square corners and an `#e5e5e5` hairline, both with red text. [Measured]

### Text sizing

Expected on Web: Browser zoom.

Sizes are fixed pixel values, mostly 12 to 16 with 24 headlines. [Measured]

### Touch and pointer targets

Expected on Web: Pointer and keyboard.

Filters are 32 high, search 36, Sign in 25 and the Contact button 50. [Measured]

### Insets and system bars

Expected on Web: Viewport, scrollbars.

Not measured. [Inferred]

### Icons

Expected on Web: Any.

Not measured. [Inferred]

### Account and sign-in rules

Expected on Web: Not applicable unless the product has accounts.

Not checked on the pages measured. [Observed]

### Platform conformance

Expected on Web: For each important component: what the web norm is, what this app does, and why it deviates.

A poster-led catalog that asks for a region before showing anything, then keeps type small and lets the posters carry the color. [Observed]

## Cross-platform consistency

Consistent across platforms: the red, Roboto-like type and poster rows. [Measured for web, Inferred for the apps]

Intentionally different: not measured. [Inferred]

## Do's and Don'ts

### Do

- Use the red for links, selected filters and the main action.
- Let posters carry the color, and keep text charcoal and small.
- Use 32 high filters with red text.
- Close pages with charcoal bands.

### Don't

- Don't fill large areas with red.
- Don't use pure black text.
- Don't make filters solid red.

## Known Gaps

- Seat selection, checkout and the account need an account and were not measured.
- The iOS and Android apps were not captured, and BookMyShow publishes no design system, so every mobile topic is inferred.
- Icons and motion were not measured.
- The Sign in button (25) and filters (32) are below the 44 and 48 touch minimums. That is the shipped size.
- White text on the Sign in red `#eb4e62` measures 3.62 to 1, below 4.5 to 1. That is the shipped pairing and was kept.
- Account deletion and store policy rules were not verified.
