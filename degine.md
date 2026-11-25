---
version: 1
name: "Warm Heirloom Editorial Mobile"
colors:
  primary: "#D95A40"
  on-primary: "#FFFFFF"
  secondary: "#5A6B41"
  on-secondary: "#FFFFFF"
  accent: "#8FA382"
  surface: "#FDFCF8"
  surface-alt: "#F4EFE6"
  on-surface: "#2D2B26"
  on-surface-variant: "#8F8D84"
  border: "#EAE5DB"
  destructive: "#C47055"
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 36px
    fontWeight: 500
    lineHeight: 40px
    letterSpacing: -0.02em
  display-md:
    fontFamily: Fraunces
    fontSize: 30px
    fontWeight: 500
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Fraunces
    fontSize: 24px
    fontWeight: 500
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Fraunces
    fontSize: 20px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Fraunces
    fontSize: 18px
    fontWeight: 500
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.02em
  label-uppercase:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: 700
    lineHeight: 14px
    letterSpacing: 0.2em
  numeral-step:
    fontFamily: Fraunces
    fontSize: 48px
    fontWeight: 500
    lineHeight: 48px
    letterSpacing: -0.02em
rounded:
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 40px
  full: 9999px
  shape: squircle
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  card-padding: 24px
  section-gap: 40px
icons:
  set: phosphor
  default_variant: regular
  active_variant: duotone
  bold_variant: bold
  fill_variant: fill
  stroke_weight: 1.5px
  default_size: 20px
components:
  card:
    backgroundColor: "{colors.surface-alt}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
    border: none
    boxShadow: "0 1px 2px rgba(90,80,70,0.04)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.headline-md}"
    rounded: "{rounded.lg}"
    paddingX: 24px
    paddingY: 20px
    border: none
    boxShadow: "0 12px 30px rgba(217,90,64,0.25)"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    paddingX: 24px
    paddingY: 12px
    border: none
    boxShadow: "0 1px 2px rgba(90,80,70,0.04)"
  button-text:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    paddingX: 4px
    paddingY: 4px
    border: none
    boxShadow: none
  button-soft:
    backgroundColor: "rgba(217,90,64,0.10)"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    paddingX: 20px
    paddingY: 10px
    iconSize: 20px
    gap: 8px
    border: none
    boxShadow: none
  input-text:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    paddingX: 16px
    paddingY: 16px
    iconSize: 20px
    border: none
    boxShadow: none
    focusRingColor: "{colors.secondary}"
  chip:
    backgroundColor: "{colors.surface-alt}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    paddingX: 24px
    paddingY: 12px
    border: none
    boxShadow: none
  chip-active:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    paddingX: 24px
    paddingY: 12px
    border: none
    boxShadow: "0 1px 2px rgba(90,80,70,0.04)"
  chip-tag:
    backgroundColor: "rgba(244,239,230,0.5)"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    paddingX: 16px
    paddingY: 8px
    borderColor: "{colors.border}"
    borderWidth: 1px
    boxShadow: none
  badge-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    paddingX: 12px
    paddingY: 4px
    border: none
    boxShadow: none
  badge-circle:
    backgroundColor: "rgba(255,255,255,0.20)"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    size: 40px
    iconSize: 20px
    border: none
    boxShadow: "0 8px 24px rgba(0,0,0,0.20)"
  avatar:
    backgroundColor: "{colors.surface-alt}"
    rounded: "{rounded.full}"
    size: 48px
    border: none
    boxShadow: "0 1px 2px rgba(90,80,70,0.04)"
  list-row:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    paddingX: 0px
    paddingY: 16px
    gap: 16px
    border: none
    boxShadow: none
  top-app-bar:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    height: 56px
    paddingX: 24px
    border: none
    boxShadow: none
  tab-bar:
    backgroundColor: "rgba(253,252,248,0.85)"
    rounded: "{rounded.full}"
    width: 260px
    height: 64px
    paddingX: 32px
    borderColor: "rgba(255,255,255,0.40)"
    borderWidth: 1px
    boxShadow: "0 16px 50px rgba(90,80,70,0.12)"
  tab-item-active:
    textColor: "{colors.primary}"
    iconSize: 28px
    border: none
    boxShadow: none
  tab-item-inactive:
    textColor: "{colors.on-surface-variant}"
    iconSize: 28px
    border: none
    boxShadow: none
