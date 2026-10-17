# ScrollTrigger Animation Instructions

This file is the implementation guide for adding new scroll-driven animations in this repo.

The target standard is the same pattern used in `site-entry`: separate client-only animation modules, DOM/query caching, RAF batching, deduped style writes, strict cleanup, and no heavy work inside the scroll callback.

## Goal

When adding a new animation, another AI should produce code that behaves like the `site-entry` animators, not ad hoc React effects.

That means:

- keep presentational section components mostly pure
- put scroll logic in a dedicated `*.animate.ts` or `*.animate.tsx` file
- keep SSR markup separate from client-only controllers when the content itself does not need CSR
- cache DOM references outside the hot path
- batch DOM writes with `createRAFBatch`
- dedupe style/class writes with `createBatchStyleSetter` or `createStateTracker`
- clear all instances, caches, and inline styles on cleanup
- re-init on `pathname` or viewport-width changes

## Source Pattern

The pattern in this doc comes from the `site-entry` animation files, especially:

- `sections/landing/2-testimonials/testimonials.animate.ts`
- `sections/landing/5-pricing/pricing.animate.ts`
- `sections/about/4-contact/contact.animate.ts`
- `sections/landing/3-architecture/architectureFlow/architectureFlow.animate.ts`
- `sections/landing/3-architecture/architectureFlow/components/*/*.animate.ts`

Those files are the style baseline.

## Core Rule Set

### 1. Separate render from animation

Use this split:

- `section.tsx`: markup only, mostly server-safe
- `section.module.css`: layout and static styles
- `section.animate.tsx`: client animation controller

The render file should mount the animator component, but the scroll logic should not live directly inside the render markup unless the section is trivial.

### 1a. Keep SSR content outside the client boundary

If the section content can render on the server, do not mark the whole section file as `'use client'` just to attach animations.

Use this split instead:

- `section.tsx`: server-safe markup
- `sectionMotion.tsx`: tiny client wrapper only for pointer/touch interactions when needed
- `sectionAnimateLoader.tsx`: tiny client loader that lazy-imports `section.animate.tsx`

This keeps the visible markup SSR while still code-splitting the animation runtime.

Example shape:

```tsx
// section.tsx
import SectionAnimateLoader from "./sectionAnimateLoader";
import SectionMotion from "./sectionMotion";
import styles from "./section.module.css";

export default function Section() {
  return (
    <section className={styles.section} data-section-root>
      <SectionAnimateLoader />
      <SectionMotion>
        <div className={styles.card} data-section-card />
      </SectionMotion>
    </section>
  );
}
```

```tsx
// sectionAnimateLoader.tsx
"use client";

import { startTransition, useEffect, useState } from "react";

type SectionAnimateComponent = typeof import("./section.animate").default;

export default function SectionAnimateLoader() {
  const [AnimateComponent, setAnimateComponent] =
    useState<SectionAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./section.animate").then((module) => {
      if (isCancelled) return;

      startTransition(() => {
        setAnimateComponent(() => module.default);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!AnimateComponent) return null;

  return <AnimateComponent />;
}
```

Important:

- do not put `ssr: false` `next/dynamic(...)` directly in a Server Component
- if you need a lazy client-only boundary, create a tiny client loader and do the `import()` there
- if you need pointer handlers, keep them in a small client wrapper and pass SSR children through it

### 2. Keep animation utilities at module scope

Create the reusable utilities once per module, outside the React hook/component.

Use this pattern:

```ts
const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const styleSetter = createBatchStyleSetter();
const rafBatch = createRAFBatch();
const stateTracker = createStateTracker();

let isInitializing = false;
```

Why:

- avoids recreating utilities every render
- matches `site-entry`
- keeps cleanup predictable

When the animation needs repeatedly accessed DOM nodes, also cache a resolved ref bundle behind one getter instead of re-querying each node separately:

```ts
type SectionDomRefs = {
  root: HTMLElement;
  card: HTMLElement;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};

let cachedDomRefs: SectionDomRefs | null = null;

function getCachedDomRefs(): SectionDomRefs | null {
  if (
    cachedDomRefs &&
    document.contains(cachedDomRefs.root) &&
    document.contains(cachedDomRefs.card) &&
    document.contains(cachedDomRefs.canvas)
  ) {
    return cachedDomRefs;
  }

  // resolve refs once, then reuse
  return cachedDomRefs;
}
```

