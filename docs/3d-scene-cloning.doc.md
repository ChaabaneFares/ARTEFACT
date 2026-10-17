# External 3D Scene Cloning Guide

This document records the exact process used to clone the AM-ARC VR headset
section into this repo, including the scene asset, material fixes, pointer
motion, scroll motion, performance work, and the file layout that made it
stable.

Use this when cloning another external 3D section so the work follows the same
pattern instead of becoming a one-off integration.

## Goal

The target was not just "show the model".

The target was:

- match the original scene look closely
- keep the body, strap, front plate, and lettering visible
- reproduce the original pointer behavior
- reproduce the original scroll behavior
- keep the section SSR-safe and aligned with the repo scroll system
- keep quality high while reducing idle runtime cost

## What Was Cloned

Source site:

- `https://am-arc.com/`

Original source scene:

- `https://prod.spline.design/4RcOVTxaOgN7rE-1/scene.splinecode`

Local hosted scene in this repo:

- `public/assets/landing-page/vr/am-arc-vr.scene.splinecode`

Primary headset object:

- object id: `57016588-a7c0-44e9-9475-e4cb308556ba`

Shared visor material:

- material id: `f0e5e178-3fe3-459d-b01e-36dd811ce800`

Meshes that needed the visor material applied:

- `6dd7dfc3-b2d6-4a28-8d0b-700d80a5fae5`
- `1dc0559b-6ddd-42b8-85f6-0401381c24a5`

## Final File Layout

The working implementation is split like this:

- `src/components/landing/landingClient.tsx`
  Landing shell: starts the media scheduler, triggers scene pre-boot, drives the
  section noise overlay. The hero entrance runs from CSS; there is no page-wide
  loading screen.
- `src/lib/landing3d/landingAssets.ts`
  `buildLandingMediaPreloadManifest(locale)`: which assets belong to which section, at
  which breakpoint, and in what order.
- `src/lib/landing3d/mediaScheduler.ts`
  Viewport-priority download queue and the `nearIdle` / `idle` signals.
- `src/lib/landing3d/sceneBootGate.ts`
  Serializes Spline boots, waits for scroll stillness, and orders pending boots
  by distance from the viewport.
- `src/lib/landing3d/sceneActivation.ts`
  Shared `IntersectionObserver` prewarm/activate helper plus pre-boot
  subscription for landing Spline scenes.
- `src/lib/landing3d/spline.shared.ts`
  Shared Spline module loading, cached `.splinecode` fetches, pointer math,
  render burst constants, and backing-store sizing helpers.
- `src/components/landing/sections/vr/vr.tsx`
  Section markup and stable DOM hooks only.
- `src/components/landing/sections/vr/vrAnimateLoader.tsx`
  Tiny client-only lazy loader for the scroll animator.
- `src/components/landing/sections/vr/vr.animate.tsx`
  ScrollTrigger-based section animator that maps scroll progress to scene
  rotation.
- `src/components/landing/sections/vr/vrScene.client.tsx`
  Spline runtime mount, material override, pointer motion, render bursts, and
  scene controller registration.
- `src/lib/landingVr/vr.shared.ts`
  Shared selectors and section id.
- `src/lib/landingVr/vrSceneController.ts`
  Bridge between the scroll animator and the mounted Spline scene.
- `src/components/landing/sections/process/process.tsx`
  Process section scene metadata for `send-brief`, `be-in-touch`, and
  `get-results`.
- `src/components/landing/sections/process/processScene.client.tsx`
  Shared process Spline mount, lower process backing-store resolution, pointer
  motion, material overrides, runtime pause, and controller registration.
- `public/assets/Noise.png`
  AM-ARC noise texture used by the process section overlay.

Important:

- Keep section render files in `src/pages/...`.
- Keep non-component helpers in `src/lib/...`.
- Do not put helper-only modules like scene controllers under `src/pages/...`.
  Next currently type-validates files in that tree like page modules.