---

# Warm Heirloom Editorial Mobile

## Overview

**Warm, considered, magazine-shelf editorial.** This aesthetic feels like a well-art-directed cookbook printed on uncoated cream stock — generous whitespace, large serif headlines that take their time, soft mineral colors, and full-bleed photography that does the heavy lifting. Nothing shouts; the visual hierarchy is built from typographic contrast (serif display vs. quiet sans body) rather than color saturation or chrome ornament.

The mood is **slow, tactile, and grown-up**. Where a generic mobile aesthetic might lean glossy or hyper-flat, this one chooses warm cream surfaces, terracotta and sage accents, and a single boldly-set serif voice for every title. It rewards full-bleed imagery and confident negative space, and it punishes visual noise — busy borders, heavy shadows, or saturated UI fills break its quiet immediately.

The result feels suited to content that wants to be *savored*: long-form reading, curated catalogs, journaling, recipe-style step content, anything where the photograph and the headline are the experience.

## Colors

The palette is a warm earth-tone system — cream paper as the base, a terracotta `{colors.primary}` as the only true brand accent, and a deeper sage `{colors.secondary}` as the calm structural counterweight.

- `{colors.surface}` — the cream paper. Every page background. Never replaced by white.
- `{colors.surface-alt}` — warmer biscuit tone for inputs, soft cards, inactive chips, and any field that needs to recede half a step from the page.
- `{colors.on-surface}` — near-black warm charcoal for all primary text. Never pure black.
- `{colors.on-surface-variant}` — muted taupe for metadata, captions, helper labels, inactive icons, eyebrow kickers.
- `{colors.border}` — barely-there hairline divider, only between major content blocks.
- `{colors.primary}` — terracotta. Reserved for: the single primary CTA per screen, active-state link text ("See all", "View Recipe"), the active tab icon, accent kickers, soft-tint pill buttons (used at ~10% alpha background). Never used as a large surface fill.
- `{colors.secondary}` — sage green. The "selected / on" state for chips, filter buttons, checkboxes, and focus rings. Lower-energy than primary; use it for selection without celebration.
- `{colors.accent}` — lighter sage; reserved for subtle interior tinting and illustration palette work.
- `{colors.destructive}` — muted clay-rose for warnings and informational call-outs. Always used at low alpha (5–10%) for the surface, full saturation for icon and text.

**Palette boundaries:** terracotta and sage do not appear together as adjacent fills. Surfaces are cream or biscuit only — never terracotta-as-card-background, never sage-as-page-background. Imagery brings its own colors; UI chrome stays neutral so photographs can carry the room.

## Typography

Two-family system with a clear job split:

- **Fraunces** (serif, weight 500) — every title, every step numeral, every CTA label. The signature voice. Slightly compressed tracking (`-0.01em` to `-0.02em`) to keep it editorial rather than decorative.
- **Inter** (sans, weights 400/500/600/700) — every body text, every metadata line, every chip / button / form label. Quiet and neutral so the serif can sing.

Role assignments:

- `{typography.display-lg}` — detail-screen primary title (the one big serif at the top of a hero content page).
- `{typography.display-md}` — auth / hero screen entrances.
- `{typography.headline-lg}` — section anchors on a feed ("Section title").
- `{typography.headline-md}` — card titles inside hero imagery, button label on the primary CTA.
- `{typography.headline-sm}` — secondary card titles, list-row item titles.
- `{typography.body-md}` — paragraph copy, step instructions.
- `{typography.body-sm}` — caption, metadata next to icons (time, count, rating).
- `{typography.label-md}` — chip labels, secondary buttons, "See all" link.
- `{typography.label-sm}` — pill badges ("Editor's Pick"-style status tags).
- `{typography.label-uppercase}` — tracked-out micro-kickers above values ("PREP", "COOK", "SERVES" pattern). Always uppercase, always +0.2em letter-spacing — load-bearing visual choice.
- `{typography.numeral-step}` — oversized serif step numerals rendered at 30% alpha of the secondary color, used as decorative anchors next to step content.

