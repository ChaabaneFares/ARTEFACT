# Codebase Structure and Naming Rules

This document is the source of truth for how this repo should grow.

It borrows the discipline of `parallel-app`, but it is rewritten for
**Next.js App Router**.

## Naming rules

- All folders and files use lowercase names.
- Use kebab-case for multi-word names: `hero-content`, `site-header`.
- React component exports use PascalCase.
- Prefix subcomponents with the parent feature name when the relationship is
  not obvious.
- Keep route internals in private folders prefixed with `_`.

## Top-level structure

- `src/` application source
- `public/` static assets served as-is
- `docs/` project documentation (start with `progressive-loading.doc.md` for
  landing media/3D loading)
- `src/app/` App Router routes, layouts, and global CSS
- `src/components/` shared UI, layout, and low-level client components
- `src/config/` site config and metadata
- `src/lib/` reusable hooks and framework helpers
- `src/components/landing/` server-safe homepage composition and sections
- `src/store/` shared client-side state stores
- `src/types/` local type shims and shared declarations

## Current src structure

```text
src/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── services/, projects/, about/, contact/, faq/, privacyandpolicy/
│   ├── projects/[slug]/
│   ├── api/contact/
│   └── sitemap.ts, robots.ts, not-found.tsx
├── components/
│   ├── landing/            # server composition, client boot leaf, sections
│   ├── initializer/
│   ├── layout/             # persistent header/menu, transition, footer
│   └── ui/                 # shared images, slider, cursor, pills, tour
├── config/
├── lib/
│   ├── landing3d/, landingProcess/, landingVr/, howItWorks3d/
│   └── scrollInteraction/
├── store/
└── types/
```

Route internals stay in private `_components` and `_data` folders. There is no
internal `src/pages` composition directory.

## Recommended growth path

```text
src/
├── app/              # App Router entrypoints and route segments
├── components/       # Shared UI, layout, and utilities
├── config/           # Site config, metadata, constants
├── lib/              # Framework-independent helpers
├── store/            # Shared client-side state stores
├── pages/            # Page composition modules used by src/app routes
├── sections/         # Optional shared page sections if multiple pages reuse them
├── types/            # Shared TS types and module declarations
└── content/          # Optional local JSON/MD content
```

## App Router rules

### Public routes

Use folder-based routing under `src/app`.

Examples:

- `src/app/[locale]/page.tsx` -> `/`
- `src/app/[locale]/about/page.tsx` -> `/about`
- `src/app/[locale]/projects/[slug]/page.tsx` -> `/projects/:slug`

### Private folders

Folders prefixed with `_` are not routable and are safe for internal route
support code.

Examples:

- `src/app/_components/`
- `src/app/[locale]/about/_sections/`

### Route groups

Use route groups when you need organizational folders without changing the URL.

Examples:

- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/about/page.tsx`
- `src/app/(dashboard)/layout.tsx`

### Layout layering

- `layout.tsx` applies to the current segment and descendants
- `template.tsx` can be added when remount behavior is needed
- `loading.tsx`, `error.tsx`, and `not-found.tsx` stay next to the segment they
  belong to

## Standard file patterns

- Route entry: `page.tsx`
- Segment layout: `layout.tsx`
- Global styles: `globals.css`
- Feature component: `<name>.tsx`
- Optional styles: `<name>.module.css`
- Behavior/state hook: `<name>.logic.ts`, required for a component with state, handlers or effects
- Client variant: `<name>.client.tsx` with `<name>.client.logic.ts`
- Optional motion controller: `<name>.animate.ts` / `.animate.tsx`, dynamically imported
- Optional local docs: `README-<name>.md`

## Component guidance

- Reusable UI belongs in `src/components/`
- Route-specific composition belongs in private `src/app/<route>/_components/` folders
- Route-specific sections can live under page modules like `src/components/landing/sections/`
- Move truly shared sections into `src/sections/` only when more than one page needs them
- Keep helper-only modules for page sections in `src/lib/` when they are not React components
- Do not put non-route reusable code directly in `src/app/` unless it is truly
  route-local

Important:

- Never put internal components under `src/pages/`: Next exposes that directory
  through the legacy Pages Router, even when the homepage uses App Router.
- Shared helpers belong under `src/lib/<feature>/`; route-local helpers belong
  in private App Router folders.
- the VR scene controller and shared selectors follow this rule in
  `src/lib/landingVr/`

## Landing SSR/client boundary

The landing page should keep content composition server-safe and move browser
work into small client boundaries.

Current shape:

- `src/components/landing/landing.tsx` imports and renders the landing sections
- a small client boot wrapper accepts `children`
- the client wrapper owns loading orchestration only: the media scheduler,
  scene pre-boot, and the section noise overlay (see
  `docs/progressive-loading.doc.md`). The hero entrance runs from CSS
- section files stay server-safe unless the whole section genuinely needs
  browser state
- scroll animation loaders and Spline scene loaders remain client-only leaves

Do not let a top-level `"use client"` landing component import every section.
That effectively moves the landing page under one client boundary and weakens
SEO/readability goals. See `docs/landing-architecture.doc.md` for the full
strategy.

## Header and menu boundary

`src/components/layout/header/header.tsx` renders the shared navigation.
`header.client.logic.ts` owns the open/closing/closed state, close timer, scroll
manager subscription, focus loop, and restoration of the previous scroll and
inert settings. The menu stays mounted during its 500ms closing transition;
reopening cancels the pending close. Reduced motion closes immediately.
`header.types.ts` supplies the shared phase type; children do not import the
parent's logic module.

The server header/menu compose their content; client providers own their state.
Individual controls live in `components/<control>/` with their own logic hooks.
`header.context.ts` and `menu.context.ts` supply state contracts without importing
parent implementations in children. The menu provider uses `menu.client.logic.ts`;
`menu.animate.ts` loads magnetic link motion only while the menu is open. The shared
`src/components/ui/pointer-glow/` background owns its rendering, CSS, and logic
for the menu and marketing introduction. Its logic dynamically imports
`pointer-glow.animate.ts` when the surface is active. It follows pointer motion across
the viewport with a time-based animation frame loop and an unbounded angle,
so full turns cross the angle seam continuously.
Its orientation is retained across closing and reopening. Its initial angle is
local CSS, without global property registration or a style read during cleanup.
Frames stop when inactive, hidden, or outside the motion media query.
Cursor feedback uses
the existing cursor interaction events alongside the visible native pointer.
Scrolling uses the shared Lenis runtime. The `data-menu-open` attribute scopes
the menu's cursor appearance and hides the window scrollbar overlay while
scrolling is locked. Cursor reset events remain available after leaving the
menu or resizing below its pointer breakpoint. The menu adds no media or scene
loading gates.

Geometry follows the measured AM-ARC menu. A local `--menu-unit` reproduces
the reference's root font scaling without changing this app's root font size.
The source's fixed pixel dimensions and breakpoints are retained deliberately
for the requested visual match; CSS remains one line per selector. The longer
Artifact email can extend into the column gap without moving the navigation.
Mobile SVGs live in `public/assets/layout/menu/` and use the configured social
destinations. Mobile social ordering is composed in the server menu module.
The isolated menu email control owns the reference's synchronous selection copy, with the
Clipboard API as a fallback and a live status message. The temporary copy
field's static styles live in the CSS module and it is always removed.

Navigation URLs remain in `header.copy.ts`. The header estimate CTA is always
present, including project details and compact mobile layouts. The home link
uses `public/assets/brand/artefact-logo.svg`: a white, outlined geometric
`ARTE-` / `FACT` wordmark following the reference's stacked lettering style.
It has no runtime font dependency and retains an accessible "Artefact home"
label. Services, Projects, About, Contact, FAQ and Privacy have App Router
entrypoints; see their architecture documents.

Vaelix comparisons covered desktop 2560px and 1440px, tablet 900px and 768px,
and mobile 412px and 375px. Navigation rectangles match within 0.1px; mobile
link and CTA rectangles match exactly. Interaction checks cover pointer
motion, email copy, background/Escape close, keyboard focus looping, rapid
close/reopen, scroll locking/restoration, and navigation cleanup. Follow-up
checks cover two full turns in either direction without reversal or angle
resets, pointer visibility, and retained orientation after reopening.

### Production review (2026-10-11)

The header, menu, marketing introduction, and shared gradient retain separate
rendering, logic hooks, and CSS modules. The introduction and hero reveal remain
independent of video readiness, media scheduler idle, and scene boot completion.
No extra image assets, fetches, or scene engines were added for the gradient.
The pixel geometry exception above preserves the explicitly requested visual
clone; intro dimensions use responsive `vw` variables, and the gradient fills
its host without breakpoint-specific lengths.

Full `npm run lint` and `npm run build` pass. The locally served production
build was checked through Vaelix for initial SSR content, intro timing and
scrollbar stability, full-turn rotation, retained orientation, rapid reopening,
focus looping, Escape close, copy feedback, and scroll/inert restoration.
The production intro and menu were also checked in 900px and 412px viewports,
with no horizontal overflow and a still mobile gradient. Resizing from 900px
to 700px cleared the copy cursor and restored interaction on close. Cursor
helper checks include server rendering and cleanup after leaving its tablet
breakpoint.

The feature changes pass their production checks. A full site launch still
requires the existing missing `/projects`, `/about`, `/contact`,
and `/faq` pages (each returns 404, including Next's link prefetch), and replacing
the configured AM-ARC social/contact profiles with the studio's destinations.
These URLs are in `header.copy.ts`; the review does not invent pages or
business contact details. This review does not deploy or push the changes.

## When adding new files

1. Decide whether the file is route-level, shared UI, or config.
2. Keep routable files inside `src/app`.
3. Keep shared modules outside `src/app`.
4. If a route is getting large, keep its composition in private `_components` or `_sections` folders.
5. Use private `_` folders for route internals.
6. Add docs when a feature becomes non-trivial.

## Services page

`src/app/[locale]/services/page.tsx` composes a server hero, private content data, and
`VSlider`'s services variant. It shares the layout, footer, cursor, CTA, image
reveal, and scroll infrastructure with the landing page. Its optional animation
controller imports lazily and caches geometry outside scroll frames. Route
transitions persist in the layout and internal home returns skip the marketing
intro. Details and validation live in [services architecture](services-architecture.doc.md).
