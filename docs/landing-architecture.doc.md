# Landing Architecture Strategy

This document records the target architecture for the landing page: how the
route is composed and where the client boundaries belong.

For how media downloads and how 3D boots, see
`docs/progressive-loading.doc.md`. That is the source of truth for loading;
this document only covers page composition.

The core goal is:

- users can read meaningful landing content immediately
- crawlers and link previews receive stable HTML
- heavy animation and Spline work loads after the readable shell exists
- 3D sections can be preloaded when needed without turning the whole page into
  a client-only application

## Current state

The App Router homepage renders the timed `BrandIntro` beside the server-safe
`src/components/landing/landing.tsx` composition. That composition imports all
seven sections and passes them as children to `landing-client.tsx`.

`landing-client.logic.ts` owns only the media scheduler, scene pre-boot and
section noise overlay. It never imports content sections. Existing client
animation and scene loaders remain leaves inside the server-rendered markup.
The introduction remains time-based; it does not gate hero text on media loads.

Landing files were moved out of `src/pages` so Next no longer publishes internal
components as Pages Router routes. The loading architecture remains unchanged.
The examples below describe the server/client split now implemented.

## Target Split

The landing page should be split into a server-rendered content shell and small
client controllers.

Target ownership:

- `src/app/[locale]/page.tsx`
  Route entry only. Keep it thin.
- `src/components/landing/landing.tsx`
  Server-safe landing composition. It imports and renders the sections.
- `src/components/landing/landing-client.tsx`
  Small client controller: starts the media scheduler, triggers scene pre-boot,
  and drives the section noise overlay. The hero entrance belongs to CSS.
- section files such as `hero.tsx`, `design.tsx`, `visualization.tsx`,
  `vr.tsx`, `how-it-works.tsx`, and `process.tsx`
  Server-safe markup whenever possible.
- `*AnimateLoader.tsx`
  Tiny client loader that lazy-imports scroll animation modules.
- `*SceneLoader.tsx` and `*Scene.client.tsx`
  Client-only Spline/runtime boundaries.

The target page shape should look like this:

```tsx
// src/components/landing/landing.tsx
import LandingClient from "@/components/landing/landing-client";
import Design from "./sections/design/design";
import Hero from "./sections/hero/hero";
import HowItWorks from "./sections/how-it-works/how-it-works";
import Process from "./sections/process/process";
import Visualization from "./sections/visualization/visualization";
import Vr from "./sections/vr/vr";
import styles from "./landing.module.css";

export default function Landing() {
  return (
    <LandingClient>
      <main className={styles.landing}>
        <Hero />
        <Design />
        <Visualization />
        <Vr />
        <HowItWorks />
        <Process />
        <div className={styles.scrollSpacer} />
      </main>
    </LandingClient>
  );
}
```

The client wrapper may receive `children`, but it must not import the landing
sections. That keeps the visible section tree server-rendered.

## Client Boundary Rules

Use client components only for browser work:

- media scheduling, scene pre-boot, and reveal state
- `window`, `document`, `matchMedia`, and `ResizeObserver`
- Lenis and viewport store initialization
- Spline runtime and Spline scene mounting
- pointer handlers
- scroll animation registration
- canvas drawing or image-sequence playback
- anything that reads scroll position or element geometry

Keep these server-safe:

- static headings, body copy, links, buttons, and image markup
- section layout wrappers
- JSON-driven project lists
- semantic page structure
- metadata and route composition

Do not add `"use client"` to a full section only because one child needs
animation. Instead add a tiny client loader or wrapper for that child.

## Progressive Loading Strategy

There is no asset-gated loading screen. A fixed marketing introduction overlays
the homepage while the full page paints and loads underneath. Every async
visual fades in over `--reveal-duration`, downloads are ordered by distance
from the viewport, and Spline boots are serialized and kept off the scroll.

The full design, its invariants and its measured baselines live in
`docs/progressive-loading.doc.md`. Do not re-derive this from the code — several
of the rules exist because the obvious implementation was measured and failed.

The landing controller owns only orchestration:

- start `startLandingMediaScheduler(buildLandingMediaPreloadManifest(locale))`
- call `startScenePreboot()` once the user's own screen is served
- drive the section noise overlay