## How The Original Behavior Was Extracted

The original AM-ARC site is minified in production, so the reliable process was:

1. Use Chrome MCP to inspect the live canvas node and confirm the scene mount.
2. Pull the production bundle URL from the page.
3. Download the source map for that bundle.
4. Read `components/oculus.jsx` from the source map.

That source map showed the real interaction model:

- the headset is a Spline scene (AM-ARC loaded it with
  `@splinetool/react-spline`; this repo mounts every scene with the raw
  `@splinetool/runtime` instead — see `docs/progressive-loading.doc.md`)
- pointer movement offsets `position.x`, `position.y`, `rotation.x`, and
  `rotation.y`
- scroll only scrubs `rotation.x`
- the scroll range is `baseRotationX -> baseRotationX + 0.5`
- the trigger is the scene wrapper itself

For this case, reading the source map was much more accurate than trying to
infer the behavior from screenshots alone.

## Step-By-Step Workflow

### 1. Audit the source scene first

Before writing code, capture:

- scene URL
- primary object id
- material ids
- mesh ids that render incorrectly
- pointer math
- scroll range and trigger window

Do not assume the exported GLB is enough if the original section is Spline.

### 2. Download and self-host the scene

Use the original `.splinecode` file when the source is Spline-authored.

Reason:

- geometry, materials, and authored scene state stay closer to the source
- there may be no standalone texture set to recover
- converting to GLB can lose authored material behavior

For the AM-ARC headset, the correct production path was to self-host the
`.splinecode` file under `public/`.

### 3. Verify whether the problem is texture loss or material loss

In this clone, the side shell and strap looked wrong at first.

The first suspicion was "missing texture", but the scene data showed:

- `shared.images` was empty
- there was no missing PNG or JPG texture to fetch

The actual issue was material assignment.

The visor and text were using a different stylized material path from the body
and strap. The body and strap existed, but their inline materials rendered too
flat and dark in our runtime path.

### 4. Fix the material mismatch directly

The successful fix was:

1. Find the shared visor material id.
2. Find the body and strap mesh ids.
3. Re-assign those meshes to the visor material after scene load.

This happened inside the mounted runtime, not as a scene file rewrite.

For the AM-ARC headset, that meant applying
`f0e5e178-3fe3-459d-b01e-36dd811ce800` to:

- `6dd7dfc3-b2d6-4a28-8d0b-700d80a5fae5`
- `1dc0559b-6ddd-42b8-85f6-0401381c24a5`

If another clone looks like "only the front works", check material assignment
before chasing textures.

### 5. Keep the section SSR-safe

The repo pattern should stay:

- server-safe section markup in `vr.tsx`
- client-only lazy loader in `vrAnimateLoader.tsx`
- dedicated scroll controller in `vr.animate.tsx`
- dedicated runtime mount in `vrScene.client.tsx`

This keeps the visible section server-rendered while deferring client-only scene
logic.

### 6. Separate pointer motion from scroll motion

The stable implementation does not let scroll and pointer handlers overwrite the
same transform state directly.

Instead it keeps:

- one base transform from the loaded Spline object
- one pointer delta transform
- one scroll delta for `rotation.x`

Those are composed into one target transform before each render.

This prevents:

- scroll fighting pointer movement
- pointer leave resetting the scroll pose
- animation jitter from competing writers

### 7. Reproduce the original pointer math exactly

The original pointer math from AM-ARC was:

- `POSITION_MULTIPLIER = 10`
- `ROTATION_X_DIVISOR = 40`
- `ROTATION_Y_DIVISOR = 67.5`

That math drives:

- `position.x`
- `position.y`
- `rotation.x`
- `rotation.y`

Keep the pointer constants explicit and section-local so another clone can swap
in new values without rewriting the runtime.

### 8. Reproduce the original scroll behavior with repo scrollTrigger

The original AM-ARC scroll behavior for the headset was simple:

