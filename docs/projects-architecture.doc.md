# Project collection architecture

Follow [the page cloning manual](page-cloning-manual.doc.md) when extending this
collection. `src/app/[locale]/projects/page.tsx` and `src/app/[locale]/projects/[slug]/page.tsx` are
server App Router entries; route support stays in private `_components` and
`_data` directories. The persistent layout supplies header, menu, cursor, page
transition and the shared footer. The footer is omitted on detail pages, as in
the reference.

## Content and destinations

`_data/projects.ts` preserves the source's complete 99-record ordering: 89 still
images in 16 families, 8 video records and 2 panorama tours. Eight filters retain
the source hash map and counts:

| Category | Hash | Cards |
| --- | --- | ---: |
| Projects | none | 16 |
| Interior | In | 40 |
| Exterior | Ex | 19 |
| Animation | Ani | 4 |
| 3D Rendering | 3dr | 59 |
| Concept | Con | 4 |
| Virtual tour | VR | 2 |
| 3D Model | 3dm | 29 |

Every still record has a unique detail slug. `generateStaticParams` generates all
89 routes. The selected image leads its family sequence, followed by the other
views in their original order. Metadata is generated from the record and unknown
slugs return 404. Source videos/tours incorrectly shared `pr17-1`; they remain
embedded category cards instead of producing those broken detail links.

Known views remain prerendered. Unknown slugs use the page's `notFound()` guard
with `dynamicParams: true`; the integrated production review found that the
disabled-fallback path returned 404 but logged `Internal: NoFallbackError` in
this installed Next version. Allowing the guard to run removes that server-log
error while retaining the same 404 response and UI. See the official
[dynamic-parameter configuration](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
and [`notFound` contract](https://nextjs.org/docs/app/api-reference/functions/not-found).

## Client boundaries and loading

The server catalog composes all card content and sends it through client slots.
The initial HTML contains the sixteen default cards; other category content
travels in the RSC payload to retain instant filtering without a network request.
The client provider owns category/hash synchronization and responsive button
ordering. Small wrappers handle visibility, links, eager loading, playback,
tours, and motion. Full project records remain outside the client module graph;
only category metadata enters through `project-categories.ts`. Support never
enters `src/pages`.

The 93 exact JPEG assets (9,455,235 bytes) include gallery images and concept
posters. `FadeInImage` supplies the existing 200ms decode reveal. Its
`unoptimized` option preserves the original pixels and avoids an additional JPEG
recompression. First visible images load eagerly; remaining images use native
lazy loading. Gallery links disable Next prefetch so scrolling does not fetch
89 destination payloads.

Videos mount a self-hosted native video only after pressing Play. Poster images,
play artwork, and captions are server composed; the client player receives only
the selected video URL, title, and caption track. No player is loaded for a poster.
The original record IDs, rounded triangle play icon and caption layouts remain.

The cafe and villa tours are self-hosted under `/vr/projects/`. They retain the
source XML, skins, 882 exact face tile files (40,103,834 bytes), seven cube-strip
previews (67,046 bytes), seven hotspot thumbnails and all hotspot routes. Both share the installed Pano2VR engine and WebXR
libraries under `/vr/03-Home/Output/`; neither duplicates an engine or imports
Spline. The existing `useInViewOnce` mounts each iframe within 200px of the
viewport. A tour remains mounted after entry, and a second tour does not start
while it is distant. The cafe contains three nodes and the villa four.

## Animation and geometry

The controller is imported after hydration. It uses the app's `scrollManager`,
batched style setter and `ResizeObserver`; there is no GSAP or Locomotive import.
Geometry is cached on initialization/resizing. Scroll callbacks calculate only
progress and write changed styles. Category changes and unmount unregister the
instance, observer, motion listener and inline styles. Reduced motion disables
the hero fade and card parallax.

Desktop copy is sticky over its hero range and fades with quadratic easing. The
left card column moves by -70% of each card's height and the right by +60%, using
that same quadratic curve over the gallery range. Measurements exclude the
first two cards' entrance scale. The fade ends at 65% of hero height; the gallery
range runs from the first card's center at viewport bottom to the container's
bottom plus 10% of its own height. Mobile cards flow normally.

The source heading/filter entrance has separate movements (600ms, starting at
400/540/680ms) and opacity reveals (200ms, starting at 400/550/700ms). Both use
quadratic easing. The first two cards scale from .85 to 1 over 1100ms with cubic
easing, starting at 550/680ms. Filter fills enter from above with a rounded edge
and settle over 500ms; active fills persist. These filters do not have magnetic
movement or rolling labels in the reference. Shared page transitions select the
heading, filter rows and first two desktop cards through
`data-page-transition-item`.

Local source font formulas preserve responsive typography, following the same
exception as the services/menu clones. Fixed source borders, play icon, radii
and spacing remain fixed when proportional conversion changes the reference.
The extra desktop row descent compensates for the native button baseline while
keeping real keyboard-accessible buttons. Mobile detail frames contain their
margins so the first image starts at the source's 102px offset.

## Review evidence

Vaelix comparisons at 1364×781 measured identical detail image/frame geometry:
first image 369.594/70.289 with 624.797 square dimensions, 765.375px frame heights,
and 105px overlap. The index heading/filter geometry differs by less than 0.02px:
heading 319.078/227.359/725.844/80, filter row 82.609px, first cards 684.609px.
Source scroll ranges were fade 0–513 and gallery 134–5510 at this viewport.

At 412×915, hero heading y 202.531, filters y 376.172 and gallery y 597.781 match the
source. Detail images start at 102px and repeat every 442px. All eight filter
hashes/counts were exercised in Vaelix. Both tour node lists and canvas mounts
were checked; clicking a cafe hotspot changed node 1 to node 3. The second tour
remained unmounted until approached. All 882 XML face tile paths and fourteen preview paths resolve locally. Every
node was opened in both tours without failed resource requests or uncaught
exceptions. Video posters were checked before and after Play: only the clicked
card mounts its privacy-enhanced iframe. Index-to-detail navigation preserves
the category query and uses the shared transition. Representative still/model/plan
routes return 200 and an unknown slug returns 404. Targeted Biome and TypeScript
checks passed; the full production build and site-wide browser review are owned
by the orchestrator.
