# Section Cloning With Vawzen MCP

This document is the operating manual for cloning a live website section into
this repo with vawzen MCP.

The goal is not "make something similar." The goal is to let an AI reproduce a
section with the same DOM intent, same visible layout, same assets, same timing,
same scroll behavior, same interaction rules, and the same browser edge cases
that matter for the section.

Use this when a user says things like:

- clone this section from a live site
- use the current vawzen tab
- use this selector
- make it the same as AM-Arc
- same UI, same behavior, same interaction, same videos

## Core Standard

A cloned section is complete only when these are all true:

- the local section uses the same important media assets or equivalent extracted
  assets
- the layout matches at the same viewport sizes
- the default visible state matches before user interaction
- the scroll state progression matches while scrolling down and back up
- hover, click, drag, wheel, fullscreen, video, and iframe behavior match when
  those interactions exist in the source section
- the local implementation works with this app's wrappers, Lenis, loader,
  header, cursor, and section order
- debugging logs and browser instrumentation are removed before final commit
- all non-`assistant` changes are staged and committed

## Start With The User Request

Before touching files, translate the request into a clone contract.

Capture:

- source site URL
- source tab id, if vawzen already has it open
- local tab id, if the app is already open
- exact source selector
- exact local target file or section folder
- explicit behaviors the user cares about
- known reference sections in this repo
- browser differences the user has noticed

Example request shape:

```text
Clone https://am-arc.com/
Source selector:
main > div > div.pin-spacer.pin-spacer-pintl > section.head.revealed > div.h2-wrapper

Local target:
src/components/landing/sections/hero/hero.tsx

Requirements:
- same opening reveal
- same scroll pin
- same video URLs
- same text animation timing
- same fullscreen behavior
```

Do not assume a screenshot is enough. Screenshots are only one verification
tool.

## Vawzen Tooling

Use these vawzen MCP tools for section cloning:

- `get_windows_and_tabs`
  Find the source tab and local app tab.
- `chrome_navigate`
  Refresh or open source and local pages.
- `chrome_javascript`
  Inspect DOM, computed styles, geometry, runtime state, events, and scroll.
- `chrome_console`
  Capture runtime errors and debug output.
- `chrome_screenshot`
  Capture viewport or element screenshots when visual comparison is needed.

Prefer `chrome_javascript` for facts. Prefer screenshots for visual validation.

## Phase 1: Identify Tabs And Selectors

First, list tabs:

```ts
get_windows_and_tabs()
```

Record:

- source tab id
- source URL
- local tab id
- local URL
- active tab

Then verify the selector exists on the source page:

```js
const target = document.querySelector("SOURCE_SELECTOR");

return {
  exists: Boolean(target),
  tagName: target?.tagName ?? null,
  className: target ? String(target.className) : null,
  text: target?.innerText ?? null,
};
```

If the selector does not exist:

- check whether the page is scrolled to a lazy-rendered area
- check whether the section is inside a smooth-scroll viewport
- ask the user only if the selector cannot be found after inspection

## Phase 2: Capture Source Structure

Extract the smallest useful HTML subtree, not the whole page.

```js
const target = document.querySelector("SOURCE_SELECTOR");

return {
  outerHTML: target?.outerHTML ?? null,
  parentHTML: target?.parentElement?.outerHTML ?? null,
};
```

For complex sections, inspect nearby wrappers too:

```js
const section = document.querySelector("section.head") ?? target?.closest("section");
const parent = section?.parentElement;

return {
  section: section?.outerHTML ?? null,
  parentClass: parent ? String(parent.className) : null,
  parentStyle: parent?.getAttribute("style") ?? null,
};
```

Classify each part:

- structural wrapper
- sticky or pinned wrapper
- background media layer
- dark overlay or mask layer
- title/text layer
- CTA layer
- interaction target
- decorative-only layer
- duplicated or generated runtime wrapper

Do not blindly copy runtime wrappers like `pin-spacer` unless the local app needs
an equivalent behavior. In this repo, we usually recreate the behavior in
maintainable React/CSS instead.

## Phase 3: Capture Source Geometry And Computed Styles

Measure the source at relevant viewport sizes.

Use this helper shape in `chrome_javascript`:

```js
function inspectElement(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return {
    selector,
    tagName: element.tagName,
    id: element.id,
    className: String(element.className),
    rect: {
      x: rect.x,
      y: rect.y,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    style: {
      position: style.position,
      display: style.display,
      width: style.width,
      height: style.height,
      minWidth: style.minWidth,
      minHeight: style.minHeight,
      margin: style.margin,
      padding: style.padding,
      overflow: style.overflow,
      opacity: style.opacity,
      transform: style.transform,
      transformOrigin: style.transformOrigin,
      transformStyle: style.transformStyle,
      perspective: style.perspective,
      zIndex: style.zIndex,
      color: style.color,
      background: style.background,
      borderRadius: style.borderRadius,
      fontFamily: style.fontFamily,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      pointerEvents: style.pointerEvents,
    },
  };
}

return {
  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollY: window.scrollY,
  },
  section: inspectElement("SECTION_SELECTOR"),
  target: inspectElement("SOURCE_SELECTOR"),
  title: inspectElement("TITLE_SELECTOR"),
  media: inspectElement("MEDIA_SELECTOR"),
  overlay: inspectElement("OVERLAY_SELECTOR"),
};
```

Capture both:

- initial state
- scrolled or interacted state

If the section is scroll-driven, sample multiple progress points:

```js
const samples = [0, 0.25, 0.5, 0.75, 1];
const root = document.querySelector("SECTION_OR_SCROLL_AREA_SELECTOR");
const distance = Math.max(root.offsetHeight - window.innerHeight, 1);

const result = [];

for (const progress of samples) {
  window.scrollTo(0, root.offsetTop + distance * progress);
  window.dispatchEvent(new Event("scroll"));

  const title = document.querySelector("TITLE_SELECTOR");
  const overlay = document.querySelector("OVERLAY_SELECTOR");

  result.push({
    progress,
    titleStyle: title ? getComputedStyle(title).cssText : null,
    overlayOpacity: overlay ? getComputedStyle(overlay).opacity : null,
  });
}

return result;
```

When the source uses a custom scroller, use that scroller instead of
`window.scrollTo`.

## Phase 4: Find Source Assets

For every visible media element, identify the real asset source.

Inspect:

```js
return Array.from(document.querySelectorAll("img, video, source, iframe")).map(
  (element) => ({
    tagName: element.tagName,
    src:
      element.getAttribute("src") ??
      element.getAttribute("data-src") ??
      element.getAttribute("poster"),
    currentSrc: "currentSrc" in element ? element.currentSrc : null,
    type: element.getAttribute("type"),
    media: element.getAttribute("media"),
    width: element.getAttribute("width"),
    height: element.getAttribute("height"),
    className: String(element.className),
  }),
);
```

For CSS background images:

```js
return Array.from(document.querySelectorAll("*"))
  .map((element) => {
    const backgroundImage = getComputedStyle(element).backgroundImage;

    return backgroundImage !== "none"
      ? {
          tagName: element.tagName,
          className: String(element.className),
          backgroundImage,
        }
      : null;
  })
  .filter(Boolean);
```

Asset rules:

- reuse original URLs only when that is the explicit requirement or the asset is
  remote and stable
- otherwise copy assets into `public/assets/...`
- keep filenames descriptive and close to the source when useful
- register new section media in `buildLandingMediaPreloadManifest(locale)`
  (`src/lib/landing3d/landingAssets.ts`) so the scheduler can warm it by
  viewport distance, and give the section a DOM `id` that matches the group's
  `sectionId` — see `docs/progressive-loading.doc.md`
- do not ship temporary screenshots used only for inspection

For videos:

- preserve `autoplay`, `muted`, `loop`, `playsInline`, and `preload` behavior
- preserve `source` `media` breakpoints
- verify `currentSrc`, `readyState`, `videoWidth`, `videoHeight`, and `error`
- check MIME behavior from the local server if the video does not play

For YouTube iframes:

- load iframes on demand when requested
- include `allowfullscreen`
- include `allow` permissions for fullscreen and playback features
- check fullscreen behavior from the iframe itself, not only document state
- avoid wrapping fullscreen iframes in clipping or transformed ancestors that
  break fullscreen controls

## Phase 5: Understand Source Motion

Motion is part of the clone.

Find out:

- what starts on page load
- what starts after loader/opening reveal
- what starts on scroll
- what starts on hover
- what starts on click
- what is pinned
- what pauses or hides when leaving the section
- what cleans up when scrolling back

Inspect live state during interaction:

```js
return {
  scrollY: window.scrollY,
  activeElement: document.activeElement?.tagName ?? null,
  fullscreenElement: document.fullscreenElement?.tagName ?? null,
  sourceStates: Array.from(document.querySelectorAll("SELECTORS")).map(
    (element) => {
      const style = getComputedStyle(element);

      return {
        tagName: element.tagName,
        className: String(element.className),
        opacity: style.opacity,
        transform: style.transform,
        display: style.display,
        pointerEvents: style.pointerEvents,
      };
    },
  ),
};
```

For scroll animations, inspect the source code if a local mirror exists.

Good targets:

- CSS files for layout and responsive rules
- JS bundles for timeline durations, scroll start/end, labels, delays, and
  callbacks
- original class names used by the live animation system

When cloning AM-Arc-style sections, preserve intent:

- intro reveal timing belongs to loader/opening transition completion
- pinned scroll sections need a local pin strategy compatible with Lenis
- black overlay opacity and text reveal should follow the same timeline ranges
- video pause/hide behavior should match on leave and enter-back when relevant

## Phase 6: Map Into This Repo

Use the repo's section architecture.

Preferred file split:

```text
src/components/landing/sections/<section>/
├── <section>.tsx
├── <section>.module.css
├── <section>AnimateLoader.tsx
└── <section>.animate.tsx
```

Rules:

- keep static markup in the section file
- lazy-load client animation in `*AnimateLoader.tsx`
- put scroll and DOM mutation logic in `*.animate.tsx`
- keep CSS Modules for layout and visual rules
- keep important source class names as secondary classes only when useful for
  matching or debugging
- do not make the whole section client-only unless the markup genuinely needs
  client state

Example:

```tsx
import styles from "./section.module.css";
import SectionAnimateLoader from "./sectionAnimateLoader";

export default function Section() {
  return (
    <section className={styles.section} data-section-root>
      <SectionAnimateLoader />
      <div className={styles.media} data-section-media />
      <h2 className={styles.title} data-section-title>
        Editable source text
      </h2>
    </section>
  );
}
```

Client loader:

```tsx
"use client";

import { startTransition, useEffect, useState } from "react";

type SectionAnimateComponent = typeof import("./section.animate").default;

export default function SectionAnimateLoader() {
  const [AnimateComponent, setAnimateComponent] =
    useState<SectionAnimateComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    void import("./section.animate").then((module) => {
      if (isCancelled) {
        return;
      }

      startTransition(() => {
        setAnimateComponent(() => module.default);
      });
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!AnimateComponent) {
    return null;
  }

  return <AnimateComponent />;
}
```

## Phase 7: Implement Animation Safely

Use existing scroll utilities when the section is normal layout-based.

Use direct visual math when transforms, Lenis, or fixed pinning make
`offsetTop` unreliable.

Animation file requirements:

- query DOM once per init
- use `createRAFBatch` for DOM writes
- listen to `scroll` and `resize` only when needed
- call `kickScroll()` after init
- reset every inline style you write during cleanup
- pause media when source behavior pauses it
- clean timers, observers, and event listeners

For loader/opening reveal sync, prefer an explicit state signal.

Example used by the hero clone:

- loader shell catches `transitionend` for `clip-path`
- landing main exposes `data-intro-reveal="done"`
- hero animation waits for `data-intro-reveal="done"`
- hero title starts only after that actual transition completion signal

This is better than guessing with a fixed timeout.

## Phase 8: Handle Interactions Without Breaking Other Interactions

Interactions often conflict. Inspect the source before deciding.

Common conflicts:

- click vs drag on carousel cards
- horizontal wheel vs vertical page scroll
- iframe interaction vs drag-through behavior
- hover transforms vs scroll transforms
- fullscreen iframe vs clipped/transformed parents

Rules:

- if an iframe is active, let users interact with the iframe
- do not force drag-through on an iframe if it breaks playback controls
- if both drag and click exist, use a movement threshold and suppress click only
  after real drag
- if horizontal scroll and drag should match, route them through the same update
  function
- if fullscreen is required, inspect parent transforms, `overflow`, `contain`,
  `allowfullscreen`, and iframe permissions

For media cards:

- load heavyweight iframes on demand
- keep placeholder card dimensions stable
- preserve card CSS while media is playing
- avoid layout changes on play

## Phase 9: Browser-Specific Checks

Always check browser-sensitive visual effects.

Known risk areas:

- Firefox 3D transform flattening
- Safari video autoplay and fullscreen behavior
- Chrome extension console noise
- WebGL zero-size warnings from parked canvases
- Lenis smooth-scroll affecting sticky or fixed sections

