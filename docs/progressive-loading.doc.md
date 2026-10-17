# Progressive Loading Architecture

This document is the source of truth for how the landing page loads media and
boots 3D. It replaces the AM-ARC-style loading screen, which was deleted.

Read this before touching `mediaScheduler.ts`, `sceneBootGate.ts`,
`canvasParking.ts`, `landingAssets.ts`, or any `*Scene.client.tsx`.

## What Changed And Why

The old model blocked the page behind a full-screen loader until ~3.9MB of
assets downloaded and all five Spline scenes booted off-screen. It hid the cost
instead of removing it, and it front-loaded work for sections most visitors
never reached.

The current model has no asset-gated page-wide loader. The page paints and
loads immediately underneath a short marketing introduction, and every async
visual fades in when it is genuinely ready. Three separate concerns each have
their own mechanism:

| Layer | Question it answers | Owner |
| --- | --- | --- |
| Reveal | How does a thing appear without flicker? | `--reveal-duration` token + reveal hooks |
| Network | What downloads next? | `mediaScheduler.ts` |
| Main thread | When may expensive work run? | `sceneBootGate.ts` |

Keep them separate. Most regressions in this area come from one layer trying to
solve another layer's problem.

## Marketing introduction

The persistent shared layout renders
`src/components/ui/brand-intro/brand-intro.tsx` alongside every page, never in
place of page content. Each document load or reload shows the introduction,
including direct project-detail visits. Client-side navigation retains the
layout's dismissed state and does not replay it. This clones the Typeform startup wordmark and
moving bar as **powered by Vawzen**, over the menu's shared dark gradient.
The wordmark uses the supplied white horizontal SVG at
`public/assets/brand/vawzen-wordmark-horizontal.svg`, without a font dependency.
It has no loading percentage, asset checklist, or dependency on media readiness.

`src/components/ui/pointer-glow/` owns that background's CSS and pointer motion
for both surfaces. The gradient paints with the initial markup; desktop pointer
movement rotates it smoothly through complete turns. Narrow screens, touch
pointers, and reduced motion keep a still gradient. Its initial angle lives in
local CSS, so first paint does not depend on JavaScript or global custom
property registration. Frames stop when the tab is hidden or motion becomes
disabled. The animation cancels and removes its listeners when the intro
leaves; it adds no assets or loading gate.

CSS starts a fixed 3200ms timeline at first paint: a 400ms entrance, branding
until 2400ms, a 400ms wordmark exit, then a 400ms fade into the existing hero.
The moving bar uses the reference's 1300ms transform sequence. Reduced motion
keeps the branding and bar still while retaining the timed fade.

The colocated logic hook reads the CSS animation's remaining time, temporarily
locks input and marks underlying content inert, then releases it and removes
the overlay. Late hydration never starts the timer over. CSS also hides the
screen and releases pointer interception on schedule if JavaScript is delayed
or unavailable. Leaving the route restores interaction during cleanup.

The homepage hides its native scrollbar in the initial CSS using the
server-rendered hero marker. It stays hidden through intro dismissal; desktop
uses the existing overlay scrollbar, and mobile scrolling still works. This
prevents a native gutter from appearing before hydration and changing the page
width when the introduction locks scrolling.

All page markup, media downloads, the scheduler, video playback and scene
pre-boot stay active underneath. The introduction buys a short head start;
it does not promise that everything is loaded when it leaves. Never connect its
exit to `load`, media readiness, scheduler idle, or scene readiness.

## SSR content and animation chunks

Server composition and animation code splitting are separate responsibilities.
A server section renders its copy, structure and media shells. Small client
components own state and browser behavior in colocated `.logic.ts` hooks; client
variants use `.client.logic.ts`. Each interactive subcomponent has its own folder
and hook, following [code-splitter.md](../assistant/code-splitter.md). Shared
provider contracts live in `.context.ts`; children do not import parent hooks.

JavaScript motion belongs in a separate `.animate.ts` or `.animate.tsx` module
loaded with `import()`. Pure DOM controllers can export a mount function that
returns cleanup; React controllers can render `null` and own a colocated hook.
Merely moving code into `.logic.ts` or `.animate.ts` with a static import does
not create a deferred chunk.

