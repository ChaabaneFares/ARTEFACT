# Page cloning manual

Use this guide when reproducing an AM-ARC route in Artefact. The working
homepage and services page are the implementation references. Browser routing
follows AGENTS.md: use Vaelix for the user's Chromium tabs.

## Inspect before implementing

1. Inventory the reference route, responsive layouts, content, assets, links,
   interactive states, and the shared header/footer it actually uses.
2. Capture desktop, tablet and phone screenshots at matching viewport sizes.
   Record DOM rectangles, computed fonts, line heights, object positions,
   sticky bounds and document height as well as screenshots.
3. Inspect entry, exit, hover and scroll animations. Record start/end ranges,
   duration, stagger, easing and intermediate states. Inspect source bundles
   when scrolling alone cannot establish the precise behavior.
   Verify the effective easing numerically: some source names have invalid
   capitalization and fall back to the animation library's default curve.
   Correcting the name would change the observed animation.
4. Test each control, including keyboard focus, category hashes, Back/Forward,
   forms and galleries. Never submit a real form to the reference backend.

Vaelix `chrome_screenshot` with `background: true` captures a specific tab
reliably while agents use separate windows. `chrome_computer` screenshots can
capture the currently focused window. Use a freshly loaded, same-origin iframe
with fixed dimensions for responsive comparisons; initialize its dimensions
before loading the reference so animation ranges are measured correctly.

## Match the repository architecture

- Keep `src/app/<route>/page.tsx` server-safe and thin. Put route-only markup,
  data and helpers in `_components` and `_data` folders. Never use `src/pages`
  for internal composition: Next publishes it as legacy routes.
- Render content, headings, image dimensions and links in the initial HTML.
  A loading overlay must not delay content composition or depend on media
  readiness. The existing introduction runs on a fixed timeline.
- Reuse `VSlider`, `VSliderCta`, `FadeInImage`, selection pills, cursor effects,
  the persistent menu, page transition, Lenis and the existing footer.
- Every interactive component owns its colocated `.logic.ts` hook. Its `.tsx`
  renders markup and calls that hook. Keep static styles in CSS modules.
- Lazy-load scroll controllers behind small animation loaders. Use the
  repository's `scrollInteraction` utilities; do not introduce GSAP,
  ScrollTrigger, Locomotive or another scrolling engine into the application.
- Query elements at initialization, cache untransformed document geometry on
  resize/layout changes, and keep scroll frames to arithmetic and deduplicated
  writes. Use the shared scroll manager's RAF batching or a keyed RAF batch;
  avoid scheduling two frames for the same update.
- Own animation instance keys per route/component. On cleanup, remove scroll
  registrations and listeners, disconnect observers, cancel frames/timers,
  reset mutated styles and release cached references. Do not clear another
  mounted component's registrations.
- Recompute when responsive layout changes, and call `kickScroll()` after
  initialization. Layout observers must include content that can change height,
  such as FAQ accordions and filtered galleries.
- Respect reduced motion and retain usable static content if an animation or
  optional media cannot load. Fine-pointer cursor effects must not replace
  touch interaction or obscure keyboard focus.

See [structure](codebase-structure.doc.md), [animations](animations.md),
[routing](routing.doc.md) and [loading](progressive-loading.doc.md).

## Preserve visual geometry

Use the existing semantic color/font tokens and Poppins weights. Keep CSS
single-line per selector and register route CSS in the formatter exclusions.
Use the project's responsive `vw` sizing for normal layout.

Exact reference reproduction takes priority over a mechanical conversion that
changes appearance. Services, menu and new reference routes isolate AM-ARC's
font-unit formula in local custom properties instead of changing the global
root size. Fixed source geometry, viewport pinning, device breakpoints and
pixel-sized interaction targets may remain when measured comparisons require
them. Record these exceptions in the route's architecture document.

Match actual line wrapping and image crops, not just similar font sizes.
Preserve the source's different desktop/mobile composition. Use semantic
headings and meaningful names even where the source uses visual-only tags.

## Loading and navigation

- Keep initial hero/poster and visible text immediately available. Optional
  images use native lazy loading with explicit dimensions; reveal code checks
  both load events and already-cached completion.
- Reuse the media scheduler and scene boot gate for existing homepage media.
  Do not warm optimizer images under different URLs or with `fetch()`.
- Load gallery videos and VR embeds on interaction. Avoid prefetching every
  detail page or downloading all videos from the index.
- Use `next/link` for internal routes. The persistent curved SVG transition
  intercepts ordinary internal navigation while preserving modifier clicks,
  downloads, external links and same-route hashes. Mark animated outgoing
  titles with the established `data-page-transition-*` attributes.
- Preserve category hashes and direct-link behavior. Back/Forward must restore
  a usable page and never leave scroll, focus, cursor or menu locks active.
- Contact owns its compact footer; project details omit the large footer.
  Other pages use the shared footer through its route-aware client leaf.
- Use Artefact's own contact delivery configuration, never AM-ARC's API. Report
  delivery failure honestly and preserve the user's draft. Do not copy false
  company or legal claims into published privacy content.

## Repeat the review loop

1. Compare reference and local first paint at equal viewport dimensions.
2. Sample start, midpoint and end of every animation and sticky sequence.
3. Exercise all controls and routes on desktop and phone, then test resize,
   reduced motion, interrupted navigation and cached-media reloads.
4. Inspect console exceptions, failed local assets, horizontal overflow,
   hydration, inaccessible controls and cleanup after route changes.
5. Fix the observed discrepancy and repeat the affected comparisons. Broaden
   checks when a shared component or architecture change could affect others.
6. Run targeted formatting/type checks while implementing. Run full lint and
   a production build after integration, then test the production server and
   crawl every public route and local asset.
   Use `npm run test:contact`, `npm run build`, then a fresh
   `npm run start -- -p 3100` process and
   `npm run audit:production -- http://localhost:3100`. Restart the production
   server after rebuilding so it does not hold an older route manifest.
   Inspect its server logs as well as browser exceptions.
7. Record measured results, intentional branding/content differences and any
   external configuration needed for launch. Do not describe an approximation
   as a verified pixel-perfect match or simulated delivery as a real send.
8. Commit small logical changes using `assistant/commiter.md`. Never stage
   anything under `assistant/`. All task changes must be committed before the
   final response.

The route documents are the durable record of measurements and ownership;
this manual is the shared checklist for subsequent clones.
