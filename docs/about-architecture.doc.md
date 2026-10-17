# About page architecture

`src/app/[locale]/about/page.tsx` provides route metadata and the server-rendered
`about-content` shell. Its private `_data` folder owns the copy and eight exact
reference image assets. The persistent layout supplies the existing navigation,
cursor, route cover and footer; this route does not duplicate them.

Follow the [page cloning manual](page-cloning-manual.doc.md) for subsequent
reference pages, including source inspection and responsive comparison.

## Rendering and progressive loading

The title, studio introduction, portraits, client paragraph and philosophy copy
render on the server. The first interior photograph has image priority because
its leading edge appears in the opening viewport. All images use `FadeInImage`,
its cached-image readiness check and the existing reveal tokens. Subsequent
photographs and portraits use native image lazy loading and Next image sizing.
No image or animation module gates readable content or route transitions.

The route downloads only its eight photographs, approximately 445KB before Next
image optimization. It does not initialize Spline, the homepage media scheduler,
GSAP or Locomotive Scroll. A tiny client loader imports the animation controller
separately. Every interactive leaf owns its `.logic.ts` hook and rendering stays
in `.tsx`; the single-line CSS module owns static styles.

## Scroll behavior

`about-animation.logic.ts` registers one route-owned `scrollManager` instance.
Its initialization caches DOM references and document geometry. A resize
observer and viewport listener schedule geometry refresh through
`createRAFBatch`; scroll updates only calculate progress and write changed
styles through `createBatchStyleSetter`. Unmount and viewport changes remove the
instance and listeners, disconnect the observer, cancel queued work, and clear
all inline animation styles. Initialization ends with `kickScroll()`.

The desktop headline uses CSS sticky positioning to reproduce the reference's
sticky text behind the photographs. The first image shrinks from 1.5 to 1 while
the dark text cover reveals the studio introduction. The two portrait rows move
from opposing 5% offsets to the opposite offsets. The second photograph shrinks
and fades, followed by the two independent philosophy statements.

The reference's actual timelines were inspected without including its animation
engine in this application:

- First photograph: trigger starts at its initial scaled top plus 17% of its
  scaled height minus the viewport; ends at its top plus 80% of scaled height.
  A 13.3-unit timeline scales over the first 8 units, reveals the studio intro
  at unit 5, and fades that intro from units 10 to 13.3.
- Portraits: start at their top minus 5% of their height minus the viewport;
  end at their bottom plus 5% of height. A linear 20-unit movement drives both
  rows. Intro fade begins at unit 4 on desktop and unit 5 on mobile, over 3.3
  units. The reference's capitalized `Power3.Out` string resolves to its default
  quadratic ease; the controller reproduces that actual behavior.
- Second photograph: start at its top minus the viewport; end at its top plus
  30% of initial scaled height. Scaling occupies 6 units of the 8-unit timeline;
  opacity occupies the final 2 units, both with quadratic ease.
- Each philosophy statement: start when its center reaches the viewport bottom;
  end when its center reaches the viewport top. Cubic entrance and exit occupy
  the first and last 30%, with full visibility across the middle 40%.

At 768px and below the headline remains fixed, the photographs keep their source
10% downward displacement, and the two portrait rows contain four portraits.
The studio intro appears when the first image crosses the authored threshold,
then fades as the portraits enter. Reduced motion removes the photographic
zoom, entrance movement and portrait translation while preserving the text
changes necessary to read the page.

## Visual measurements

At 1364 × 837, reference and local markup share exact section bounds: hero
height 669.59375px; first image top 685.59375px; portraits top 1931.90625px;
client copy section top 2515px; second image top 3158.75px; philosophy section
top 3819.171875px; route height 5158.359375px. The desktop title font is
52.6042px and the intro font is 36.6268px, matching the reference.

At 412 × 915, the first image starts at 520.9906px after its source displacement,
portraits at 1363.875px, client section at 1763.09375px, second image at
2453.522px and philosophy at 2820.609375px. At scroll position 800px, the intro
opacity is 0.730217 and row translations are opposing 9.31108px, matching the
reference's measured 0.7302 and 9.3112px.

As for Services, local source font formulas and fixed authored spacings are an
intentional exception to general vw conversion. The shared custom scrollbar
remains part of this application's interface. A native reference scrollbar in
desktop mobile-width inspection can alter percentage padding by less than 1px;
it does not change the page's authored dimensions or scroll behavior. Studio
identity and contact details remain the existing shared application values.