Menu magnetic motion loads when the menu opens. Pointer glow loads when its
intro/menu surface becomes active. Project filter ripples load on their first
reveal. Slider CTA, service hover-area and footer button controllers load through
`src/lib/useDeferredMotion.ts` within a 200px viewport margin. Off-screen controls
do not request those modules. Pending loads cannot install after unmount;
installed controllers remove listeners and cancel their animation on cleanup.
Their native links, labels and interactions remain available before motion loads.

Keep CSS entrances, transitions, loader bars and accordion height transitions in
CSS so they can run from initial server paint. Keep required cursor tracking,
focus management and form state immediate. Heavy scene boot still follows the
boot gate below; none of these motion loaders may bypass it or become a page-wide
readiness gate. See [the SSR review](ssr-review.doc.md) for the section audit,
controller paths, updated production measurements and verification evidence.

## Services route and navigation

The services page paints server-rendered text and reuses the existing image assets
through `VSlider`'s services variant. Its scroll controller imports separately;
images reveal through `FadeInImage` without blocking the page. See
[services architecture](services-architecture.doc.md) for ownership and cleanup.

The shared page transition only covers a route change until the destination
commits. It never waits for media, scheduler, or scene readiness. Client-side navigation skips the marketing introduction; a fresh document load
on any route retains its timeline.

## Layer 1: Reveal

Nothing pops. Every asynchronous visual starts transparent and fades in over
`--reveal-duration` (200ms, defined in `src/app/globals.css` alongside
`--reveal-ease`).

Pieces:

- `src/lib/useImageReveal.ts`
  Hook for CSS-background elements. Probes the URL with `new Image()` and
  returns whether it is decodable.
- `src/components/ui/fadeInImage.tsx`
  `next/image` wrapper that fades on load.
- `src/components/landing/sections/1-hero/heroVideoReveal.tsx`
  Sets `data-video-ready` on the hero video.
- CSS pattern: element starts at `opacity: 0`, an attribute
  (`data-img-loaded`, `data-loaded`, `data-video-ready`, `data-ready`) flips it
  to `opacity: 1` with a token transition.

### The load-event trap

An image or video that is already cached, or that was server-rendered, can
finish loading **before** hydration attaches a listener. A listener-only reveal
leaves that element invisible forever.

Every reveal path therefore pairs its listener with a synchronous state check:

- images: `complete && naturalWidth > 0` (in the hook, and in a callback ref for
  `FadeInImage`)
- video: `readyState >= HAVE_CURRENT_DATA`

Do not remove these checks. They look redundant and are not.

### Hero poster

The hero video has no `poster` attribute, because `poster` cannot switch per
breakpoint. Instead a `<picture>` renders a real frame-0 still above the video
in `hero.tsx`, sharing the `.video` class so the geometry is pixel-identical:

- `public/assets/video/hero-poster-desktop.webp` (~110KB)
- `public/assets/video/hero-poster-mobile.webp` (~67KB, `max-width: 500px`)

They are extracted with ffmpeg and must be **frame 0**, or the crossfade to the
playing video visibly jumps:

```bash
ffmpeg -i public/assets/video/allLow1.m4v -frames:v 1 -c:v libwebp -quality 75 \
  public/assets/video/hero-poster-desktop.webp
```

Re-extract whenever the source videos change. The poster is the LCP element, so
it carries `fetchPriority="high"`.

### Hero text and playback

The headline and mobile action links start their existing entrance animations
from CSS as soon as the server-rendered shell paints. They do not wait for
hydration, the lazy scroll-animation module, or video loading. Reduced motion
shows them immediately without the entrance animation. The scroll module only
owns pinning, scroll transforms and off-screen playback control.

The responsive poster remains visible underneath while the autoplay video
loads independently. `HeroVideoReveal` fades the video over it once a frame is
decodable, including when that frame was ready before hydration. Keep
`autoPlay`, `playsInline`, `muted` and `preload="auto"` so playback can begin
as soon as the browser allows it; do not gate readable text on media readiness.

## Layer 2: Network — the media scheduler

`src/lib/landing3d/mediaScheduler.ts` warms assets in
distance-from-viewport order. It is started once by `landing-client.tsx` and
reads `buildLandingMediaPreloadManifest(locale)` from `landingAssets.ts`.

### Manifest

```ts
type LandingMediaGroup = {
  sectionId: string;                        // DOM id used to measure distance
  urls: readonly string[];
  breakpoint: "desktop" | "mobile" | "all"; // desktop is > 1024px
  kind: "image" | "scene-buffer";
  large?: boolean;                          // start-gated until near or last
};
```

