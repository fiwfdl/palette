# Starter — Architecture

Placeholder for architecture decisions in a derived project. Replace this file
with your ADRs as the project evolves.

## Decisions

- **Static-first.** Astro renders pages to static HTML; interactivity is opt-in
  through React islands so the default route ships no client framework.
- **Semantic tokens only.** All colour resolves through OKLCH tokens in
  `src/styles/tokens.css`; components never hard-code colour values.
- **Maintained primitives.** Dialog, tabs, accordion, toggle, tooltip, and
  switch delegate behaviour to Radix rather than hand-rolled implementations.
- **Self-hosted type.** Fonts are served from `public/fonts` with no
  third-party runtime requests.

## Non-goals

- No backend, auth, database, or server-rendered data.
- No state management library; island-local state is sufficient.
- No CSS-in-JS runtime.
