# Hotel Etuna — Design System

**Version:** 1.1.0 · **Updated:** 2026-06-22
**Colour source of truth:** `docs/brand/Hotel-Etuna-CI-Guide-Extract.pdf`
**Token implementation:** `tailwind.config.ts` (`ci.*`) + `app/globals.css` (`:root` mirror) + `lib/copy/brand.ts`

This document consolidates the brand identity from the CI guide with the structural discipline
adapted from the Airbnb browse-pattern reference. It supersedes the scattered notes in PRD §9.1–9.7,
the config comments, and `HOTEL_ETUNA_OS.md` as the single human-readable reference. Where this doc
and a code comment disagree, **the PDF wins for colour, this doc wins for rules, and the config wins
for the exact hex token names.**

Hotel Etuna is the operating system for **one flagship property** — a warm, mid-premium Namibian
hospitality brand. The visual language is **warm-luxury serif**, not a cool marketplace. We borrow
Airbnb's *discipline* (surface ladder, accent scarcity, radius vocabulary, elevation restraint,
photography-first composition) without ever adopting its palette or its sans-serif voice.

---

## 1. Colour — the CI palette (authoritative)

The full-colour logo uses **only** the two primary colours, and **Rustic Red is always dominant.**

### Primary

| Token | Hex | Role |
|-------|-----|------|
| `ci.primary` — Rustic Red | `#790C19` | Logo mark, primary CTA, favicon, `theme-color`, active states, key emphasis |
| `ci.cream` | `#F3E8D7` | Logo cream, `primary-content`, warm secondary surface |

### Secondary — *blend with primary; never used in isolation from it*

| Token | Hex | Role |
|-------|-----|------|
| `ci.secondary.tan` | `#DABC92` | Sub-headings, soft fills |
| `ci.secondary.taupe` | `#A58B72` | Tables, pull quotes *(CI-corrected — see §1.1)* |
| `ci.secondary.chocolate` | `#4B3428` | Deep text, near-black UI ink, `neutral` |
| `ci.secondary.gold` | `#D4AF37` | VIP / celebration moments **only** |
| `ci.secondary.crimson` | `#BA082C` | Emphasis accents |

### Accent — *dimension, data-viz, icons; prefer alongside primary + secondary*

| Token | Hex | Role |
|-------|-----|------|
| `ci.accent.ochre` | `#9A7D43` | Data-viz, icons *(not body text — fails AA)* |
| `ci.accent.gold` | `#C6A46A` | Highlights |
| `ci.accent.offWhite` | `#FAF6F0` | Canvas |
| `ci.accent.forest` | `#5E6651` | Nature depth |
| `ci.accent.sage` | `#9BAE8A` | Nature accent |
| `ci.accent.terracotta` | `#6D3722` | Heading / neutral accent |
| `ci.accent.rose` | `#C89B95` | Soft decorative |

### 1.1 Reconciliations against the PDF (resolved in v1.1.0)

1. **Taupe was wrong.** The CI guide (page 3) prints taupe as `#A58B72`; both `tailwind.config.ts`
   and PRD §9.1 had mis-transcribed it as `#B58B72`. Corrected to the PDF value across
   `tailwind.config.ts`, `lib/copy/brand.ts`, and PRD §9.1.
2. **The guide has a typo.** The secondary row prints a 6th swatch mislabeled `#4B3428` that renders
   red (chocolate is already swatch 3). We resolve to the 5 secondary tokens above; `crimson #BA082C`
   covers the red accent. No token invented for the phantom swatch.

---

## 2. Accent scarcity (Airbnb gem, inverted for Etuna)

Airbnb spends its one signature colour (`#ff385c`) *scarcely* — logo, search button, active states.
Etuna's signature is **Rustic Red `#790C19`**, and the CI guide mandates it be **dominant**. So the
rule inverts but the *discipline* is identical: Rustic Red is reserved for **identity and intent**,
never decoration.

- **Use `#790C19` for:** logo, primary CTAs, active nav/selection, favicon, and a single key
  emphasis per view.
- **Never use `#790C19` as:** a large background wash on content surfaces, body text, or a
  decorative fill competing with itself.
- **`gold #D4AF37` is rationed harder** — VIP, loyalty, and celebration touchpoints only. Gold
  sprayed across normal UI reads as costume jewellery.
- Secondary colours never appear *isolated* from primary (CI rule). Accent colours add dimension and
  belong in charts, icons, and nature imagery.

---

## 3. Surfaces — the warm light ladder

A strict 5-step ladder (Airbnb gem, warmed to CI). Each surface has exactly one job.

