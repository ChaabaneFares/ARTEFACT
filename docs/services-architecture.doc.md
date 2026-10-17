# Services page architecture

`src/app/[locale]/services/page.tsx` is a server-rendered App Router route. Its private
`_data` and `_components` folders hold route content and the hero. The persistent
layout supplies the existing header, menu, cursor, scrollbar, and footer.

Follow the [page cloning manual](page-cloning-manual.doc.md) when adding or
reviewing another reference route.

## Shared slider

The page uses `VSlider` with `variant="services"`. The existing project variant
and its animation controller remain the default for the landing page. Content
uses the shared `VSliderItem` type and existing landing image assets, without
copying another asset set or introducing GSAP/Locomotive Scroll.

The services variant renders a desktop copy track with a CSS sticky image stack.
The copy track uses natural row flow rather than multiplying one fractional
height, matching the reference's per-row browser layout rounding. The desktop
CTA preserves the source's negative-margin container and padded inline mouse
area, so the original baseline and centered text positions remain exact.
`components/service-cta-mouse-area/` is a separate client leaf around that
desktop CTA. Its own hook moves the padded wrapper with the source pointer
formula, while the shared CTA skips its generic anchor magnetism inside this
wrapper. It uses native mouse listeners and WAAPI, so the nested link remains
the only keyboard action. Moves last 300ms and returns 500ms, with measured
quadratic easing; desktop widths above 1024px enable the effect. Reduced motion
disables it. Mouse/media listeners and active animations are removed on exit.

The lazily imported slider controller uses `scrollManager` and the smart style setter
to wipe successive layers over viewport-length scroll ranges. Both the departing
and arriving images move their crop positions. Below 769px, five flowing cards
replace the pinned stack, with image crop parallax and the reference's horizontal
category shortcuts. The shortcuts scroll to a card with Lenis and a 120px offset.
The reference's desktop category buttons only provide hover feedback.

Geometry is cached at initialization and updated on viewport/content resize;
scroll callbacks only calculate values and write changed styles. Every instance,
resize observer, hover listener, and inline animation style is cleaned up on route
exit or viewport changes. Reduced motion keeps image crops still while retaining
scroll-driven layer changes needed to show all the services.

`FadeInImage` supplies the existing cached-image check and 200ms readiness reveal.
Images use native lazy loading and Next image sizing. The route has no Spline,
video, media-scheduler dependency, or asset readiness gate. Its markup and text
paint independently of images and the optional animation controller.

## Styling and component boundaries

Each interactive leaf/controller owns its colocated `.logic.ts` hook; rendering
stays in `.tsx`, with single-line CSS modules. Slider types live in a separate
file. The shared CTA and lazy-controller loader now also follow that separation.

As in the already cloned header/menu, a local source font formula preserves the
reference's responsive typography without changing the document root. The small
fixed source spacings, button padding, and entrance displacement are retained
for visual parity. This is an intentional exception to the generic vw conversion
guide: converting them to viewport percentages changed the desktop buttons and
mobile spacing. Major page widths remain percentages/vw, and pinning uses vh.
CSS formatter exclusions preserve the repository's single-line module style.

The hero's opacity and movement use the exact cubic `power2` curve. Its desktop
sequence starts at 340ms, with 80ms gaps across the eyebrow, three title lines
and category links; mobile has one title block, so links start at 500ms. Desktop
media and mobile card heights use native CSS `round()` to match the reference's
integer pin/card measurements, with authored fractional sizes as the fallback.

## Shared page transition

`src/components/layout/page-transition/` persists beside the scroll container.
It intercepts ordinary same-origin links while preserving modified clicks,
external links, downloads, and same-path anchors. Menu click handlers still run.
Next navigation begins at 620ms, beneath a curved gray SVG cover: 500ms and
188ms to cover, followed by 188ms and 500ms to uncover. The easing and path shapes
match the reference, implemented with browser animation frames and WAAPI.

The cover waits for the destination route to commit, not for images or scenes.
Lenis and native scroll are reset beneath it. Wheel/touch/scroll keys are held
during the transition, cursor feedback is cleared, and destination heading focus
is restored without scrolling. History navigation cancels pending transitions;
unmount and a failed-navigation timeout restore interaction. Reduced motion
navigates immediately. Internal returns home skip the marketing introduction;
a fresh homepage load retains its existing fixed 3200ms introduction.

## Destinations and validation

The five View more/image links preserve `/projects#In`, `#Ex`, `#3dr`, `#Ani`,
and `#VR`, linked to the corresponding categories on the project index.
`/projects/[slug]` remains intact.

Validation includes production build/lint and Vaelix comparisons against
`https://am-arc.com/services`: desktop pinning/wipes, mobile typography and card
geometry, horizontal shortcuts, footer reveal, CTA/cursor feedback, menu and
header navigation, returning home, and history/cleanup behavior.

The independent production review at 1364 × 781 matched the source copy and CTA
geometry exactly: first title top 1075.1875px and CTA rectangle
315.15625, 1254.53125, 128.71875 × 50px. The source and local showcase bounds are
49.71875, 781, 1264.5625 × 3891.875px; its pinned image is 435 × 435px. At
412 × 915 all five card tops/heights and CTA rectangles match, including first
card top 548.78125px, height 693.1875px, and CTA top 1191.96875px.

Source desktop wipe ranges at 1364 × 781 are 781–1562, 1562–2343, 2343–3124,
and 3124–3905. The CSS pin ends at the text track bottom minus viewport height
(3892px in the reference's integer measurement). Crop changes remain linear;
reduced motion holds their crop at 50% while retaining functional image wipes.
Geometry remeasurement is RAF-batched and all pending work is canceled on exit.

After the shared CTA's final ripple and label corrections, all five CTA rectangles
were compared again at 1364 × 781, 768 × 1024 and 375 × 812. Every x/y/width/height
matched the reference. At 375px the first rectangle is
124.796875, 1151.015625, 125.40625 × 48px; at 768px it is
326.3125, 1661.203125, 115.359375 × 46px.

The resize audit crossed 1364 → 375 → 1364 at scroll 1200px: desktop layers clear
their clip styles on mobile and restore the correct 53.6492% first wipe on return,
with no horizontal overflow. Navigating to About removes the Services root;
history Back remounts exactly one root and restores the saved 1200px position
and wipe state. Menu navigation releases both scroll locks and restores main
interaction. Same-route Services menu clicks reproduce the reference's behavior:
reset scroll to zero and leave the menu open. The independent navigation,
history and resize tests produced no browser console errors.

See [the shared footer review](footer-architecture.doc.md) for its responsive
geometry, exact time-based reveal and the intentional configured-contact
differences from the reference business identity.

The independent CTA interaction review also matched wrapper magnetism: at the
same 75%-width, center-height pointer position, source/local transforms settle
at 9.719px/-9.3534px and 9.71899px/-9.35336px. The source easing evaluates to
0.4375, 0.75 and 0.9375 at quarter, half and three-quarter progress. The source
hit area extends a fixed 40px and its ripple uses a fixed 50px radius. Leaving
returns the wrapper to zero; a reduced-motion check keeps it there. Following
View more reaches `/projects#In` with 40 cards, and the detached wrapper retains
no animations after the route transition. Mobile CTA rectangles remain unchanged.
