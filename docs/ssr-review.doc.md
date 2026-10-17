# Server/client rendering review

Reviewed 2026-10-13. Baseline: `2130e845fe1e122160c0a2be0aad9ad16cbb8650`.

This review covers every page and its sections, including the shared shell.
Next.js already prerenders client components for the initial response. The
change here is ownership: static content and composition stay outside the
client module graph, while browser state and effects live in small client
components. Server content is passed through `children` or named slots; a
client wrapper does not import its server content component.

## Animation code splitting correction

The first SSR pass separated content ownership but did not finish the animation
and component isolation pattern in [code-splitter.md](../assistant/code-splitter.md).
A `.logic.ts` file imported synchronously is still part of the initial client
module graph. Moving content to server slots does not change that fact.

The correction adds real dynamic imports for these optional controllers:

| Controller | Separate module | When it loads |
| --- | --- | --- |
| Menu magnetic links | `header/menu/menu.animate.ts` | Menu opens |
| Menu/intro gradient motion | `ui/pointer-glow/pointer-glow.animate.ts` | Surface becomes active |
| Project filter ripple | `project-filter/project-filter.animate.ts` | Filter first reveals |
| Slider CTA ripple/motion | `ui/VSlider/VSliderCta.animate.ts` | Button approaches viewport |
| Service CTA hover area | `service-cta-mouse-area/service-cta-mouse-area.animate.ts` | Area approaches viewport |
| Footer button motion | `layout/footer/footerButton.animate.ts` | Button approaches viewport |

`useDeferredMotion` observes a 200px viewport margin for the last three controls.
Pending loads cannot install after unmount. Installed controllers return cleanup
functions that remove listeners and cancel animations. Native links and readable
content never wait for the controller. Existing landing, VSlider, project-gallery,
About, FAQ, Privacy and footer scroll controllers already have separate lazy
animation modules and remain in place.

Header/Menu, catalog/card and contact controls now live in their own
`components/<control>/` folders with owned `.logic.ts` hooks. Providers retain
shared state; `.context.ts` supplies its contract. Children do not import the
parent's implementation hook. Client variants use matching `.client.logic.ts`
files. Tab keyboard handling, file removal, clipboard handling and submit pointer
feedback belong to their controls.

CSS entrances, transitions, loader timelines and accordion height transitions
remain in CSS modules. They can begin with server markup without hydration or
an animation download. Cursor tracking and essential focus, form and navigation
state remain immediate client behavior. A filename alone never establishes a
network boundary; the dynamic import and activation policy do.

## Section-by-section result