| Level | Token | Hex | Purpose |
|-------|-------|-----|---------|
| 0 Canvas | `surface.background` / `--surface-canvas` | `#FAF6F0` | Page background, the paper beneath everything |
| 1 Muted | `surface.muted` / `--surface-muted` | `#F3E8D7` | Cream secondary fills, section bands |
| 2 Card | `surface.card` / `--surface-card` | `#FFFFFF` | Cards, headers, inputs, modals |
| 3 Placeholder | `surface.placeholder` | `#F8DCC0` | Image placeholder before load |
| 4 Skeleton | `surface.skeleton` | `#F2C49F` | Loading pulse overlay |
| — Scrim | `surface.scrim` / `--surface-scrim` | `rgba(42,29,21,.55)` | Espresso tint behind text-over-photo |

Cards are **white on a warm canvas** — the off-white/cream/white separation carries depth without
shadows. Do not introduce new neutral greys; warmth comes from the CI neutrals only.

---

## 4. Ink — text colour ramp (CI-chocolate-anchored, AA-verified)

The previous body-ink story said three different things (nude alias, `text-nude-900`, terracotta).
v1.1.0 resolves it: **all text uses the `ink` ramp**, anchored to CI chocolate and contrast-verified.
`nude-*` is now scoped to surfaces and borders only.

| Token | Hex | Contrast on cream `#F3E8D7` | Use |
|-------|-----|------------------------------|-----|
| `ink-900` | `#4B3428` | 9.5:1 | Body, headings |
| `ink-800` | `#5A4133` | 7.7:1 | Strong text |
| `ink-700` | `#6E5343` | 5.8:1 | Secondary text — **AA normal, all surfaces** |
| `ink-600` | `#785B49` | 5.1:1 | Muted text — **AA normal, all surfaces** |
| `ink-500` | `#927862` | 3.4:1 | Tertiary / large / UI — AA large only |
| `ink-400` `ink-300` | `#B6A493` `#D2C6BA` | — | Decorative / dividers — **not text** |

> The retired `nude-700 #9d5a3a` scored only **4.38:1 on cream** — below AA for normal text. Any
> remaining `text-nude-700` on a cream surface is a contrast bug; migrate it to `text-ink-700`.

**Brand colours as text** (all clear AA normal on every surface): `ci.primary`, `chocolate`,
`terracotta`, `crimson`. **`ochre #9A7D43` fails as body text** (≈3.6:1) — icons/large/data-viz only.

---

## 5. Typography (CI — three faces + mono)

| Face | Token | Weights | Role |
|------|-------|---------|------|
| **Playfair Display** | `font-display` | Regular → Black | Headlines, titles, signage, marketing |
| **Inter** | `font-body` | Light, Regular, Medium | UI, body, booking, menus — 16px base |
| **Dancing Script** | `font-signature` | Regular, Bold | Logo tagline, welcome, promotions — selective |
| JetBrains Mono | `font-mono` | — | Invoices, analytics, code |

**UI type scale** (Airbnb gem: a compact, tuned scale with deliberate tracking; applied to Inter-set
UI text — Playfair carries display/headings per CI):

| Role | Size | Line height | Tracking |
|------|------|-------------|----------|
| `caption` | 11px | 1.29 | +0.04em |
| `body` | 14px | 1.43 | −0.008em |
| `heading-sm` | 20px | 1.25 | −0.011em |
| `heading` | 22px | 1.23 | −0.014em |
| `display` | 28px | 1.18 | −0.035em |

`font-feature-settings: "salt"` is enabled globally (stylistic alternates). Headings use Playfair and
`tracking-tight`.

---

## 6. Radius vocabulary (locked — Airbnb gem, verbatim)

Six values, no improvisation. Arbitrary radii (6/10/24px on UI controls) break the rhythm.

| Token | Value | Use |
|-------|-------|-----|
| `rounded-etuna-badge` | 4px | Badges, chips-on-image |
| `rounded-etuna-button` | 8px | Filter pills, secondary controls |
| `rounded-etuna-input` | 14px | Inputs, selects, textareas |
| `rounded-etuna-card` | 20px | Listing tiles, panels, image cards |
| `rounded-etuna-pill` | 32px | Pills |
| `rounded-full` (50%) | — | Primary CTAs, icon buttons, avatars |

Primary CTAs stay **`rounded-full`** (pill). Filter chips are the deliberate exception at **8px**.

---

## 7. Elevation (Airbnb gem: restraint)

Shadows signal *floating*, nothing else. Flat surfaces use **border + surface colour**.

| Surface | Treatment |
|---------|-----------|
| Browse/listing tiles (`.etuna-listing-card`) | **No shadow.** Border + white-on-canvas. |
| Dashboard / ops cards (`.dashboard-card`, `.etuna-panel`) | **No shadow.** `border-nude-200`, hover → `border-nude-300`. |
| Modals, popovers, dropdowns, sticky booking/search panels | `shadow-etuna-elevated` (3-value stack) |
| Small floating controls (carousel arrows, toggles) | `shadow-etuna-control` (2-value stack) |
| Marketing hero moments only | Legacy warm `shadow-card` / `shadow-nude-*` / `shadow-luxury-*` |

