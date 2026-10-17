# Routing Guide

This project uses **Next.js App Router**.

URL routing lives in `src/app`. Every page route lives under the
`src/app/[locale]` segment, whose layout is the root layout: English is served
at bare URLs and French, Spanish and Arabic under `/fr`, `/es` and `/ar` with
translated segments. The URL table, rewrites, redirects and helpers are in
`src/i18n/routing.ts`; see [the i18n guide](i18n.doc.md) before adding a route.

Landing composition lives in `src/components/landing`. Internal components
must never live under `src/pages`, which Next discovers as public legacy routes.
All new pages use App Router entrypoints with private `_components` and `_data`
folders. The only dynamic public route is the project detail template.

## Core files

```text
src/app/
├── [locale]/
│   ├── layout.tsx        # root HTML/body shell, lang and dir per language
│   ├── page.tsx          # homepage (/, /fr, /es, /ar)
│   └── services/page.tsx # services route (/services, /es/servicios, ...)
├── global-not-found.tsx  # URLs that match no language
└── globals.css           # global tokens and reset

src/config/
├── metadata.ts   # Next metadata export
└── site.ts       # site constants and canonical URL resolution

src/components/
└── landing/
    ├── landing.tsx
    └── sections/1-hero/hero.tsx
```

## How routes map

- `src/app/[locale]/page.tsx` -> `/`
- `src/app/[locale]/about/page.tsx` -> `/about`
- `src/app/[locale]/projects/page.tsx` -> `/projects`
- `src/app/[locale]/projects/[slug]/page.tsx` -> `/projects/:slug`

Current homepage composition:

- `src/app/[locale]/page.tsx` imports `@/components/landing/landing`
- `src/components/landing/landing.tsx` should render page sections directly
- `src/components/landing/sections/1-hero/hero.tsx` is the current hero section

The landing page should not be owned by one top-level client component. Keep
the route and landing composition server-safe, then wrap the server-rendered
children with a small client boot/preload controller. The detailed target is in
`docs/landing-architecture.doc.md`.

## Private route support folders

Use `_` prefixes for non-route helpers inside route segments.

Examples:

```text
src/app/[locale]/about/
├── page.tsx
└── _sections/
    ├── intro.tsx
    └── team.tsx
```

These folders are ignored by routing.

## Route groups

Use route groups when you want separate layout organization without changing
the URL path.

Example:

```text
src/app/
├── (marketing)/
│   ├── layout.tsx
│   ├── page.tsx
│   └── about/page.tsx
└── (studio)/
    ├── layout.tsx
    └── contact/page.tsx
```

Both groups can still render normal URLs like `/` or `/about`.

## Segment files you can add

- `layout.tsx` for persistent wrappers
- `loading.tsx` for streaming/loading UI
- `error.tsx` for segment-scoped error boundaries
- `not-found.tsx` for route-specific 404 handling
- `template.tsx` when a segment needs forced remount behavior

## Adding a new route

1. Create a folder in `src/app`.
2. Add `page.tsx`.
3. Add a colocated `layout.tsx` only if the route needs a different shell.
4. Keep heavy route-only helpers in a private `_` folder.
5. If the route grows, keep its page composition in private `_components` or `_sections`.
6. Move reusable pieces to `src/components/` once they are shared.

## Metadata

Keep site-wide metadata in `src/config/metadata.ts`.

If a route needs custom metadata, export `metadata` or `generateMetadata`
directly from that route segment file.

## Notes for migration thinking

If you are coming from `parallel-app`:

- App Router entrypoints live in `src/app/*/page.tsx`
- `src/components/landing/*` is the server-safe homepage composition
- React Router nested routes become nested App Router folders
- route metadata is usually colocated with the segment instead of a central
  route config
- private folders use `_`, route groups use `(group)`

## Services and transitions

`/services` uses a server page, private route content/hero, and the shared
`VSlider` services variant. The persistent layout provides the curved route
transition for internal links. See [services architecture](services-architecture.doc.md).