Weight rule: the serif lives at 500 (book weight). Bold serif is reserved and rare. Sans body is 400; sans labels are 500; sans uppercase kickers are 700 to compensate for letter-spacing's loss of density.

## Spacing & Layout

**Generous and unhurried.** Side gutter is `{spacing.gutter}` (24px) — enough to let serif headlines breathe without bumping the edge. Vertical rhythm uses `{spacing.section-gap}` (40px) between major sections, never less.

Card-internal padding is `{spacing.card-padding}` (24px), always symmetric. List rows separate with vertical gap `{spacing.xl}` (32px) rather than dividers, except for the major hairline below the kicker-label metadata strip on detail screens.

The aesthetic prefers to leave *more* whitespace than is structurally necessary; the reader's eye should always have somewhere to rest.

## Elevation & Depth

Mostly flat with one signature depth move: **the lifted floating tab bar**.

- Cards and tiles sit nearly flush with the page (`0 1px 2px rgba(90,80,70,0.04)` or no shadow at all). Separation is achieved by the surface-alt biscuit tone, not by shadow.
- The primary CTA carries a soft warm color-tinted glow (`0 12px 30px rgba(217,90,64,0.25)`) — the only place a saturated shadow appears.
- The bottom navigation is a pill that floats with a long, soft, warm-toned shadow (`0 16px 50px rgba(90,80,70,0.12)`), backed by an 85% alpha cream surface and `backdrop-blur-xl` so the page subtly bleeds through.
- Glassmorphic chrome on imagery: top-bar back/bookmark buttons over photography use `bg-white/20 backdrop-blur-md` with a soft drop shadow.
- Detail screens use a signature **upward-curling sheet**: the content panel lifts in front of the hero image with `rounded-t-[40px]` and `-mt-16` overlap, casting a strong but soft `shadow-2xl` upward. This is the one place a heavy shadow is welcome.

## Shapes

Squircle/superellipse corners throughout — softer and more organic than standard CSS rounding. Combined with generous radii, this is what gives the aesthetic its "ceramic" feel rather than "tech rectangle" feel.

- `{rounded.sm}` (8px) — checkbox squares, very small inline marks.
- `{rounded.md}` (12px) — small tag chips with hairline borders, info call-out boxes.
- `{rounded.lg}` (16px) — inputs, primary CTA buttons, image thumbnails on list rows.
- `{rounded.xl}` (24px) — cards (ingredient panels, info containers), call-out boxes.
- `{rounded.2xl}` (40px) — the hero detail-sheet top corners; large hero imagery (`rounded-3xl` ≈ 32px also used on hero feed cards).
- `{rounded.full}` — chips, pill buttons, the floating tab bar, badges, all avatars, all icon-only circular buttons.

**Squircle implementation note:** the source CSS sets `--shape: squircle` and a `--shape-multiplier: 2.5` under `@supports (corner-shape: squircle)`. To reproduce: declare `corner-shape: squircle` on the root and multiply each radius token by 2.5 when the browser supports it; fall back to standard `border-radius` otherwise. Component snippets use plain Tailwind `rounded-*` utilities — the squircle behavior comes from the global theme, not from the snippet markup. Critically, `rounded-full` and `rounded-none` always opt out of the multiplier and use standard rounding, so pills and pill-bars stay perfectly circular.

## Components

### card

A soft biscuit tile on the cream page. No border, ultra-subtle shadow, generous interior padding. Used to group ingredient lists, quiet info blocks, and modular content panels.

```html
<div class="bg-[#F4EFE6] rounded-[24px] p-6 shadow-[0_1px_2px_rgba(90,80,70,0.04)]">
  <h3 class="font-[Fraunces] text-xl text-[#2D2B26] tracking-tight mb-4">[Card title]</h3>
  <p class="font-[Inter] text-base text-[#2D2B26] leading-relaxed">[Card body]</p>
</div>
```

### button-primary

