# Starter — Art Direction

Source of truth for palette, type, grid, and motion. Every page built from the
template should build against this document. Values live in
`src/styles/tokens.css`, `src/styles/fonts.css`, and `src/styles/global.css`.

## Positioning

A neutral, technical foundation for product sites. Confident and calm rather
than loud. The starter provides the system; each project supplies its own
positioning and copy.

## Palette

Light-first, cool near-neutral OKLCH ramp with one confident accent.

| Role    | Light                   | Dark             | Notes                                  |
| ------- | ----------------------- | ---------------- | -------------------------------------- |
| base    | `0.99 0.004 250`        | `0.16 0.015 260` | near-white / deep ink, both cool       |
| surface | `0.975 0.006 250`       | `0.2 0.018 260`  | one step off base for banding          |
| primary | `0.52 0.2 265` (violet) | `0.72 0.16 265`  | the single confident accent            |
| accent  | `0.93 0.03 205` (cyan)  | `0.32 0.05 210`  | faint cyan, never a second loud colour |
| success | `0.47 0.15 155`         | `0.7 0.14 155`   | AA as text on its tint and on fill     |
| danger  | `0.55 0.2 25`           | `0.66 0.18 25`   | AA as text on its tint and on fill     |

- Dark is a **designed pair**, not an inversion: hue drifts cool, chroma drops.
- All colour is semantic. Components never use raw hex, `rgb(`, or `hsl(`.
- Every solid-fill text pair is ≥ 4.5:1 in both themes (enforced by
  `tests/design-foundation.test.mjs`, which computes OKLCH → sRGB → WCAG).

## Type

Two families, self-hosted as `.woff2` in `public/fonts` — no CDN, no tracking.

- **Display / headings — Space Grotesk** (technical grotesque). Geometric,
  slightly quirky; carries an "engineered" voice at large sizes.
- **Body / UI — IBM Plex Sans** (neutral grotesque). Open and legible at small
  sizes; pairs without competing with the display face.

Fixed type scale (tokens `--text-xs` … `--text-6xl` in
`src/styles/tokens.css`, mapped through Tailwind):

`12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 52 · 64`

Headings use `--font-display`, tight tracking (`-0.02em`), and `line-height: 1.1`.
Body uses `--font-sans` at `line-height: 1.6`, line length under 80 characters.

## Grid & geometry

- Container `--layout-max: 72rem`, fluid gutter `--layout-gutter`, `--grid-unit`
  as the base spacing unit, `--section-rhythm` for vertical band rhythm.
- Geometry is the ordering motif, not decoration: a single faint **ring** marks
  the start of a page or section and groups content. `.field-ring` (in
  `global.css`) is the foundation home for the motif and uses `--ring-width`.

## Motion

- Motion answers an action (open, expand, select, scroll into view) and shows
  what changed. No parallax, no auto-play.
- `prefers-reduced-motion: reduce` removes transitions and smooth scroll
  globally and disables entrance animations.

## Accessibility bar

- WCAG AA contrast in both themes; visible `:focus-visible` ring on every
  interactive element; keyboard path through nav and controls; landmark
  structure; reduced motion honoured.