Every `sectionId` must match a real DOM id. The manifest currently uses
`projects`, `visualization`, `vr`, `media`, `how-it-works` and `process`; the
hero section (`sti`) has no group because the video owns its own download. A
missing id means infinite distance, so the group is fetched last instead of
crashing — which makes a typo silent. Check this when adding a group.

### Ordering

Distance comes from `viewportDistance.ts`, shared with the boot gate so both
queues rank the page identically: `0` while any part of the section is on
screen, otherwise the gap to the fold, with above-viewport distance doubled
because users rarely scroll back up.

Tasks are picked by `(tier, distance)`, re-measured **every time a slot frees**.
There is no scroll listener; scrolling changes the answer automatically.

| Tier | Contents |
| --- | --- |
| 0 | scene buffers within ~2 viewports |
| 1 | images within ~2 viewports |
| 2 | everything further away, nearest first |
| 3 | `large` payloads that are far away — only when nothing else can use a slot |

Tier 0 beating tier 1 is load-bearing. Scene buffers are outnumbered ~80:5 by
echo-view frames; without the split the frames win every slot and the 3D never
boots. A section without its buffer cannot render at all, while a section
without its frames still looks right.

Concurrency is 3. In-flight work is never aborted: the splinecode cache is
shared with the scene clients, and discarding a half-finished download costs
more than letting it land.

### Warm images with `Image`, never `fetch`

`fetch()` and an `<img>`/CSS background for the same URL land in **different
cache partitions**, so a `fetch()`-based warm-up downloads every asset twice.
Measured on production: 162 requests for 82 frames.

The scheduler uses `new Image()`, which shares its cache entry with CSS
backgrounds, `next/image` and EchoView's own preloads. Do not switch it back.

### Idle signals

- `whenLandingMediaNearIdle()` — nothing within ~2 viewports is pending. The
  user's own screen is served. Scene pre-boot hangs off this.
- `whenLandingMediaIdle()` — the whole queue drained and, on desktop, the Spline
  runtime module is warm. The pano tour hangs off this.

Pre-boot must not wait for full idle: that means waiting behind megabytes of
far-away frames. `landing-client.tsx` also caps the wait at 3s
(`SCENE_PREBOOT_MAX_DELAY_MS`) so a slow connection cannot delay 3D forever.

### Frame ladder

Echo-view frames are queued coarse-to-fine (stride 8, then 4, 2, 1) by
`orderFramesCoarseToFine` in `landingAssets.ts`. The sequence is scrubbed by
scroll position, so a spread of frames animates roughly as soon as a few land,
instead of holding frame 1 until the full run arrives.

### Frame URLs go through the image optimizer

`buildEchoViewFrameSources` in `echoView.shared.ts` returns
`/_next/image?url=...&w=1200&q=75` for every frame except the first. With a
browser `Accept` header the optimizer answers in WebP: **62KB versus 86.5KB
raw, 28% smaller** per frame.

Frame 01 stays a raw `.jpg` because it is the card's SSR background and part of
first paint, which must never wait on an on-demand optimization.

`w` must be one of `next.config` `images.deviceSizes` and `q` one of
`images.qualities`, or the optimizer rejects the request. Both currently rely on
Next's defaults (1200 is a default device size, 75 the default quality) — adding
an explicit `images` config without those values breaks every frame.

The manifest and the renderer both call this one helper, which is what keeps the
scheduler warming the exact URL the page later requests. **Never build a frame
URL anywhere else.** Two spellings of the same frame means downloading it twice.

Note that the first visitor after a deploy pays the optimizer's work for each
frame; afterwards they are edge-cached.

### What is deliberately not in the manifest

- **EchoView frame 01** — it is the SSR'd CSS background of the card.
- **VSlider / design images** — they render through `next/image`, which picks
  its own width from `sizes`. Warming a raw or differently-sized URL fetches a
  file the page never uses.
- **The hero video** — the `<video>` element owns its own download.

## Layer 3: Main thread — the scene boot gate

`src/lib/landing3d/sceneBootGate.ts`. Booting a Spline scene creates a WebGL
context, parses the scene and compiles shaders: 100–350ms of blocked main
thread. Lenis animates scrolling on that same thread, so an unguarded boot
freezes the scroll.

Every boot goes through the gate, which enforces four rules:

1. **Serialized.** One scene boots at a time, page-wide. The slot is released
   when the scene reports ready, on unmount, or by a 15s watchdog so one broken
   scene cannot starve the page.
2. **Scroll-quiet.** A slot is granted only when `window.scrollY` has been
   position-stable for ~300ms and the tab is visible.
3. **Viewport-priority.** The nearest pending scene wins, re-picked *after* the
   wait — if the user moved while waiting, whatever is on screen now goes first.
4. **Urgency escalation.** A scene that has been continuously on screen for
   `ON_SCREEN_FORCE_MS` (700ms) boots even if the user keeps scrolling. An empty
   stage is worse than one short hitch. Sections flown past leave the viewport
   before the deadline, so fast scrolling stays hitch-free.

`startScenePreboot()` warms every registered scene during idle, so on most
visits the scenes are ready before the user arrives.

### Sample scroll position, not scroll events

Quietness is judged from sampled `scrollY`, not `scroll` events. A blocked main
thread **suppresses scroll events**, so an event-based check reports "quiet"
in the middle of a scroll — the exact condition the gate exists to prevent.
That bug shipped briefly and was caught only by measurement.

Stillness also requires an exact match (±0px). Lenis's ease-out tail crawls
about 1px per 100ms sample for seconds; any tolerance classifies that visible
motion as stopped.

## Canvas parking

`src/lib/landing3d/canvasParking.ts` parks (via `display: none`) only canvases
that are **off screen**. A visible scene is never parked.

An earlier design let just the single scene closest to the viewport centre paint
page-wide. In the process section all three cards are on screen at once, so two
of three rendered pure black — which read as "the 3D never loads" when in fact
it had loaded. Measurement showed the restriction bought nothing: scrolling the
warm process section with all three canvases painting produced 0 dropped frames
and 0 long tasks.

Every scene mount also keeps its still image mounted, so
`data-canvas-parked="true"` fades the still back in. A parked or failed scene
degrades to a static render instead of a black hole. This is also the failure
fallback now that the old 20s loader failsafe is gone.

## The 360 pano tour

The initial panorama's tiles are ~33MB and the iframe is same-origin, so its
engine boots on the same main thread. It mounts only when both are true:

- the media queue is idle (or near-idle if the user is approaching the section)
- scrolling is quiet

Do not add `loading="lazy"`: with idle-start semantics, mount already means
"load now", and lazy would defer it a second time.

During initial tour loading, its rounded viewport shows dark animated television
noise and a centered CSS loader. This local placeholder also covers the wait
before the iframe mounts. It fades out only when Pano2VR reports loaded with no
pending tiles, revealing the panorama and the existing drag instruction. Its
animations pause off screen and respect reduced motion. Neighbor warm-up does
not bring the loader back or interrupt the current tour.

The café tour has three locations. `pano.xml` contains their lightweight
configuration and panorama-anchored hotspots; Pano2VR's `openNext` streams the
destination tiles and applies the reference tour's crossfade and arrival view.
`tour-navigation.js` adds only the location buttons to the existing skin.

The server-safe section wrapper composes the client leaf in
`src/components/ui/virtual-tour/`. Its colocated `virtual-tour-client.logic.ts`
owns readiness, visibility, parking and scheduling; the TSX only renders.
The supplied 55px loader and television grain retain pixel geometry so their
appearance stays consistent across breakpoints. The viewport itself follows
the existing responsive `vw` layout. Hotspots retain Pano2VR's authored 32px
marker geometry inside its iframe; their reveal uses the shared token names
with defaults because iframe CSS does not inherit parent-page custom properties.

After the current view is ready, `useVirtualTourLogic` waits for **full media
idle**, scroll quiet and actual section visibility before enabling neighbor
warm-up. Leaving the section or hiding the tab stops new warm-up requests;
an in-flight image finishes normally. The iframe also pauses between requests
while the current panorama is loading tiles. Warm-up runs one low-priority
`Image` at a time and derives preview/base-level URLs from the same XML the
player reads, so the renderer reuses the image cache. The other locations have
~17MB of tiles, but warm-up downloads only ~1.5MB of base images. Higher
resolution tiles remain on demand, avoiding a full download of every location.

## Boot path: one engine

All five scenes use the raw `@splinetool/runtime`:
`loadSplineRuntimeModule()` + `loadCachedArrayBufferAsset()` +
`new Application(canvas, { renderMode: "manual" })`.