It must not own section markup, and it must not preload assets directly — the
manifest is the single place that decides what downloads.

## 3D Runtime Strategy

Spline is the main main-thread and GPU risk on the landing page.

The current rules are:

- self-host `.splinecode` files when cloning Spline-authored scenes
- mount every scene with the raw `@splinetool/runtime`; there is exactly one
  engine path and one memoized runtime module
- route every boot through `useSceneBootSlot(...)` so no scene can parse or
  compile shaders while the user is scrolling
- warm scenes during idle with `startScenePreboot()` instead of booting on
  approach
- keep parsed scenes mounted after boot
- park canvases only while they are off screen; a visible scene is never parked
- keep a static still under every canvas so a parked, slow or failed scene shows
  a render instead of black
- avoid lowering VR and How-it-works render quality unless there is a measured
  reason
- keep process-specific quality reductions isolated to process scenes

If a Spline scene freezes again, check first whether a boot ran outside a boot
slot. Timestamp WebGL context creation: the calls must be spread out, never
clustered. Do not assume network loading is the source.

## Scroll Animation Strategy

Scroll animation code should stay out of render components.

Use this split:

- server section markup in `section.tsx`
- lazy client loader in `sectionAnimateLoader.tsx`
- a small `section.animate.tsx` invoking its owned `.logic.ts` hook

Use `scrollTrigger.createInstance(...)` for normal layout-based ranges, but use
direct visual-bound calculations when CSS transforms move the trigger element.

The desktop project VSlider retains its original image-height copy rows,
translated details and sticky media positioning. The first image enters fully
at its centered crop; a wipe starts only when the corresponding row reaches the
viewport center. Each wipe runs over one image-height row of scroll, preserving
the original text spacing and transition distance. The Services slider keeps
its own viewport-length timeline.

`VSliderAnimations.tsx` is the small lazy client controller;
`VSliderAnimations.logic.ts` owns the animation and lifecycle. Visual bounds are
cached during initialization and refreshed through resize observation and the
window resize event, including height-only changes. Scroll frames only calculate
progress and write styles. Departing image crops retain their 50% to 60% range;
mobile animation remains unchanged. Cleanup removes observers/listeners, pending
frames and per-slider registrations.

Reviewed in Vaelix at a 1204px desktop width on 2026-10-14. Both Design and
Visualization retain their original approximately 383px rows: the first image
remains uncut at the center, reaches 25% after a quarter row, and completes each
wipe after one image-height row. Reverse scrolling restores the first image.
`npm run test:vslider` exercises the real controller for entry, all wipe ranges,
reverse scrolling without layout reads, height-only resizing and cleanup.

## SEO And Readability Strategy

The landing page should not rely on client hydration before meaningful content
exists.

Keep SSR/static output for:

- hero title and primary copy
- design and visualization project titles and links
- process step copy
- VR and How-it-works section labels/copy
- footer/contact content when added

Client-only content is acceptable for:

- decorative or enhanced Spline models
- scroll-driven visual transitions
- pointer interaction
- media reveal transitions

If JavaScript is slow, the page should still expose the core offer and project
links in HTML.

## Completed composition migration

Landing markup now lives under `src/components/landing`, and the client boot
wrapper accepts server-rendered children. Scheduler start, scene pre-boot and
noise updates remain in its owned `landing-client.logic.ts`. No public legacy
landing-component routes remain. Hero entrance CSS, frame URLs, scene loaders,
canvas parking and virtual-tour scheduling retain their existing behavior.

## Verification Checklist

Before calling the landing architecture healthy:

- `src/components/landing/landing.tsx` does not import a component that owns all
  sections from a `"use client"` file
- the client wrapper accepts `children`
- section markup remains visible without waiting for animation modules
- no internal components or helper-only modules live under `src/pages`
- `npm run build` passes
- Vaelix/Chrome confirms the existing localhost tab can scroll through:
  - design VSlider
  - visualization VSlider
  - VR
  - How-it-works
  - process
- every on-screen 3D canvas paints, and off-screen ones are parked
- no section is blank at any scroll position

