# Shared contact footer

Follow [the page cloning manual](page-cloning-manual.doc.md) when changing this shared component. Each page that displays the shared footer composes it on the server after its main content. Contact, selected project views, and missing pages never compose or serialize this footer. Its lazy animation controller retains the landing page loading and scroll architecture and cleans up when the route changes.

## Ownership

- `src/components/layout/footer/footer.tsx` renders the server-safe shell, links, contact identity, image assets and animation data attributes.
- `footer.module.css` owns responsive typography, layout, the gradient and the magnetic buttons' padded hit areas. Its selectors remain single line, with a formatter exclusion in `biome.json`.
- `footerAnimateLoader` schedules the separate animation island. `footer.animate.logic.ts` caches the root, targets and geometry, subscribes to the shared scroll manager, batches style changes and cleans up its listeners, observers, animation frames and inline styles on route changes.
- `footerButton.logic.ts` owns pointer-driven button movement. Shared cursor effects own the copy label and link hover feedback.

Artefact Studio's configured email remains `contact@artefactstudio.org`; studio address and social destinations remain owned by the application. An unconfigured address reserves the metadata row with an aria-hidden nonbreaking space, and unconfigured social destinations use disabled spans with the same icon geometry. Reference business details are not published as Artefact's contact information. The longer email changes its text width without changing the footer's container or alignment.

## Reference geometry

The developer credit uses the supplied Vawzen stacked white wordmark from
`public/assets/brand/vawzen-wordmark-stacked.svg`, at the existing 20px height.
It links to `https://vawzen.org/` in a new tab with the shared cursor feedback. The
caption and logo wrappers have separate selectors so the image does not inherit
caption typography or margins. The reference measurements below predate this
wordmark; its authored aspect ratio determines its new width.

The AM-ARC source uses a responsive root font size as its layout unit. A private `--footer-unit` reproduces that scale without modifying the document root or other routes: `15.2px + 1vw`, `8px + 1.5vw` from 1600px, `4px + 3.6vw` at 450px and below, and `2.48px + 4vw` at 390px and below. These measured source formulas and its fixed pixel details intentionally retain their original units rather than introducing viewport approximations.

Desktop uses a 200vh section, a -105vh preceding overlap, 100vh top padding, 1.64 units of bottom padding and a 594px minimum height. The headline uses 1.12 units, 4.86 units of top padding and 0.1px tracking; at 1220px these become 1.45 and 6.1 units. The button labels use 0.46 units inside 124px buttons, with 0.52-unit vertical padding and a 1.825-unit surrounding pointer area. The contact row is 16.6 units wide and its columns retain 5px side margins.

The developer credit preserves the source's inline paragraph and image baseline, including the paragraph's 0.506-unit top and 0.168-unit left margins and the credit logo's 0.043/0.067/0.32-unit margins. Its source position is 1.4 units above the section bottom. The application's credit lives inside the padded trigger container, so its CSS bottom offset is -0.24 units to compensate for the section's 1.64-unit bottom padding.

At 768px and below the section is 95vh with no overlap or section padding; the 594px minimum remains. The two desktop actions are hidden. The headline, contact details, privacy link, full-width estimate action and social icons are stacked in that order. Headline and contact spacing change at 500px; the source's 450px headline line heights and -5px top margin remain intact. The social order is Upwork, Behance, Telegram, Instagram, WhatsApp on mobile, while desktop retains Behance, Upwork, Instagram, Telegram, WhatsApp.

## Source animation

Read-only Vaelix inspection of the source ScrollTrigger timeline confirmed a one-second time-based reveal. Its opacity easing is quadratic out, `1 - (1 - t)^2`. The content uses `toggleActions: 'play'` without scrub and plays once after entering. The fixed gradient fades in on entering and fades out when leaving backward; an active trigger range is not a scroll-progress opacity range.

For a 1364 × 781 Services viewport the source trigger begins at 4231px and ends at 4684px. Holding scroll at 4234px still advances opacity: timeline progress 0.266 gives 0.4612 opacity, 0.465 gives 0.7138, and 0.665 gives 0.8878. The controller implements the same one-second easing with requestAnimationFrame and uses shared scroll subscriptions only to detect boundary changes. Reduced motion completes these fades immediately and removes the tabs' decorative parallax.

## Independent fidelity review

Reference and local Services pages were compared in separate Vaelix windows and same-sized iframes. At 1364 × 781 the following geometry matches the reference exactly:

| Element | Width | Height | Font size |
| --- | ---: | ---: | ---: |
| Headline including its top padding | 475.515625px | 188.15625px | 32.3008px |
| Each desktop action | 124px | 49.96875px | 13.2664px |
| Contact row | 478.734375px | 46.515625px | inherited 28.84px unit |
| Developer credit | 142.34375px | 45.21875px | 9.02692px text |

At 412 × 915 the complete footer content matches the source's document coordinates and sizes: a 291.40625 × 81.78125px headline, a 412 × 391.484375px contact stack, a 364.125 × 58.125px estimate action and a 26px social row. Screenshot comparison confirms the matching gradient, line breaks, spacing and icon treatment. Native source scrolling and the application's Lenis scroll bounds round fractional document height differently by one pixel at the bottom; the content itself measures 5696.109375px in both pages. Preserve the application's existing scroll runtime instead of adding a compensating layout pixel.

The final configured-contact version also matches source geometry at 768 × 1024
and 375 × 812, including the reserved address row and disabled social icons. The
tablet headline is 289.640625 × 225.5625px and its estimate action is
687.375 × 55px; the narrow mobile headline is 270.5 × 75.9375px and its action is
330.5 × 53.75px. Browser console capture remained free of errors through menu,
navigation, history, resize and reduced-motion route tests.