- scroll changes only `rotation.x`
- range: `0 -> 0.5`
- start point: section top hits viewport center
- end point: section bottom hits viewport top

In this repo, that is expressed through `scrollTrigger.createInstance(...)`
instead of GSAP ScrollTrigger.

The VR section uses:

- `values: [[0, 0.5]]`
- `startPoint: [0.5]`
- `endPoint: [0]`

The scroll animator does not touch DOM styles.

It only publishes the scroll-derived rotation value to the registered scene
controller.

### 9. Optimize after visual parity, not before

The order matters.

First get:

- the correct asset
- the correct material look
- the correct pointer pose
- the correct scroll motion

Then optimize.

For the AM-ARC headset, the successful optimization set was:

- idle preload for the runtime module and scene buffer
- `IntersectionObserver`-gated mount so the scene does not boot at first paint
- manual render mode so the scene does not redraw constantly at rest
- explicit `requestRender()` only when transforms or materials change
- short render bursts after load and resize to settle the first frame

### 10. Warm up manual-render scenes

This was required.

Without a short initial render burst, the first resting frame looked degraded.
The scene only looked correct after pointer movement caused additional renders.

Fix:

- run a short render burst after initial load
- run a smaller render burst after resize

For this section:

- initial burst: `6` frames (`LANDING_3D_INITIAL_RENDER_BURST_FRAMES`)
- resize burst: `3` frames (`LANDING_3D_RESIZE_RENDER_BURST_FRAMES`)

## Current Landing Boot Model

There is no loading screen. The landing page paints immediately and 3D boots
progressively. `docs/progressive-loading.doc.md` is the source of truth; the
short version for scene work:

- Scene buffers are downloaded by the media scheduler, which ranks work by
  distance from the viewport and puts scene buffers ahead of nearby decorative
  images.
- Every Spline boot must go through `useSceneBootSlot(...)` from
  `sceneBootGate.ts`. Boots are serialized page-wide, wait for scrolling to
  settle, and are ordered by distance from the viewport. A scene that has been
  on screen for 700ms boots anyway rather than making the user wait.
- `startScenePreboot()` warms every scene during idle, so scenes are usually
  ready before the user arrives.
- Each scene keeps a static still mounted underneath its canvas. The still shows
  until `data-ready="true"`, and returns whenever the canvas is parked or the
  boot fails. A section is never blank.
- Off-screen canvases are parked with `display: none`. On-screen canvases are
  never parked.

Scene clients no longer receive boot context. `LandingBootProvider`,
`forceSceneBoot` and `reportSceneReady` were deleted along with the loader; a
scene decides for itself when it is ready and simply flips `data-ready`.

Mobile and tablet (<= 1024px) still render static images for every 3D section,
so no Spline runtime or `.splinecode` file is requested there at all.

## Process Section Performance Notes

The process section is the main scroll-freeze risk.

The three process scenes do not have the same cost profile:

- `send-brief.scene.splinecode` is small
- `get-results.scene.splinecode` is small
- `be-in-touch.scene.splinecode` is the heavy outlier

The current implementation keeps all three live on desktop, but it reduces the
process canvas cost separately from VR and How-it-works:

- `PROCESS_BACKING_STORE_SCALE = 0.6`
- process boots are serialized by the scene boot gate like every other scene
- process runtime pauses after inactivity and resumes when interaction or
  scroll requires it
- all three cards paint while they are on screen. They are siblings in one
  section, so parking the two that are not closest to the viewport centre left
  them rendering black. Measurement showed painting all three costs nothing:
  0 dropped frames and 0 long tasks scrolling the warm section.

Do not apply the process resolution scale to VR or How-it-works. Those scenes
were restored to full-quality rendering because the lower backing-store scale
was visibly worse there.

If the process section freezes again, check this order:

1. Confirm whether a boot is running outside a boot slot. Timestamp
   `getContext` calls: they must be spread out, never clustered.