`@splinetool/react-spline` was removed — how-it-works was its last user, and it
was a second copy of the engine loaded for one scene.

One `Application` per `.splinecode` is a Spline constraint: an app binds one
canvas and one scene buffer. Rendering all five models through a single context
would require merging them in the Spline editor or a raw three.js rewrite. The
runtime module itself is loaded once and memoized.

## Measured baselines

Vercel production, cold cache, desktop:

- FCP / LCP **744ms**, hero video revealed **1066ms**
- all five `.splinecode` files total **~407KB gzipped** (VR 277KB,
  be-in-touch 118KB, the rest under 10KB)
- echo-view frame sequences were **~5.7MB** as raw JPEGs — the dominant cost of
  a cold visit, more than 10x all the 3D combined. They now serve through the
  image optimizer at ~62KB each, roughly **4.1MB**
- the pano tour pulled **5.3MB** in a single visit

Local, cold, after the scheduler fixes:

- FCP / LCP 696ms, all five scenes ready, 0 blank stages
- during a 12s scroll: 2 long tasks, 2 dropped frames
- throttled to 4 Mbps: scenes ready progressively (12s, 13.5s, all five by
  16.5s), tour deferred until after them

Asset note: the frames resist naive optimization — re-encoding to WebP at full
1280px width saves only 0–3%, because the film grain defeats compression. The
saving comes from combining a mild downscale with WebP: 1200px at q75 lands at
28%. A 960px downscale saves 19% but the card renders ~1130px wide, so it
softens visibly. Beyond that the only lever is **fewer frames**.

## Invariants

Do not:

- warm images with `fetch()` (see the cache-partition trap above)
- prefetch raw URLs for `next/image` call sites, or the hero video
- gate the boot window on scroll **events** instead of position samples
- allow tolerance in the stillness check
- run `Application.start()` or create a WebGL context outside a boot slot
- put a FIFO queue in front of boot-slot requests — `useDeferredSceneMount` was
  removed because it made grants arrival-ordered instead of distance-ordered
- park a canvas that is on screen
- reintroduce a viewport-blind idle preload in `sceneActivation.ts`
- reveal an element from a load event alone
- build an asset URL in two places — the manifest and the renderer must derive
  it from the same helper, or the asset downloads twice

## How to measure

Symptoms in this area are easy to misattribute, so measure before changing
anything. Drive a fresh Chrome over CDP rather than trusting a warm browser:

```bash
chrome.exe --remote-debugging-port=9333 --user-data-dir=<temp> \
  --no-first-run --window-size=1440,900
```

Then over the DevTools protocol:

- `Network.clearBrowserCache` for a true cold visit. Do **not** use
  `Network.setCacheDisabled` — it defeats the cache dedupe the design relies on
  and reports double the real bytes.
- `Page.addScriptToEvaluateOnNewDocument` to install instrumentation before any
  page script runs: `PerformanceObserver` for `longtask` / `paint` /
  `largest-contentful-paint`, a `requestAnimationFrame` loop recording frame
  gaps, a `MutationObserver` on `data-ready`, and a `getContext` hook to
  timestamp WebGL context creation.
- `Network.emulateNetworkConditions` (4 Mbps) to reproduce deployed behaviour.
- Drive real scrolling through Lenis:
  `globalThis.__artefactLenisRuntime.instance.scrollTo(y, { duration: 12 })`.

Useful checks:

- **blank stage**: for each `[data-canvas-parked]` mount, neither the canvas
  host nor the still is visible. Should always be zero.
  The virtual tour's drag-hint button also carries `data-ready` and legitimately
  has no canvas — exclude it.
- **duplicate fetches**: group `performance.getEntriesByType('resource')` by URL
  and count entries greater than one.
- **boot serialization**: WebGL context timestamps should be spread out, never
  clustered within a few milliseconds.

Under throttling the `load` event fires long after the interesting window, so
sample from navigation, not from load.

## Where to look when something is wrong

| Symptom | Look at |
| --- | --- |
| Section shows black where a model should be | canvas parking + the `data-canvas-parked` still fallback |
| Scroll stutters near a 3D section | boot gate — is something booting outside a slot? |
| 3D takes forever on a real connection | scheduler tiers; is something outranking the buffers? |
| Media downloaded twice | something is warming with `fetch()` |
| An image or video never appears | a reveal missing its synchronous cache check |
| Hero crossfade jumps | posters are not frame 0 |
