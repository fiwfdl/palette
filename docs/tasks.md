# Starter — Tasks

Tracks work for a project derived from this template. Replace this file with
your project's slice history and current status.

## Done — Foundation

- [x] Astro project at repo root with Tailwind v4 wired.
- [x] `src/styles/tokens.css` — OKLCH triplet tokens, light + dark, every
      semantic pair (`background` … `success-foreground`).
- [x] `src/styles/global.css` — Tailwind theme mapping + base styles, focus
      ring, `prefers-reduced-motion` handling.
- [x] `BaseLayout.astro` — theme bootstrap inline script, skip link, landmarks.
- [x] `Header.astro` — wordmark, section anchors, CTA.
- [x] `Footer.astro` — wordmark, tagline, footer nav.
- [x] `ThemeToggle.tsx` — Radix Switch; defaults to `prefers-color-scheme`,
      persists to `localStorage`, flips `.dark` on `<html>`.
- [x] Generic home page with a lucide-react + motion feature island.
- [x] `docs/CONTEXT.md`, `docs/tasks.md`, `docs/art-direction.md`,
      `docs/architecture.md` seeded.
- [x] Static foundation tests (`tests/`).
- [x] GitHub Actions CI running lint, test, check, and build.

## Next

- [ ] Replace placeholder branding and copy.
- [ ] Set your palette in `src/styles/tokens.css`.
- [ ] Wire the deploy target and repository variables used by
      `.github/workflows/milestone-notify.yml`.