The single saturated terracotta call-to-action per screen. Serif label (yes — the CTA shares the headline voice). Warm-tinted glow shadow.

```html
<button class="w-full bg-[#D95A40] text-white py-5 rounded-[16px] flex items-center justify-center shadow-[0_12px_30px_rgba(217,90,64,0.25)] active:scale-95 transition-transform">
  <span class="font-[Fraunces] text-xl tracking-wide">[Action label]</span>
</button>
```

### button-secondary

Sage pill, sans label. Used as a calm "selected" or persistent chip-action.

```html
<button class="px-6 py-3 rounded-full bg-[#5A6B41] text-white font-[Inter] font-medium text-sm shadow-[0_1px_2px_rgba(90,80,70,0.04)]">
  [Label]
</button>
```

### button-text

Terracotta inline link. Often paired with a trailing arrow.

```html
<button class="text-[#D95A40] font-[Inter] text-sm font-semibold flex items-center gap-1">
  [Link label]
  <iconify-icon icon="ph:[icon-name]" class="size-[14px]"></iconify-icon>
</button>
```

### button-soft

Soft tinted pill — terracotta text on a 10%-alpha terracotta wash. Used for in-content micro-actions (timer starts, inline helpers).

```html
<button class="inline-flex items-center gap-2 bg-[#D95A40]/10 text-[#D95A40] px-5 py-2.5 rounded-full active:bg-[#D95A40]/20 transition-colors">
  <iconify-icon icon="ph:[icon-name]" class="size-5"></iconify-icon>
  <span class="font-[Inter] text-sm font-bold tracking-wide">[Label]</span>
</button>
```

### input-text

Biscuit-filled, no border, generous padding. Search uses leading magnifying-glass icon and optional trailing clear-icon. Focus ring is sage.

```html
<div class="relative w-full">
  <iconify-icon icon="ph:magnifying-glass" class="absolute left-4 top-1/2 -translate-y-1/2 text-[#8F8D84] size-5"></iconify-icon>
  <input
    type="text"
    placeholder="[Placeholder]"
    class="w-full bg-[#F4EFE6] text-[#2D2B26] placeholder-[#8F8D84] rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A6B41] transition-all"
  />
</div>
```

### chip / chip-active

Pill-shaped horizontal-scroll filter chips. Inactive: biscuit fill. Active: sage fill, white text.

```html
<button class="px-6 py-3 rounded-full bg-[#F4EFE6] text-[#2D2B26] font-[Inter] font-medium text-sm">
  [Chip label]
</button>
<button class="px-6 py-3 rounded-full bg-[#5A6B41] text-white font-[Inter] font-medium text-sm shadow-[0_1px_2px_rgba(90,80,70,0.04)]">
  [Active chip label]
</button>
```

### chip-tag

Quieter rectangular tag with hairline border — used for "trending" / topical word clouds, never for filter selection.

```html
<span class="px-4 py-2 bg-[#F4EFE6]/50 rounded-lg text-sm font-medium border border-[#EAE5DB]">[Tag]</span>
```

### badge-pill

Tiny terracotta status pill, all-caps, tight tracking.

```html
<span class="inline-block bg-[#D95A40] text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">[Status]</span>
```

### badge-circle (glassmorphic icon button over imagery)

Used for save/back/share icon-only actions floating over photography.

```html
<button class="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
  <iconify-icon icon="ph:[icon-name]-bold" class="size-6"></iconify-icon>
</button>
```

### avatar

Circular, soft 1px subtle shadow, no ring.

```html
<img src="[avatar-url]" alt="[Name]" class="w-12 h-12 rounded-full object-cover shadow-sm" />
```

### list-row (image + content)

Square-ish thumbnail on the left, stacked title / metadata / inline link on the right. No divider — vertical gap separates rows.