This is the preferred pattern for canvas/image-sequence sections because it keeps the hot path down to math plus one RAF-batched draw.

### 3. Re-init on route or viewport changes

The standard hook pattern is:

```ts
export function useSectionAnimations() {
  const pathname = usePathname();
  const { vw } = dimensionsStore();

  useEffect(() => {
    cleanupSectionAnimations();
    initSectionAnimations(pathname, vw);

    return () => {
      if (typeof window === "undefined") return;
      cleanupSectionAnimations();
    };
  }, [pathname, vw]);
}
```

Why:

- route changes can leave stale instances
- viewport changes often change animation ranges/endpoints
- this is the exact lifecycle used across `site-entry`

### 4. Call `kickScroll()` after registering instances

Always call `kickScroll()` after init finishes.

```ts
kickScroll();
```

Why:

- forces the current scroll state through the system immediately
- prevents elements from staying in stale initial styles until the next user scroll

### 5. Cleanup must be explicit

Every animation file must have a cleanup function that:

- cancels pending RAF updates
- removes every scrollTrigger instance by id
- clears the instance registry
- resets inline styles added during init/animation
- clears DOM cache
- clears state trackers
- clears any module-level cached elements or memo state

Do not rely on garbage collection alone.

## Utility Choice Guide

### `scrollTrigger.createInstance(...)`

Use for normal section-based scroll progress.

You provide:

- a unique id
- an anchor element or `{ current: el }`
- `values`: `[from, to]` pairs that are interpolated from 0 to 100% progress
- `startPoint`
- `endPoint`
- `callback`

Example:

```ts
const instance = scrollTrigger?.createInstance(id, card, {
  values: [
    [40, 0],
    [-10, 0],
    [0.96, 1],
    [0, 1],
  ],
  startPoint: [0],
  endPoint: [0.9],
  callback: ({ v }) => {
    rafBatch.schedule(`card-${index}`, () => {
      const transform = `translateY(${v[0]}px) rotateX(${v[1]}deg) scale(${v[2]})`;
      styleSetter.set(card, "transform", transform);
      styleSetter.set(card, "opacity", `${v[3]}`);
    });
  },
});
```

In this repo, treat the default `scrollTrigger` export as client-only and nullable.

### Direct visual-bound scroll math

Use direct visual-bound math when the trigger element is moved by CSS transform.

`scrollTrigger` measures layout position through `offsetTop`. That does not
include transforms. If the visible trigger is shifted with `transform`, the
animation can start too early or too late and can keep stale boundary values
after jump scrolling.

The desktop `VSlider` is the canonical example:

- `.desktopDetails` is translated upward with CSS
- project labels are visually higher than their `offsetTop`
- image clipping must follow the visible label position
- desktop VSlider therefore computes progress from
  `element.getBoundingClientRect().top + window.scrollY`

Keep this path scoped. Do not replace `scrollTrigger` everywhere. Use direct
visual-bound math only when the visual position and layout position diverge.

### VSlider desktop clipping

`src/components/ui/VSlider/VSliderAnimations.tsx` drives desktop project image
clipping from the transformed project bounds.

The expected desktop progression for the first media layer is:

- before the first visible project hits viewport center: `clip-path: inset(... 0%)`
- near the start: a small bottom inset
- midway through the project row: roughly `50%`
- after the row range: `100%`

All VSlider image crops start at `center 50%` and animate vertically toward
`center 60%`, including desktop/mobile project sliders and the services variant.
Final project layers without an outgoing transition stay centered. Services
normalize their entry/exit phases to the same range; reduced motion stays centered.

This is intentionally shared by Design and Visualization. If Design and
Visualization diverge, inspect:

- whether both sliders have unique `data-vslider-id` values
- whether `.desktopDetails` transform changed
- whether the measured visual top matches the visible project label
- whether stale inline `clipPath` values were left after cleanup

Safe patterns:

- `scrollTrigger?.createInstance(...)`
- `scrollTrigger?.removeInstance(...)`
- use `getScrollTrigger()` first if you need direct instance methods like `calcTop()` or `calcBot()`

### `createRAFBatch()`

Use for all DOM writes inside animation callbacks.

This is the default FPS limiter in the current system.

Do not build your own `setTimeout`-based throttling. The standard pattern is one RAF-batched DOM write per key per frame.

