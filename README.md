# Artifact

Architecture-first Next.js 16 starter for the AM-ARC-inspired site build.

This repo is intentionally lean, but it now carries the same kind of
project-level documentation discipline as `parallel-app`, adapted to
**Next.js App Router** instead of Vite + React Router.

## Stack

- Next.js 16
- React 19
- TypeScript 5
- Biome 2
- Storio 1.0.6
- App Router under `src/app`

## Quick Start

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
bun run dev
bun run build
bun run start
bun run lint
bun run format
```

## Documentation

- [Chrome MCP cloning guide](CHROME_MCP_CLONING.md)
- [Section cloning with vawzen MCP](docs/section-cloning-with-vawzen.doc.md)
- [Internationalization (EN/FR/ES/AR)](docs/i18n.doc.md)
- [Codebase structure](docs/codebase-structure.doc.md)
- [Progressive loading and 3D boot](docs/progressive-loading.doc.md)
- [Landing architecture](docs/landing-architecture.doc.md)
- [Routing guide](docs/routing.doc.md)
- [Animation guide](docs/animations.md)
- [Store guide](docs/store.doc.md)

## Current Architecture

```text
artifact/
├── CHROME_MCP_CLONING.md
├── docs/
│   ├── animations.md
│   ├── codebase-structure.doc.md
│   ├── routing.doc.md
│   ├── section-cloning-with-vawzen.doc.md
│   └── store.doc.md
├── public/
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── initializer/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   ├── store/
│   ├── types/
│   ├── config/
│   │   ├── metadata.ts
│   │   └── site.ts
│   └── pages/
│       └── landing/
├── biome.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Routing Model

This project uses **Next App Router** for URL routing.

`src/pages` exists in this repo, but it is currently being used as a feature
module area for page composition, not as the legacy Next Pages Router.

- every route lives under `src/app/[locale]`, prerendered for English (bare
  URLs), French, Spanish and Arabic; see `docs/i18n.doc.md`
- `src/app/[locale]/page.tsx` is the `/` route
- `src/app/[locale]/layout.tsx` is the root shell
- `src/pages/landing/landing.tsx` is imported by `src/app/[locale]/page.tsx`
- `src/pages/landing/sections/hero/hero.tsx` is the current homepage section
- add new routes with folders like `src/app/[locale]/about/page.tsx` and add
  their translated segment to `src/i18n/routing.ts`
- use dynamic segments like `src/app/[locale]/projects/[slug]/page.tsx`
- use private folders like `src/app/_components/` for non-route internals
- use route groups like `src/app/(marketing)/about/page.tsx` when you need
  layout organization without affecting the URL

See [routing.doc.md](docs/routing.doc.md).

## Styling Model

Global theme tokens live in [globals.css](src/app/globals.css).

The file is organized in layers:

1. Raw palette tokens
2. Shared semantic tokens
3. Source compatibility aliases
4. Global reset

That mirrors the token architecture style used in
`parallel-app/src/main.css`,
but simplified for this repo.

## Project Conventions

- Use `@/*` imports for source modules
- Keep route files in `src/app`
- Keep site-wide metadata/config in `src/config`
- Keep shared layout/UI in `src/components`
- Keep shared utilities/hooks in `src/lib`
- Keep shared client state in `src/store`
- Keep page-composition modules under `src/pages` until a clearer feature split emerges
- Prefer feature folders once the app grows
- Keep local documentation in `docs/` unless a feature needs colocated docs

See [codebase-structure.doc.md](docs/codebase-structure.doc.md).

## Next Steps

As the app grows, the expected expansion path is:

- `src/components/` for reusable UI and layout
- `src/pages/` or `src/sections/` for route-level page composition
- `src/lib/` for client/server utilities
- `src/store/` for shared client state
- `src/types/` for shared TS declarations

Those folders are not required yet, but the docs are written so the repo can
grow into them without changing conventions later.