```html
<div class="flex gap-4">
  <div class="w-32 h-32 rounded-2xl overflow-hidden flex-shrink-0">
    <img src="[image-url]" alt="[Alt]" class="w-full h-full object-cover" />
  </div>
  <div class="flex flex-col justify-center flex-1">
    <h3 class="font-[Fraunces] text-xl leading-tight mb-2">[Item title]</h3>
    <div class="flex gap-3 text-[#8F8D84] text-sm mb-3">
      <span class="flex items-center gap-1"><iconify-icon icon="ph:[icon-name]" class="size-[14px]"></iconify-icon>[Metadata]</span>
      <span class="flex items-center gap-1"><iconify-icon icon="ph:[icon-name]-fill" class="text-[#D95A40] size-[14px]"></iconify-icon>[Metadata]</span>
    </div>
    <button class="self-start text-[#D95A40] text-sm font-semibold flex items-center gap-1">
      [Action] <iconify-icon icon="ph:arrow-right" class="size-[14px]"></iconify-icon>
    </button>
  </div>
</div>
```

### top-app-bar

Transparent over imagery, with two glassmorphic icon buttons (back + secondary action). On non-imagery screens, the bar is implicit — just a serif `{typography.display-lg}` title with no chrome.

```html
<div class="absolute top-0 w-full p-6 pt-12 flex justify-between items-center z-20">
  <button class="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
    <iconify-icon icon="ph:arrow-left-bold" class="size-6"></iconify-icon>
  </button>
  <button class="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform">
    <iconify-icon icon="ph:[icon-name]-bold" class="size-6"></iconify-icon>
  </button>
</div>
```

### tab-bar / tab-item-active / tab-item-inactive

A floating, fixed-width 260×64 cream pill, blurred translucent, hovering 8px above the bottom edge. Holds 4 duotone Phosphor icons. Active icon is terracotta; inactive is muted taupe. No labels, no active-pill background — color shift alone signals state.

```html
<nav class="fixed bottom-8 left-1/2 -translate-x-1/2 w-[260px] h-[64px] bg-[#FDFCF8]/85 backdrop-blur-xl shadow-[0_16px_50px_rgba(90,80,70,0.12)] rounded-full px-8 flex justify-between items-center z-50 border border-white/40">
  <a href="#" class="text-[#D95A40] flex items-center justify-center active:scale-90 transition-transform">
    <iconify-icon icon="ph:[icon-name]-duotone" class="size-7"></iconify-icon>
  </a>
  <a href="#" class="text-[#8F8D84] hover:text-[#D95A40] flex items-center justify-center active:scale-90 transition-transform">
    <iconify-icon icon="ph:[icon-name]-duotone" class="size-7"></iconify-icon>
  </a>
  <a href="#" class="text-[#8F8D84] hover:text-[#D95A40] flex items-center justify-center active:scale-90 transition-transform">
    <iconify-icon icon="ph:[icon-name]-duotone" class="size-7"></iconify-icon>
  </a>
  <a href="#" class="text-[#8F8D84] hover:text-[#D95A40] flex items-center justify-center active:scale-90 transition-transform">
    <iconify-icon icon="ph:[icon-name]-duotone" class="size-7"></iconify-icon>
  </a>
</nav>
```

## Iconography

**Iconify set: `phosphor`.** The Phosphor family's rounded terminals, generous interior space, and consistent stroke weight match the warm, ceramic feel of the rest of the system. Stiff or sharp sets (Lucide, Tabler) would betray it.

Variant convention:
- **Default / inline metadata icons:** Phosphor *regular* — used for time, info, helper marks next to body text.
- **Bottom-tab icons (active and inactive both):** Phosphor *duotone* — softens the chrome and gives the bar its boutique feel.
- **Action / chrome icons over imagery:** Phosphor *bold* — back, save, close. Heavier weight ensures legibility against photography.
- **Inline emphasis fill (e.g. star ratings):** Phosphor *fill* — terracotta tint.

**Phosphor regular-variant rule (critical):** the *regular* variant is the bare icon name with **no suffix**. Write `ph:clock`, `ph:magnifying-glass`, `ph:bookmark-simple` — never `ph:clock-regular` (that icon does not exist and will render as a missing-glyph). Suffixed variants (`-bold`, `-fill`, `-duotone`, `-light`, `-thin`) all do exist and are valid.

