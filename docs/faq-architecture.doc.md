# FAQ route architecture

Use the [page cloning manual](page-cloning-manual.doc.md) and
[services architecture](services-architecture.doc.md) for shared route patterns.

`src/app/[locale]/faq/page.tsx` renders the title, introduction, all twenty questions and
answers, and mobile CGI divider in the initial HTML. Static content lives in
`_data/faq.ts`. Each question is an accessible button with an associated answer
region; closed regions are inert. `FaqSection` and `FaqItem` compose the content
and decorations on the server. Client wrappers receive that content through
slots and own only accordion state, cursor feedback, and answer measurements.
Each of the two groups owns one active
question across both desktop columns, so opening another item closes the first
without affecting the other group. Item hooks own hover/cursor behavior.

Desktop expands answers over 300ms and dims other questions. Answer heights
are measured outside scroll frames, observed for wrapping changes, and rounded
to the source's integer pixel target. Mobile uses the
source's immediate answer expansion, rounded dark cards and rotating orange
arrow. Entrance movement and opacity are separate 500ms/900ms animations with
the source delay. Reduced motion removes movement and transitions. The mobile
gradient overlay fades after interaction or scrolling.

The null-rendering `FaqEffects` leaf imports the controller after mount.
`scrollManager` batches updates and `createBatchStyleSetter` skips repeated
writes. Hero geometry is cached on initialization, resize and ResizeObserver
changes. Desktop pins the introduction by compensating native scroll and fades
the dark overlay over 40vh with the reference quadratic easing. Phone layout
flows normally. Attribute observation handles overlay dismissal without adding
a second scroll engine or reading layout in a scroll callback. Cleanup removes
the route's registration, observers, media listener and mutated styles.

Single-line CSS modules retain the isolated source font formula and small fixed
interaction spacings needed for the measured reference geometry. At 412 × 915,
the hero is 15.015625, 154.03125, 381.96875 × 275.96875px; the first group starts
at 505.3125px and is 1021.78125px tall. All ten closed card tops and heights,
the 412px CGI divider, and the second group top 1939.09375px match the source.
Desktop uses the existing Poppins typography, source two-column spacing and
the shared footer/route transition.

All twenty source questions and the CGI glossary remain. Unverified competitor
business claims are replaced with neutral studio copy: payment terms, project
capacity, working hours, fixed turnaround/quote deadlines and the claimed
manager/mentor review process are confirmed through a project discussion rather
than asserted. This deliberately changes some expanded-answer wrapping. Closed
question rows and interaction geometry remain unchanged. Shared branding and
destination links use Artefact's configuration.

Vaelix verified both independent accordion groups, all twenty controls, unique
IDs, inert closed regions, dismissal fading, source desktop pin/fade behavior,
and no horizontal overflow. At 768 × 1024 the hero, both section rectangles,
CGI divider and question rows match exactly. At 412 × 915 the first expanded
card is 192.65625px tall, including a 101px answer, matching the source. The
desktop hero remains at the same visual top after a 300px scroll and its dark
overlay opacity is 0.998424, matching the measured quadratic fade range.
