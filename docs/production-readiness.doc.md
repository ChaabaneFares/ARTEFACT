# Website production review

Reviewed on 2026-10-11 against the live AM-ARC site in Vaelix. The implementation
is committed on `main`. This review verifies the local optimized production
build; it does not claim that these commits have been deployed.

## Completed scope

| Page or feature | Result |
| --- | --- |
| Services | Five services, responsive composition, exact sticky ranges, entry/exit timing, category navigation and shared button interactions |
| Projects | 99 records across eight filters, direct hashes and source ordering |
| Project views | All 89 still-image detail routes, selected-image-first sequences and route-specific detail/footer composition |
| Project media | Eight click-to-play video records and two self-hosted tours with seven working viewpoints |
| About | Complete responsive studio page, portraits, image reveals, philosophy sequence and source scroll timing |
| Contact | Brief/contact tabs, selections, attachments, validation, busy state, accessible success dialog and honest delivery fallback |
| FAQ | All twenty questions, independent accordion groups, CGI divider and source desktop pin/fade behavior |
| Privacy | Source visual structure with truthful studio-specific privacy copy |
| Missing pages | Source geometry and Back to home navigation, including unknown project views |
| Shared shell | Source cursor geometry, footer reveal, responsive footer baselines, menu navigation, curved transitions and focus/scroll cleanup |

The header follows the reference's symbol/wordmark swap above 10px of desktop
scroll, with text links sliding out of view. Phone and tablet layouts retain
the symbol and menu control. The desktop estimate CTA fades out at the shared
footer reveal boundary and returns when scrolling back above it.

The header was rechecked in Vaelix on 2026-10-12: 0/10/11px scroll states, menu
open/Escape close, footer entry/backward exit, About navigation, and resizing
through 390/768/769/1366px. Five real-hook regression tests cover the same state
boundaries and listener/observer cleanup. Header swaps follow the smooth-scroll
destination, so returning to the top starts the reveal immediately rather than
waiting for the viewport interpolation to settle.

The existing homepage remains composed on the server, with a small client boot
leaf. Moving its internal sections out of `src/pages` removes accidental legacy
public routes. Its hero text/poster, fixed-duration marketing introduction,
media scheduler, scene boot gate, parking and virtual-tour phases remain in
place. Old homepage showcase links now target the implemented project filters.

## Review loop and evidence

Independent agents owned About/Services, Projects and Contact/FAQ/Privacy.
Integration then reviewed shared components and repeated affected comparisons
after fixes. Screenshots and DOM measurements used equally sized reference
and local iframes, including 1364px desktop, 768px tablet and 412/375px phones.

Services CTA geometry matches the source at desktop, tablet and phone sizes.
Its magnetic-wrapper motion matches within 0.0001px, using the measured source
300ms quadratic motion. Project and detail geometry match within 0.02px.
About, Contact, FAQ and Footer measurements are recorded in their route docs.
The source and Lenis round fractional scroll bounds differently by one pixel
at the bottom of the mobile footer; matching content geometry is retained.

The review corrected source font-unit formulas, line wrapping, portrait/image
crops, entry delays, effective easing curves, sticky measurements, fixed
interaction targets, ripple shape and text roll. The footer now fades over one
second while scroll is stationary, keeps its revealed content visible after a
backward exit, and reverses only the gradient. Resize observers recompute its
boundary after FAQ content changes; a production check confirmed a 56px
accordion-driven layout shift and the subsequent reveal at the new boundary.

Navigation tests cover ordinary links, filter destinations, project details,
same-route menu behavior, Escape, focus trapping, Back/Forward, resize and
reduced motion. All release menu/transition flags, inert content and scroll
locks. Reduced-motion navigation still focuses the new heading. Fine-pointer
cursor measurements are 10.56px at rest and 81.6px with a label; its animation
loop stops after motion settles. All seven tour nodes load without missing
resources, and videos mount only after Play.

## Production verification

- `npm run lint`: passes across the application.
- `npm run test:contact`: all seven actual-route test groups pass using mocked
  provider requests. Tests cover bounds, validation, proxy origins, delivery
  payloads, idempotency, acceptance and failures; no email is sent.
- `npm run build`: passes compilation, TypeScript and prerendering, including
  all 89 project-detail paths.
- A freshly started `next start` server on port 3100 passes
  `npm run audit:production -- http://localhost:3100`: 100 route variants and
  metadata endpoints, 23 distinct internal destinations and 297 local assets,
  with zero failures. Assets include responsive image candidates and CSS
  font/background URLs. Interaction-loaded tours are checked separately.
- Missing routes return 404 and the usable Back to home view. Unknown project
  slugs now use the page's `notFound()` guard without the former internal
  disabled-fallback error in the server log.
- Production browser navigation through Services, About, Projects, FAQ and
  Contact has no unexpected console errors, exceptions, horizontal overflow
  or retained locks. The intentional missing-route requests log their expected
  404 network responses. Other pages load no homepage Spline/GLB resources.
- A production mobile homepage check finds visible hero text and a decoded
  poster beneath the introduction, one main heading, no horizontal overflow,
  and released scroll/inert state after the fixed intro timeline.
- The unconfigured production contact endpoint returns an honest 503 and
  email-draft fallback. This verifies failure handling, not accepted delivery.

## Studio configuration and intentional differences

Artefact's identity/email are retained. The header uses the supplied white
Artefact symbol at the top and the `ARTE-` / `FACT` SVG wordmark after scrolling
on desktop.
The introduction appears once per document load on every route; ordinary
client-side navigation retains its dismissed state. Privacy
copy and unverified business claims in FAQ are adapted rather than presented
as Artefact facts; some expanded-answer wrapping therefore intentionally
differs. The missing-page link uses readable studio text color while matching
the source's measured position and size. Do not describe these adaptations as
a literal pixel-identical copy.

Address and social links use `src/config/studio.ts`. Unconfigured values retain
their layout slots, with a blank address row and honestly disabled profile
icons. They do not send visitors to AM-ARC. The optional public environment
variables and rebuild requirement are in the contact architecture document.

Online form delivery requires either the HTTPS webhook contract or verified
Resend sender/key documented in [contact architecture](contact-architecture.doc.md).
No delivery credentials are present in this checkout. Configure the provider
and perform a controlled accepted-delivery check before treating online
submission as enabled. The studio email-draft fallback is already available.

The public production URL is `https://artefact-studio.space/`.
The user's deployment branch is `backup/main`; pushing there triggers the
production build. This review leaves publication separate from local readiness.

## Durable implementation references

Use the [page cloning manual](page-cloning-manual.doc.md),
[Services](services-architecture.doc.md), [Projects](projects-architecture.doc.md),
[About](about-architecture.doc.md), [Contact](contact-architecture.doc.md),
[FAQ](faq-architecture.doc.md), [Privacy](privacy-architecture.doc.md),
[Footer](footer-architecture.doc.md) and [progressive loading](progressive-loading.doc.md)
for the measured geometry, component ownership, loading and cleanup patterns.
