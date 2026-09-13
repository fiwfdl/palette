# Entry Point — Web Starter

A generic static web starter built with Astro, Tailwind CSS v4, and
shadcn-style React islands. It ships the foundation most projects rebuild
first: semantic design tokens, a self-hosted type system, accessible Radix
primitives, a theme toggle, and CI checks.

This repository is a GitHub template. Use **Use this template → Create a new
repository** to start a project from it.

## Use this template

1. Click **Use this template** at the top of this repository and create a new
   repository.
2. Clone your new repository and install dependencies:

   ```bash
   npm install
   ```

3. Replace the placeholder branding (`Starter`), copy, and section links in
   `src/components/Header.astro`, `src/components/Footer.astro`,
   `src/layouts/BaseLayout.astro`, and `src/pages/index.astro`.
4. Adjust the semantic tokens in `src/styles/tokens.css` to your palette.
5. Update `docs/CONTEXT.md` and `docs/tasks.md` for your project.
6. Run the local checks before your first commit:

   ```bash
   npm run lint
   npm test
   npm run check
   npm run build
   ```

## Commands

| Command           | Purpose                           |
| ----------------- | --------------------------------- |
| `npm run dev`     | Astro dev server                  |
| `npm run build`   | Static build to `dist/`           |
| `npm run preview` | Serve the built output            |
| `npm run lint`    | Prettier check                    |
| `npm run check`   | `astro check` (types + templates) |
| `npm test`        | Static foundation checks          |

## What is included

- Astro static output with React islands (`@astrojs/react`).
- Tailwind CSS v4 via `@tailwindcss/vite`, mapped to semantic OKLCH tokens.
- Self-hosted fonts (Space Grotesk + IBM Plex Sans) with no CDN requests.
- Radix primitives: dialog, accordion, tabs, toggle, tooltip, switch.
- Light/dark theming with a pre-paint bootstrap and a Radix Switch toggle.
- GitHub Actions CI that runs lint, tests, type checks, and a build.

## Docs

- `docs/CONTEXT.md` — what the starter is and how it is laid out.
- `docs/tasks.md` — task/status tracking for a derived project.
- `docs/art-direction.md` — palette, type, grid, motion, and motif.
- `docs/architecture.md` — architecture decisions placeholder.

## Deploy

The starter is deploy-ready as static output (`dist/`). Wire a host such as
Cloudflare Pages or GitHub Pages and set the repository variables used by
`.github/workflows/milestone-notify.yml` if you want PR milestone comments to
carry live URLs.