Default rendered size is 20px for inline icons, 14–16px for icons paired with body-sm metadata, 24px for chrome buttons, 28px for tab-bar duotone icons. Icon sizing always uses Tailwind `size-*` / `size-[Npx]` classes — never HTML `width`/`height` attributes.

## Illustration & Imagery

This aesthetic is **photography-led**, not illustration-led. Every visible image in the source HTML is a richly-styled food/portrait photograph — there is no vector or 2D illustration anywhere. Image style is therefore the most load-bearing visual choice in the system after typography.

- **Style / Technique**: Editorial cookbook photography. Naturalistic, warmly-lit, slightly desaturated overall but with rich color in the subject. Shallow-to-medium depth of field — the subject is crisp; the background falls off into soft bokeh or honest, slightly-textured surface. Looks shot, not rendered: visible texture on bread crusts, tomato flesh, fabric, wood grain.
- **Palette**: Warm and earthy. Subjects sit on wood-plank, parchment, terracotta, or warm-cream surfaces. Highlights skew amber/honey; shadows skew warm brown rather than cool blue. Greens are deep and chlorophyll-rich (sage, spinach, herb), never neon. Reds skew toward terracotta and heirloom rather than fire-engine. Avoid cool blue casts entirely.
- **Edge treatment**: None — these are photographs, not vectors. No outlines, no traced silhouettes.
- **Shading & light**: Single dominant warm key light (window light or candle warmth). Soft, diffused, golden-hour-adjacent. Long gentle shadows; no harsh specular highlights. Even portraits use the same warm key.
- **Composition & framing**: Subject centered or slightly off-center, generously filling the frame. Top-down (flatlay) for compositional foods on surfaces; three-quarter macro for plated dishes; honest eye-level for portraits. Negative space lives in the surrounding tabletop / fabric / wall, not cropped into the subject.
- **Background within the image**: Real surfaces — wood plank, linen, ceramic, parchment, plaster wall. Often slightly out of focus. Always warm-toned. Never a solid colored studio sweep, never a UI-tinted gradient.
- **Container styling**:
  - Hero feed image: full-width, 256px tall (`h-64`), `rounded-3xl` (~32px squircle) frame, `overflow-hidden`, `shadow-sm`. Bottom 60% receives a black-to-transparent gradient overlay (`bg-gradient-to-t from-black/80 via-black/20 to-transparent`) so white serif title and metadata can sit legibly inside the image.
  - Detail-screen hero image: full-bleed, edge-to-edge, 450px tall, no frame radius, `object-cover`. A short top gradient (`bg-gradient-to-b from-black/40 via-transparent to-transparent`) protects the floating top-bar buttons. The cream content sheet then curls up over the bottom of the image with `rounded-t-[40px]` and `-mt-16`.
  - Recently-viewed grid thumbnails: `aspect-square`, `rounded-2xl` (~24px squircle) frame, `shadow-sm`.
  - List-row thumbnails: `w-32 h-32`, `rounded-2xl`, no shadow.
- **CSS treatment on the `<img>` element**: Always `object-cover`. No `mix-blend-mode`, no `filter`, no `opacity` reduction. Alt text always present. The image is honored, not stylized.
- **Box-shadow on the image or its frame**: Hero feed and grid thumbnails use a subtle `shadow-sm`. Detail-screen full-bleed hero has no shadow on the image itself; the cream sheet that overlaps it carries the depth via `shadow-2xl`. List-row thumbnails are flat — no shadow.
- **Aspect ratio rule**: Hero feed = 16:9-ish (full-width × 256px). Detail hero = 4:5 vertical-ish (full-width × 450px). Grid = 1:1 square. List = 1:1 square at 128px. Always crop to fill (`object-cover`); never letterbox.
- **Anti-references**:
  - NOT illustrated, NOT vector, NOT flat 2D.
  - NOT 3D-rendered, NOT claymation.
  - NOT studio-sweep with a colored-gradient background.
  - NOT high-contrast / saturated / Instagram-filter looks.
  - NOT cool / blue-toned / clinical.
  - NOT cartoon, NOT painterly, NOT watercolor.
  - NOT cropped abstract macros where the subject is unrecognizable.
  - NOT placeholder gray rectangles — if a photograph is unavailable, prefer a warm biscuit (`{colors.surface-alt}`) tile with a centered duotone Phosphor icon in `{colors.on-surface-variant}`, never an empty gray box.