### `createBatchStyleSetter()`

Use when you need to write inline styles repeatedly but want to skip redundant writes.

Best for:

- transform
- opacity
- width/height
- border/color/background

### `createStateTracker()`

Use when the animation toggles classes or repeatedly sets stateful styles/attributes.

Best for:

- class toggles
- attributes
- stateful visual transitions
- helper modules that run every frame

`site-entry` uses it heavily for perspective styles and architecture sub-card state changes.

### `createDOMCache()`

Use for selector lookups that would otherwise repeat across init/cleanup.

Best for:

- section root pieces
- headers
- card lists
- nested selectors that are expensive or repeated

Do not repeatedly call `querySelector` inside the animation callback.

### `createInstanceRegistry()`

Use to track created instances/ids so cleanup is deterministic.

Do not keep loose arrays of ids if the registry utility already covers the use case.

### `createMapProgressMemo()` and `calcPercent()`

Use in complex animation math where a single scroll progress drives multiple timeline segments.

This is the `site-entry` pattern for architecture-style animations.

Use it when:

- a card animation has multiple phases
- you split a 0..100 timeline into segments
- you need to convert one scroll progress value into several sub-progress values

### `scrollManager.createInstance(...)`

Use only when you need a custom global scroll listener that is not anchored to one element.

Examples:

- page/body background transitions driven by multiple section boundaries
- section-wide theme changes
- custom logic that does not map cleanly to a single anchor element

The manager already supports:

- RAF batching
- optional throttling
- instance enable/disable

Important:

- `site-entry` does not usually pass `throttle` explicitly
- the default style is to trust RAF batching first
- only add `throttle` after measuring a real performance issue

## Standard Section Template

Use this as the default shape for a new section animator.

```ts
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import scrollTrigger, {
  createRAFBatch,
  createStateTracker,
  kickScroll,
} from "@/lib/scrollInteraction/scrollTrigger";
import { createDOMCache } from "@/lib/scrollInteraction/createDOMCache";
import { createInstanceRegistry } from "@/lib/scrollInteraction/createInstanceRegistry";
import { createBatchStyleSetter } from "@/lib/scrollInteraction/createSmartStyleSetter";
import { dimensionsStore } from "@/store/dimensionsStore";
import styles from "./section.module.css";

const activeInstances = createInstanceRegistry();
const domCache = createDOMCache();
const styleSetter = createBatchStyleSetter();
const rafBatch = createRAFBatch();
const stateTracker = createStateTracker();

let isInitializing = false;

function initSectionAnimations(pathname: string, vw: number): any[] {
  if (typeof window === "undefined") return [];
  if (isInitializing) return [];
  isInitializing = true;

  const created: any[] = [];

  try {
    const cards = domCache.getAll<HTMLElement>("cards", `.${styles.card}`);
    if (cards && cards.length) {
      const endPoint = vw <= 600 ? 0.7 : vw <= 1024 ? 0.8 : 0.9;

      Array.from(cards).forEach((card, index) => {
        const id = `section-card-${pathname}-${index}-${Date.now()}`;

        card.style.transform = "translateY(40px) rotateX(-10deg) scale(0.96)";
        card.style.transformOrigin = "center center";
        card.style.opacity = "0";

        const instance = scrollTrigger?.createInstance(id, card, {
          values: [
            [40, 0],
            [-10, 0],
            [0.96, 1],
            [0, 1],
          ],
          startPoint: [0],
          endPoint: [endPoint],
          callback: ({ v }) => {
            rafBatch.schedule(`section-card-${index}`, () => {
              const transform = `translateY(${v[0]}px) rotateX(${v[1]}deg) scale(${v[2]})`;
              styleSetter.set(card, "transform", transform);
              styleSetter.set(card, "opacity", `${v[3]}`);
            });
          },
        });

        if (instance) {
          const stored = activeInstances.add(id, instance);
          if (stored) created.push(stored);
        }
      });
    }

    kickScroll();
    isInitializing = false;
    return created;
  } catch (_) {
    isInitializing = false;
    return created;
  }
}

function cleanupSectionAnimations() {
  if (typeof window === "undefined") return;

  rafBatch.cancelAll();

  try {
    const ids = activeInstances.getAllIds();
    ids.forEach((id) => {
      try {
        scrollTrigger?.removeInstance(id);
      } catch (_) {}
    });

    activeInstances.clear();

    const cards = domCache.getAll<HTMLElement>("cards", `.${styles.card}`);
    if (cards) {
      Array.from(cards).forEach((card) => {
        card.style.transform = "";
        card.style.transformOrigin = "";
        card.style.opacity = "";
      });
    }

    domCache.clear();
    stateTracker.clearAll();
  } catch (_) {
    // silent
  }
}

export function useSectionAnimations() {
  const pathname = usePathname();
  const { vw } = dimensionsStore();

  useEffect(() => {
    cleanupSectionAnimations();
    initSectionAnimations(pathname, vw);

    return () => {
      if (typeof window === "undefined") return;
      cleanupSectionAnimations();
    };
  }, [pathname, vw]);
}

export default function SectionAnimate() {
  useSectionAnimations();
  return null;
}
```