| Page / section | Server responsibility | Necessary client responsibility |
| --- | --- | --- |
| Shared layout | Document, font setup, page composition | Initializer, scroll runtime, cursor, page transitions |
| Header branding and top navigation | Logos, link collection, labels | Active route, scrolled state, estimate visibility |
| Expanded menu | Main/social links, contact labels, icons | Open/close phase, focus trap, scroll lock, copying, pointer effects |
| Initial intro | Wordmark, caption, loading track | Timer, pointer glow, temporary document locks |
| Shared footer | Content, contact identity, configured socials, credit | Reveal controller, copying and button motion |
| Landing: hero | Heading, links, poster, video/source markup | Video reveal and scroll controller |
| Landing: design | Echo title/canvas shell, slider cards and project copy | Frame playback, CTA feedback and slider animation |
| Landing: visualization | Echo title/canvas shell, slider cards and project copy | Frame playback, CTA feedback and slider animation |
| Landing: VR | Section/tour shell and drag artwork | Scene boot, iframe readiness, tour interaction and parking |
| Landing: featured videos | Titles, all card markup, posters and play artwork | Image readiness, mobile deck animation, native playback |
| Landing: how it works | Section shell and scene mount | Lazy Spline scene and scroll animation |
| Landing: process | Three step numbers, titles, descriptions, links and scene mounts | Scene loading, fallback readiness and scroll animation |
| Services: hero | Eyebrow and heading | Shared route entrance effects |
| Services: shortcuts | Service collection and button labels | Mobile scroll action |
| Services: all five service slides | Desktop/mobile titles, descriptions, numbering and images | Image reveal, CTA feedback, sticky/reveal controller |
| Projects: heading | Page title and hero structure | Responsive filter controls and category/hash state |
| Projects: still-image cards | Record selection, captions and link content | Filter visibility, category query links, eager-image selection and cursor feedback |
| Projects: animation/concept cards | Poster/play artwork, captions and video source selection | Click-to-play native video |
| Projects: both virtual tours | Tour source and card content | Visibility-triggered iframe mounting |
| Project details: all 89 routes | Metadata, selected-image-first family sequence, title and counter | Image load/decode reveal |
| About: headline/introduction | Complete copy and heading structure | Entrance/pinning controller |
| About: photos/portraits | Image selection, dimensions, alt text and six-portrait layout | Image reveal and scroll effects |
| About: clients/philosophy | Client copy and both philosophy statements | Scroll controller |
| Contact: heading/tabs | Heading, tab labels and decorative content | Tab state, keyboard selection and busy state |
| Contact: needs/documents/budget | Option collections, fieldsets, labels, responsive grouping | Selection state and button feedback |
| Contact: fields/attachments/submission | Field labels, privacy notes, attachment artwork, confirmation copy | Controlled inputs, validation, upload bounds, request/abort state, delivery feedback and modal focus |
| Contact: compact footer | Address, privacy links, socials and icon configuration | Email copy button and live status |
| FAQ: hero/divider | Title, introduction and CGI divider | Hero pin/fade controller |
| FAQ: both question groups | All twenty questions, answers, columns and artwork | Independent accordion state, sizing, dimming and mobile fade |
| Privacy: entire policy | All headings, paragraphs, lists and email link | Scroll animation controller |
| Missing routes | 404 heading and home link | Shared shell interactions only |
| Robots, sitemap, icon, contact API | Server-generated resources and API validation/delivery | None |

Landing, About, Privacy, project details and the slider composition were already
server components. The remaining broad boundaries were split in Header/Menu,
Projects, Contact, FAQ, service navigation, intro branding and tour artwork.
Full project records, contact option lists, FAQ copy, service metadata and social
configuration no longer enter the client module graph.

The shared footer is now composed only by Home, Services, Projects, About, FAQ
and Privacy. Contact, project details and missing pages do not receive hidden
footer content or its client references. The header also observes footer removal
so navigation away from an active footer restores the estimate control.

## Production measurements

Both versions were built with the same installed dependencies. The baseline was
built separately under `/tmp/artefact-ssr-baseline`; the current build used this
repository. These are gzip byte totals for the unique JavaScript files referenced
by the initial HTML, and for the complete HTML response including its RSC data.
The after column includes the animation and component isolation correction.
They exclude media, CSS, later lazy imports and subsequent navigations. They are
payload measurements, not a Lighthouse score or a measured interaction-speed gain.

| Route | Initial JS before / after | HTML + RSC before / after |
| --- | ---: | ---: |
| `/` | 205,832 / 200,215 B | 19,099 / 24,366 B |
| `/services` | 194,525 / 192,898 B | 9,089 / 9,988 B |
| `/projects` | 197,743 / 194,395 B | 6,418 / 13,026 B |
| `/projects/pr15-1` | 192,388 / 190,817 B | 5,147 / 5,101 B |
| `/about` | 192,589 / 191,846 B | 7,036 / 7,719 B |
| `/contact` | 197,800 / 195,274 B | 6,920 / 8,390 B |
| `/contact?mode=contact` | 197,800 / 195,274 B | 5,841 / 7,423 B |
| `/faq` | 193,288 / 192,133 B | 9,918 / 12,400 B |
| `/privacyandpolicy` | 192,140 / 191,131 B | 11,561 / 13,554 B |

