# Starter — Project Context

## What this is

A generic, static, single-route web starter. It is intentionally
content-free: the copy, branding, and sections on the home page are
placeholders meant to be replaced by the project that adopts the template.
There is no backend, auth, database, or server data.

## Stack

- **Astro** (static output, single route `/`).
- **Tailwind CSS v4** via the `@tailwindcss/vite` plugin.
- **React islands** + **Radix primitives** for interactive pieces.

## Layout

```
src/
  components/
    Header.astro, Footer.astro, ThemeToggle.tsx
    StarterPanel.tsx            feature island (lucide-react + motion)
    ui/                         toggle.tsx, tooltip.tsx, dialog.tsx,
                                tabs.tsx, accordion.tsx
  layouts/      BaseLayout.astro (html shell, theme bootstrap, landmarks)
  lib/          utils.ts (cn helper)
  pages/        index.astro
  styles/       tokens.css (OKLCH + type/geometry), global.css (Tailwind +
                mapping), fonts.css
docs/           CONTEXT.md, tasks.md, art-direction.md, architecture.md
public/fonts/   self-hosted Space Grotesk / IBM Plex Sans woff2
tests/          foundation, design-foundation, dependency-security (node:test
                static checks)
scripts/        deploy-previews.sh (branch preview deploys)
```

## Design system

Art direction (palette, type, grid, motion, motif): [`docs/art-direction.md`](./art-direction.md).

- Colour tokens live only in `src/styles/tokens.css` as **OKLCH triplets**
  (`--background: 0.99 0.004 250;`) for light (`:root`) and dark (`.dark`).
- `src/styles/global.css` maps every token to a Tailwind colour utility with
  `oklch(var(--token))`. Components use semantic classes only — no raw hex,
  `rgb(`, or `hsl(` in component files.
- Type: Space Grotesk (display) + IBM Plex Sans (body), self-hosted via
  `src/styles/fonts.css` from `public/fonts/*.woff2`; fixed scale tokens
  `--text-xs`…`--text-6xl` and families `--font-display`/`--font-sans`.
- Geometry tokens `--layout-max`, `--layout-gutter`, `--grid-unit`,
  `--section-rhythm`, `--ring-width` back the ring ordering motif.
- Semantic tokens: `background/foreground`, `surface/surface-foreground`,
  `card/card-foreground`, `primary/primary-foreground`,
  `secondary/secondary-foreground`, `muted/muted-foreground`,
  `accent/accent-foreground`, `border`, `input`, `ring`,
  `destructive/destructive-foreground`, `success/success-foreground`.

## Theming

- An inline script in `BaseLayout.astro` runs before paint: it reads
  `localStorage["entrypoint-theme"]`, falls back to `prefers-color-scheme`, and
  toggles `.dark` on `<html>` plus `color-scheme`.
- `ThemeToggle.tsx` is a **Radix Switch**; flipping it updates the class and
  persists the choice.

## Commands

| Command           | Purpose                           |
| ----------------- | --------------------------------- |
| `npm run dev`     | Astro dev server                  |
| `npm run build`   | Static build to `dist/`           |
| `npm run preview` | Serve the built output            |
| `npm run lint`    | Prettier check                    |
| `npm run check`   | `astro check` (types + templates) |
| `npm test`        | Static foundation checks          |

## Deploy

Static output: build `npm run build`, publish `dist` to Cloudflare Pages.

- **Canonical URL:** <https://palette-aeq.pages.dev>
- **Cloudflare Pages project:** `palette` (Direct Upload, production branch `main`).
  The generated project subdomain is `palette-aeq.pages.dev`; it does **not**
  match the repo or project name, so never derive the host as
  `<repo>.pages.dev`.
- **Branch previews:** `https://<branch-slug>.palette-aeq.pages.dev`. Because the
  project uses Direct Upload (no Cloudflare Git integration), previews are
  published by `scripts/deploy-previews.sh` (the "Palette preview auto-deploy"
  routine runs it with `PAGES_PROJECT=palette REPO_SLUG=fiwfdl/palette`).
- **Milestone comments:** `.github/workflows/milestone-notify.yml` reads the
  Pages host from the Cloudflare Pages API (`CLOUDFLARE_ACCOUNT_ID` variable and
  `CLOUDFLARE_API_TOKEN` secret); `vars.PAGES_DOMAIN` overrides it and
  `palette-aeq.pages.dev` is the fallback.

## Accessibility & theming contract

- Every interactive element is keyboard reachable with a visible
  `:focus-visible` ring (global outline plus Radix wrappers' ring utilities).
- Skip link (`#main`, `tabindex="-1"`) is the first tab stop.
- Landmarks: one `<header>`, one `<main>`, one `<footer>`, labelled primary and
  footer navs.
- All colour resolves through semantic OKLCH token pairs; component files hold
  no raw hex / `rgb(` / `hsl(`.
- Interactive behaviour (tabs, accordion, dialog, tooltip, switch) is delegated
  to Radix; no hand-rolled menus, dialogs, or focus traps.
- `prefers-reduced-motion: reduce` neutralises transitions and animations; the
  feature island renders without an entrance animation.