## Hot-Path Rules

These rules matter more than everything else.

### Never query DOM inside the frame callback

Bad:

```ts
callback: ({ v }) => {
  const el = document.querySelector("...");
  el.style.opacity = String(v[0]);
}
```

Good:

- cache the element before the callback runs
- or cache lazily once in a helper module and reuse it

### Never create unnecessary arrays or objects per frame

Bad:

- building selector arrays inside the callback
- creating repeated lookup objects per frame
- regex-parsing the same transform string every frame

Good:

- hoist constants to module scope
- precompute selector arrays
- cache parsed values once

This is exactly what `site-entry` does in the architecture helper modules.

### Always batch writes

Inside callbacks, schedule writes through `rafBatch.schedule(...)`.

That is the default performance contract.

### Always dedupe repeated writes

If a style/class does not need to change, do not write it again.

Use:

- `styleSetter.set(...)`
- `stateTracker.trackStyle(...)`
- `stateTracker.trackClassToggle(...)`

### Prefer one transform string over many transform properties

Build one `transform` string and write it once.

Example:

```ts
const transform = `translateY(${v[0]}px) rotateX(${v[1]}deg) scale(${v[2]})`;
styleSetter.set(el, "transform", transform);
```

This is the recurring `site-entry` pattern.

## When to Use `useRef` vs `createDOMCache`

### Use `createDOMCache`

For standard section queries:

- headers
- card lists
- table rows
- wrappers found by CSS module selectors

### Use `useRef`

For expensive roots or cross-function shared nodes that are passed through multiple init functions.

This is the architecture-flow pattern:

- root anchor ref
- flow wrapper ref
- card list ref

Use `useRef` when a node is expensive to rediscover or shared by multiple animation setup functions.

## Multi-Phase Animation Pattern

For complex cards like `site-entry` architecture flow:

1. one scrollTrigger instance drives one normalized progress value
2. split that timeline with `calcPercent(start, end, progress)`
3. remap sub-progress with `createMapProgressMemo()`
4. cache all nested nodes at module scope
5. use `createStateTracker()` to avoid redundant class/style changes

Example shape:

```ts
const mapProgressMemo = createMapProgressMemo();
const stateTracker = createStateTracker();

let cachedBars: NodeListOf<HTMLElement> | null = null;

export function handleCardAnimation({ v, card }: { v: number; card: HTMLElement }) {
  if (!cachedBars) {
    cachedBars = card.querySelectorAll("...");
  }

  const seg = mapProgressMemo(0, 1, calcPercent(0, 50, v));

  cachedBars.forEach((bar, index) => {
    const width = mapProgressMemo(0, 100, seg * 100);
    stateTracker.trackStyle(bar, "width", `${width}%`);
  });
}
```

Important:

- module-level cached nodes are safe only when the helper owns one stable card instance or one stable section subtree
- if the same helper can run against multiple different elements in the same session, do not share one global node cache blindly; key the cache by element or keep the helper one-instance-only
- if you cache at module scope, always provide a `clear...Cache()` function and call it during section cleanup

## Perspective / 3D Pattern

If the animation uses `rotateX`, `rotateY`, or 3D transforms, `site-entry` usually does this:

- predefine a `PERSPECTIVE_SELECTORS` array at module scope
- set `perspective: 1000px`
- set `transform-style: preserve-3d`
- use `stateTracker.trackStyle(...)` so those setup writes are not repeated unnecessarily

Example:

```ts
const PERSPECTIVE_SELECTORS = [
  ["container", styles.container],
  ["grid", styles.grid],
] as const;

PERSPECTIVE_SELECTORS.forEach(([key, selector]) => {
  const el = domCache.get<HTMLElement>(key, `.${selector}`);
  if (!el) return;

  stateTracker.trackStyle(el, "perspective", "1000px");
  stateTracker.trackStyle(el, "transformStyle", "preserve-3d");
});
```

## External 3D Scene Pattern

If the section is cloning an external 3D scene instead of animating DOM cards,
follow the same SSR/client split but keep the scene runtime and the scroll
animator separate.

Preferred split:

- `section.tsx`
  Server-safe markup and stable `data-*` hooks only
- `sectionAnimateLoader.tsx`
  Tiny client-only lazy loader
- `section.animate.tsx`
  ScrollTrigger-based controller that maps section progress to one or more
  scene values
- `sectionScene.client.tsx`
  Runtime mount for Spline/Three/canvas, pointer motion, material fixes, and
  frame scheduling
- `src/lib/<feature>/...`
  Shared selectors, ids, and controller bridges that are not React components

Important:

- do not place helper-only scene controller modules under `src/pages/...`
- keep scroll state and pointer state as separate channels
- compose those channels into one target transform inside the scene runtime
- if the runtime uses manual render mode, add a short post-load render burst

The AM-ARC headset clone is the reference implementation for this pattern.
Use [3d-scene-cloning.doc.md](./3d-scene-cloning.doc.md) as the detailed
runbook.

## Responsive Rule

Compute viewport-dependent values once during init, not every frame.

Good:

```ts
const isMobile = vw <= 600;
const isTablet = vw <= 1024 && vw > 600;
const endPoint = isMobile ? 0.7 : isTablet ? 0.8 : 0.9;
```

Bad:

- checking `window.innerWidth` inside every animation callback

## ID Convention

Use ids that are easy to remove on cleanup.

Recommended shape:

```ts
const id = `section-part-${pathname}-${index}-${Date.now()}`;
```

Why:

- unique across route changes
- cleanup can remove by prefix if needed
- matches `site-entry`

## Cleanup Checklist

Before finishing a new animation file, verify cleanup handles all of this:

- `rafBatch.cancelAll()`
- `scrollTrigger?.removeInstance(id)` for every created id
- `activeInstances.clear()`
- reset every inline style set in init or callback
- `domCache.clear()`
- `stateTracker.clearAll()`
- clear module-level cached elements in helper modules

If any of these is missing, the implementation is not complete.

## Anti-Patterns

Do not do these.

- do not put expensive animation logic directly in the section render component
- do not query DOM every frame
- do not set styles every frame without deduping
- do not forget `kickScroll()`
- do not forget to reset inline styles on cleanup
- do not add custom frame loops when `scrollTrigger` + RAF batch already covers the job
- do not add manual FPS throttling unless profiling shows RAF batching is not enough
- do not create ad hoc global listeners if an anchored `scrollTrigger` instance is enough
- do not leave caches uncleared in helper modules

## Decision Rules For New Work

When building a new animation, follow this order.

1. Decide whether the section is simple or multi-phase.
2. Create a dedicated `*.animate.tsx` controller file.
3. Add module-level registry/cache/style/RAF helpers.
4. Cache selectors before the hot path.
5. Set initial inline state in init.
6. Register `scrollTrigger` instances.
7. Inside callbacks, batch writes through RAF.
8. Use `styleSetter` or `stateTracker` for repeated writes.
9. Call `kickScroll()`.
10. Implement full cleanup.
11. Re-init on `[pathname, vw]`.

## AI Checklist

If another AI is asked to add a new animation, it should verify all of these before finishing.

- Is the animation code in a dedicated `*.animate.tsx` file?
- Are `createInstanceRegistry`, `createDOMCache`, `createBatchStyleSetter`, and `createRAFBatch` created at module scope?
- Is `createStateTracker` used where repeated class/style state exists?
- Are all selectors and constant arrays hoisted out of the hot path?
- Are DOM writes inside `rafBatch.schedule(...)`?
- Are repeated writes deduped?
- Is `kickScroll()` called after init?
- Does cleanup remove instances and reset inline styles?
- Does the hook re-init on `pathname` and `vw`?
- If the animation is complex, are nested nodes cached once and cleared explicitly?

If any answer is no, the implementation is not yet at the `site-entry` standard.