If a section is broken in one browser:

- inspect computed `transform`, `perspective`, `transform-style`, `contain`,
  `overflow`, and element bounds
- compare source browser behavior against local browser behavior
- prefer browser-specific fallbacks only when the rendering engine needs them
- keep fallback scoped to the section

## Phase 10: Debug Logs

Add temporary logs only when needed.

Project rule:

- if adding `console.log`, parse the logged value into a string first

Acceptable temporary pattern:

```ts
const payload = JSON.stringify({
  phase,
  hasIframe: Boolean(iframe),
  fullscreenElement: document.fullscreenElement?.tagName ?? null,
});

console.log(`[section-debug] ${payload}`);
```

Before final response:

- remove temporary logs unless the user explicitly asked to keep them
- remove debug attributes that are not part of the implementation
- remove temporary browser-side scripts or overlays

## Phase 11: Verify Local Against Source

Use vawzen to compare source and local.

Minimum verification:

- source tab screenshot
- local tab screenshot
- source computed geometry
- local computed geometry
- initial state
- mid-scroll state
- end-scroll state
- hover state, if any
- click/play state, if any
- fullscreen state, if any
- mobile breakpoint state, if any

Local inspection helper:

```js
function pick(selector) {
  const element = document.querySelector(selector);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);

  return {
    selector,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
    style: {
      position: style.position,
      opacity: style.opacity,
      transform: style.transform,
      overflow: style.overflow,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      zIndex: style.zIndex,
    },
  };
}

return {
  url: location.href,
  viewport: {
    width: innerWidth,
    height: innerHeight,
    scrollY,
  },
  root: pick("[data-section-root]"),
  media: pick("[data-section-media]"),
  title: pick("[data-section-title]"),
};
```

If source uses Lenis or another virtual scroller, use its runtime scroll value
or its scroll container instead of assuming `window.scrollY`.

## Phase 12: Code Verification

Run focused checks first:

```bash
bun run format <changed-files>
bun run lint <changed-files>
```

Run build before final:

```bash
bun run build
```

If the task only changes docs, use the relevant formatter/check command for the
docs and skip build unless the documentation change also affects code.

## Phase 13: Commit

Before final response for code or file changes:

- stage all non-`assistant` changes made for the task
- never stage or commit files under `assistant`
- follow `assistant/commiter.md`
- use small logical commits

Commit format:

```text
component(type): subject

- Bullet
- Bullet
- Bullet
```

Examples:

```text
media(fix): stabilize firefox carousel rendering

- Add Firefox-specific planar fallback for media cards
- Preserve Chrome 3D carousel path
- Keep iframe interaction and fullscreen behavior intact
```

```text
hero(fix): trigger title reveal after intro transition

- Track intro reveal completion from the loader shell transitionend
- Expose data-intro-reveal on landing main for hero animation timing
- Start hero title animation from the reveal completion signal
```

## Definition Of Done

The clone is done when another engineer or AI can answer yes to all of these:

- Did we inspect the live source tab with vawzen?
- Did we capture exact selectors, geometry, computed styles, and assets?
- Did we understand which behavior comes from CSS, JS, scroll, media, or iframe?
- Did we rebuild the section in repo-native files?
- Did we avoid one-off screenshot cloning when DOM/CSS was required?
- Did we keep SSR-safe markup where possible?
- Did we use lazy client animation controllers for browser-only behavior?
- Did we preserve source timings and interaction rules?
- Did we test local initial, scroll, and interaction states against source?
- Did we handle browser-specific differences intentionally?
- Did we remove logs and browser instrumentation?
- Did checks pass?
- Did we commit all non-`assistant` changes?

## Quick Clone Checklist

Use this condensed list during implementation:

1. Confirm tabs with `get_windows_and_tabs`.
2. Verify source selector exists.
3. Capture source HTML around the target.
4. Capture computed styles and geometry for all visible layers.
5. Capture source assets from DOM and CSS.
6. Inspect animation timing and interaction behavior.
7. Map source structure to section TSX, CSS Module, animate loader, and
   animation controller.
8. Copy or reference assets under `public/assets`.
9. Implement layout first, then motion, then interaction.
10. Verify local against source with vawzen.
11. Check mobile and browser edge cases.
12. Remove logs and temporary browser instrumentation.
13. Run format, lint, and build as appropriate.
14. Stage and commit.