Initial JavaScript falls on every reviewed route. Server slots increase the
HTML/RSC representation. The catalog retains all 99 records' server-produced
card content in that payload so its eight filters remain immediate; only the
sixteen default cards appear in the initial HTML. This is an explicit tradeoff,
not a claim that every route transfers fewer total bytes. A server-fetched
category would reduce that initial payload but add a network wait to filtering.

All public page routes remain statically generated, including the 89 detail
routes, except Contact, which is rendered on demand to read its initial mode.
Heavy scenes, frame playback, tours and optional motion controllers use lazy
client loading. Essential interaction state and cursor tracking remain immediate.
Server ownership and animation loading are separate checks; neither removes
the remaining runtime costs.

## Verification

- `npm run lint` and TypeScript checking pass.
- `npm run build` succeeds and preserves static generation.
- Header: six real-hook checks, including active-footer removal and listener cleanup.
- Cursor: four motion checks pass.
- Contact API: seven validation/delivery groups pass with mocked providers.
- `npm run test:ssr`: five import/ownership checks protect routes, sections,
  content collections, actual dynamic motion boundaries and colocated child hooks.
  Four additional tests cover visibility loading, cancellation, cleanup and the
  fallback when IntersectionObserver is unavailable.
- `npm run audit:production -- http://127.0.0.1:3111`: 101 URLs, 23 internal
  destinations, 301 assets, no failures. The audit checks actual HTML after
  excluding scripts, including seven landing sections, all twenty FAQ answer
  regions, all five services, default catalog cards and both contact modes.
- Temporary Playwright checks against the production build pass: all eight
  category counts/order/query links, eager loading after filtering, native video
  activation, both independent FAQ groups and measured answer sizes, menu Escape
  and navigation, contact tab keyboard controls/state preservation, validation,
  attachment add/remove, mocked failure/success, modal dismissal, mobile hashes
  and controls, reload intro markup, and no hydration errors across every page.
- Additional client-navigation check verifies active footer removal, estimate
  restoration and footer remounting on a subsequent route.

Vawzen was paused with no assigned window. Interactive checks used an isolated
headless Chromium test browser; no live delivery was sent. Temporary scripts,
results and screenshots are under `/tmp/artefact-ssr-browser`.

Follow-up: the user enabled Vawzen, and the same production build was checked
in their assigned Firefox/Zen tab at `http://localhost:3000`. All eight filters
returned their expected counts and hashes; filtered first images stayed eager.
Both FAQ groups retained independent expansion and measured heights. Contact
choices, required-field validation/focus, field editing, and tab switching
preserved state. Menu Escape released its scroll lock, and menu links completed
client navigation without replaying the intro. Navigating from an active Services
footer to Contact removed the shared footer and restored the desktop estimate.

The responsive layout was also checked at the actual constrained Firefox
viewport of 578 × 920/921: mobile category ordering and Rendering label, direct
Interior hash, rendering filter count, brief/contact controls, FAQ expansion,
and no horizontal overflow passed. A real About reload showed the intro at
400 ms and removed it after its timeline. The original 2841 × 1554 viewport
and About URL were restored. No live contact request was sent. Vawzen console
capture was disabled, so this follow-up does not claim a Firefox console audit;
the earlier automated hydration/error checks remain the recorded error evidence.
A Vawzen mobile contact screenshot is saved under `/tmp/artefact-ssr-browser`.

For future sections, keep content modules and JSX composition on the server.
Pass their output into client wrappers, and pass only the minimal data needed
for browser behavior. Use the import-graph check to catch transitive client
imports: checking a file's directive alone is insufficient.

Animation correction verification: the production build and 101-URL audit pass.
The existing desktop/mobile browser suite passes after component isolation.
Additional cold-context checks confirm that footer button motion stays unrequested
while off screen, loads near the viewport, and preserves navigation. Slider
ripples and service hover motion run after loading; reduced motion cancels the
service animation. Vawzen confirms filter ripples, magnetic menu links, gradient
rotation, close/reset cleanup, service CTA motion and Interior hash navigation.
No live delivery was sent. These motion checks had no browser runtime errors in
the isolated automated browser; Vawzen console capture remains disabled.