2. Confirm whether `be-in-touch.scene.splinecode` is the active freeze source.
3. Compare live Spline parse/start cost against a static render fallback.
4. Only then tune resolution, boot timing, or runtime pause behavior.

Booting during idle removes scroll-time freezes, but it does not make the Spline
work free. It moves the cost to a moment when the user is not scrolling.

## Reusable Rules For The Next Clone

When cloning another 3D section, follow this order:

1. Identify the actual render source.
   - Spline scene, raw Three.js scene, GLB, image sequence, video, or canvas.
2. Inspect the live page in Chrome before writing code.
3. Pull source maps when the production bundle is minified.
4. Record object ids, material ids, mesh ids, and motion ranges.
5. Host the raw asset locally before tuning behavior.
6. Match the look first, then add pointer motion, then add scroll motion.
7. Keep section markup SSR-safe and move helpers to `src/lib` when they are not
   React components.
8. If scroll needs to talk to a live scene instance, use a small controller
   bridge instead of querying globals.
9. If performance work changes the look, roll it back and re-introduce one
   optimization at a time.
10. Register the section's assets in `buildLandingMediaPreloadManifest(locale)` and route
    its boot through `useSceneBootSlot(...)`.
11. Verify the section at the start, middle, and end of its scroll window in
    Chrome.

## Failure Modes And Fixes

### Only the front plate looks correct

Likely cause:

- material mismatch, not missing mesh

Fix:

- inspect material ids and compare visor/body/strap assignments

### The scene looks bad before the first pointer move

Likely cause:

- manual render mode with no warm-up frames

Fix:

- add a post-load render burst

### Scroll and pointer movement fight each other

Likely cause:

- both handlers write directly to the same scene transform

Fix:

- separate base, pointer, and scroll channels and compose them into one target

### The scene loads too early or feels heavy

Likely cause:

- immediate runtime start at page load

Fix:

- defer mount with `IntersectionObserver`
- let the media scheduler warm the buffer by viewport distance
- render manually

### The scene freezes when approached by scroll

Likely cause:

- Spline parse/start work is happening on the main thread as the section enters
  view

Fix:

- route the boot through `useSceneBootSlot(...)` so it cannot run mid-scroll
- let `startScenePreboot()` warm the scene during idle instead
- park canvases only while they are off screen
- isolate the largest scene and consider a static render fallback
- lower only that section's backing-store scale if the visual hit is acceptable

### A section renders black where the model should be

Likely cause:

- the canvas is parked while on screen, or the still fallback is hidden

Fix:

- park only off-screen canvases
- keep the still mounted and show it whenever `data-canvas-parked="true"`

### TypeScript complains about helper modules under `src/pages`

Likely cause:

- Next type validation treating those files like page configs

Fix:

- move helper-only modules to `src/lib`

## Verification Checklist

Before calling a 3D clone complete, verify all of this:

- the source asset is hosted locally when feasible
- the main object id is known and resolved successfully at load
- the body does not depend on a missing material or texture assumption
- the initial resting frame looks correct
- pointer motion matches the source behavior
- scroll motion matches the source behavior
- the scene does not rerender constantly at rest
- no section is ever blank: a still shows until the canvas is ready
- WebGL context creation timestamps are spread out, not clustered
- process desktop renders all three canvases while the section is on screen
- `bunx biome check` passes on touched files
- `bunx tsc --noEmit --incremental false` passes
- local Chrome screenshots at multiple scroll positions match the intended pose

## AM-ARC VR Case Summary

This clone succeeded because of five decisions:

1. Use the original `.splinecode` scene instead of relying on GLB conversion.
2. Diagnose the dark strap/body as a material problem, not a texture problem.
3. Reassign the strap/body meshes to the visor material after scene load.
4. Recreate the exact pointer and scroll math from the production source map.
5. Move the scroll behavior into the repo's `scrollTrigger` architecture with a
   controller bridge instead of mixing everything into one component.