Do **not** reintroduce warm card shadows on browse or ops cards — that was the pre-2026-06 direction.

---

## 8. Component patterns

CSS utilities in `globals.css`; React components in `components/features/marketing/`.

| Pattern | Utility | Component | Notes |
|---------|---------|-----------|-------|
| Listing tile | `.etuna-listing-card` | `EtunaListingCard` | White, 20px radius, no shadow, square image |
| Featured badge | `.etuna-featured-badge` | `EtunaFeaturedBadge` | White pill, 4px, top-left, `shadow-etuna-control` |
| Section header | `.etuna-section-header` | `EtunaSectionHeader` | 22px Playfair + inline link |
| Filter chip | `.etuna-filter-pill` | `EtunaFilterPill` | 8px, bordered; active → chocolate fill |
| Icon button | `.etuna-icon-btn` | `EtunaIconButton` | 40px circle, white, `shadow-etuna-control` |
| Carousel row | `.etuna-carousel-row` | `EtunaCarouselRow` | snap-x, no visible scrollbar |
| Text-over-photo | `.etuna-card-media` + `.etuna-card-scrim` + `.etuna-on-image` | — | Scrim under any copy on imagery |

Etuna is a **property OS, not a destination marketplace** — there is no global search shell.

---

## 9. Imagery & icons (Airbnb gem)

- **Photography** is full-bleed inside rounded (20px) cards, natural light, **no heavy filters or
  colour treatment**. Rooms, food, garden, northern-Namibia scenery — product-focused, not abstract.
- **Never place text directly on a photo.** Use `.etuna-card-scrim` (espresso, not pure black) or a
  white badge surface.
- **Functional icons** are outlined (~1.5px stroke), monochrome in `ink`/`chocolate`. No multicolour
  icon sets, no 3D renders, no stock illustration.

---

## 10. Motion

- Transitions: `fast 150ms`, `normal 200ms`, `slow 300ms` ease.
- **Move, don't fade** — primary hover feedback is a transform (`-translate-y-px`, `gentle-lift`),
  not opacity.
- Respect `prefers-reduced-motion`: shine/float/pulse animations disable (already wired in
  `@layer utilities`).

---

## 11. Do's and Don'ts

**Do**
- Treat `#790C19` as identity, not decoration; one key emphasis per view.
- Set all text from the `ink` ramp; keep `nude-*` for surfaces and borders.
- Keep browse and ops cards flat — border + surface colour, no shadow.
- Use the six-value radius vocabulary and nothing else on UI controls.
- Put a scrim behind any text over photography.
- Reserve `gold #D4AF37` for VIP / loyalty / celebration only.

**Don't**
- Don't use `ochre`, `tan`, or `ink-500` as normal body text (sub-AA).
- Don't reintroduce warm drop-shadows on listing/ops cards.
- Don't use secondary colours isolated from primary (CI rule).
- Don't mix arbitrary radii (6/10/24px) into the radius vocabulary.
- Don't render the logo in anything but the two primary colours for the full-colour mark.
- Don't import a second neutral grey ramp — warmth comes from CI neutrals only.

---

## 12. What changed in v1.1.0

| Change | File | Why |
|--------|------|-----|
| `taupe` `#B58B72` → `#A58B72` | `tailwind.config.ts`, `lib/copy/brand.ts`, PRD §9.1 | Matches CI guide (source of truth) |
| `ink` ramp re-anchored to CI chocolate, AA-verified | `tailwind.config.ts` | Resolves the 3-way body-ink contradiction; old `nude-700` failed AA on cream |
| `surface.scrim` token added | `tailwind.config.ts`, `globals.css` | Text-over-photography support |
| Elevation discipline codified on shadow tokens | `tailwind.config.ts` | Flat cards; floating UI only |
| Full token set exposed as `:root` custom properties | `globals.css` | Usable in email, canvas, charts |
| `.etuna-card-media` / `.etuna-card-scrim` / `.etuna-on-image` | `globals.css` | The "no raw text on photos" gem |
| This document | `docs/brand/DESIGN_SYSTEM.md` | Single consolidated reference |

**Still to do (prose → command, your standard):**
- Migrate any remaining `text-nude-700` on cream surfaces to `text-ink-700` (none found by the
  same-line `cream`/`muted` heuristic on 2026-06-22; audit deeper if a contrast regression appears):
  ```bash
  grep -rn "text-nude-700" app components | grep -i "cream\|muted"   # AA audit
  ```
- Optional design-system guards (not yet present in this repo): `scripts/verify-system-design.js`
  and `tests/design-system.spec.ts`. If/when added, pin the taupe assertion to `#A58B72`.