- **Style recipe prompt**:

  > *Editorial cookbook-style photograph of [SUBJECT], natural warm window light, soft diffused golden key from one side, shallow-to-medium depth of field with gentle bokeh, shot on a real material surface (aged wood plank / linen / parchment / warm ceramic), warm earth-tone palette skewing amber, terracotta, sage, and cream — never cool or blue, naturalistic and richly textured rather than glossy, subject centered and generously filling the frame with breathing room around it, honest unfiltered look, magazine art-direction quality, NOT illustrated, NOT 3D, NOT studio sweep background, NOT oversaturated.*

## Hierarchy & Emphasis

Hierarchy in this system is built almost entirely from **typographic contrast** — the serif headline against the sans body — and from **scale**, not from color or weight changes.

Rules:
- The largest serif on a screen is the loudest thing. Period.
- Saturated terracotta is reserved for *one* primary action and a small set of inline accents (link text, active tab, star fills). It is never a card background or a section fill.
- Metadata always whispers: muted taupe color, sans, small size, paired with a small regular-weight icon.
- Eyebrow kickers (the uppercase tracked label above values) carry hierarchy *upward* into a row of stats — they're tiny but intentional.
- Selection state uses the calm sage, not the loud terracotta. Selecting something is a quiet event; performing the primary action is a celebrated event.

## Distinctive Details

1. **Decorative oversized serif numerals at 30% alpha** — step numbers in instructional content render as enormous serif glyphs (48px Fraunces) tinted at `{colors.secondary}` with 30% opacity, sitting beside the step text as a quiet visual anchor rather than a labeled "Step 1:" prefix.
2. **The cream sheet curling over the hero image** — content panels on detail screens lift with `rounded-t-[40px]` over a 16px upward overlap, casting a soft `shadow-2xl`. This single move turns a flat scrolling page into a layered, magazine-spread feel.
3. **Floating pill nav, no labels** — the bottom navigation is intentionally narrow (260px), translucent cream, and label-free. It reads as jewelry, not as chrome.
4. **Tracked-out micro-kickers above values** — the `[10px / 700 / +0.2em / uppercase / muted]` recipe for label kickers is a recurring editorial-magazine signature; reuse it anywhere a numeric value or short data point needs framing.

## Do's and Don'ts

### Do
- Use Fraunces 500 for every title, every CTA label, and decorative numerals.
- Reserve `{colors.primary}` (terracotta) for the single primary action and inline accent text only.
- Use `{colors.secondary}` (sage) for selected / on states — never to celebrate a primary action.
- Let photography go full-width and tall; trust gradient overlays to handle text legibility.
- Frame imagery in squircle radii and let the squircle character do the work — don't reach for square or hard-cornered crops.
- Lean into whitespace. If a layout feels almost-too-airy, it's probably right.
- Pair every metadata line with a small Phosphor regular icon at 14–16px.
- Use the tracked-out uppercase kicker pattern to label numeric values and section eyebrows.

### Don't
- Don't write `ph:[name]-regular` for Phosphor icons — the regular variant has no suffix.
- Don't put terracotta or sage on a full card or page background. Surfaces are cream / biscuit only.
- Don't reach for pure white or pure black. The system lives between `{colors.surface}` cream and `{colors.on-surface}` warm charcoal.
- Don't add heavy borders or hard shadows to cards — separation comes from the biscuit tone, not from chrome.
- Don't mix sans into the title role or serif into the body role. The two-voice split is the system.
- Don't use cool / blue-toned photography or studio-sweep product shots. They will fight the warm palette and look pasted in.
- Don't add labels under the bottom-tab icons. The pill is intentionally label-free.
- Don't introduce a third accent color. Terracotta and sage are the only two saturated voices.
- Don't bold the serif unnecessarily — Fraunces 500 is the working weight; heavier weights are decorative-only.
