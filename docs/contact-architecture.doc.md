# Contact route architecture

Follow the [page cloning manual](page-cloning-manual.doc.md),
[progressive loading](progressive-loading.doc.md) and
[services architecture](services-architecture.doc.md) for the shared patterns.

`src/app/[locale]/contact/page.tsx` is a server route with metadata and an initial tab
selected from `?mode=contact`. The private `_data` folder owns the option lists,
field types, studio email and upload limits. `ContactForm` and `ContactInfo`
compose static content on the server. `contact-form.client.tsx` owns a state
provider; each control has its own `components/<control>/` folder and hook.
`contact-form.context.ts` supplies the state contract; `ContactField`, `ContactSuccess`, and `ContactEmail`
keep browser behavior in owned `.logic.ts` hooks. The form provider hook is
`contact-form.client.logic.ts`; tab keyboard handling and submit pointer feedback
live with their controls. Option collections stay
in `contact.ts`; only the required field types, email, and upload limits enter
the client graph through `contact-runtime.ts`. The
persistent layout provides the header, cursor, Lenis and curved route transition;
contact supplies its own compact footer. There is no media readiness gate.

The two source tabs preserve fields, selections and attachments while changing
the visible form. Desktop and mobile intentionally have different needs and
document labels. Shared `SelectionPill` supplies the rolling label, white fill,
pressed state, pointer feedback and keyboard focus. Budgets select one value and
can toggle off; other groups accept several values. Tabs support arrow keys,
Home and End. Required fields expose errors and focus the first invalid input.
The project textarea grows without delaying text paint. Attachments can be
removed individually and are capped at ten files and 3 MB combined.

All static styles are single-line CSS modules. The local reference font unit
and measured fixed spacings are intentionally retained, as on services/menu,
because mechanical vw conversion changes the source geometry. Desktop at
1364 × 781 has form top 342.140625px, width 513.34375px and height 1154.203125px.
At 412 × 915 the form starts at 488.375px with width 371.625px and height
1775.671875px. Needs, fields, attachment box, document options, budgets, privacy
notice and submit area match the source coordinates at that phone size; the
submit starts at 2198.375px and is 65.671875px tall.
The desktop submit is 608.140625, 1446.34375, 147.703125 × 50px and the compact
footer starts at 1698.21875px. At 768 × 1024 the form starts at 614.765625px;
field and attachment geometry, submit top 1617.15625px and compact footer top
1823.65625px match the source.

## Delivery configuration

`src/app/api/contact/route.ts` reads a bounded multipart body, validates the
browser origin against the request Host (which also works behind Next's dev
bind address), validates fields/option allowlists and rejects the hidden
honeypot. It accepts only one of these studio-owned delivery configurations:

- `CONTACT_DELIVERY_URL`: HTTPS webhook; optional `CONTACT_DELIVERY_TOKEN` adds
  bearer authorization. JSON contains `name`, `email`, `message`, `mode`,
  `needs`, `documents`, `budget`, `to`, `subject` and `attachments`. Each
  attachment contains `filename` and Base64 `content`. A 2xx response must mean
  the configured endpoint accepted the request. Implement that contract before
  setting this variable.
- `RESEND_API_KEY` and `CONTACT_FROM_EMAIL`: the latter must be a verified
  sender accepted by Resend. `CONTACT_TO_EMAIL` optionally changes the recipient;
  the default is `contact@artefactstudio.org`. REST payload uses `reply_to`,
  Base64 attachment content and `Idempotency-Key`. Success requires a nonempty
  provider email ID.

The browser keeps one UUID for retries of an unchanged draft and regenerates it
when the draft changes. Provider requests time out after twenty seconds. Busy
controls are disabled. On accepted delivery, the native success dialog traps
focus, supports Escape and returns focus to the submit control. Failure preserves
the draft and files and offers a prefilled studio email link; email attachments
must be added manually. An unconfigured deployment returns 503 and never shows
a success message. No AM-ARC API or copied reCAPTCHA key is used.

Provider contract was checked against official
[Resend send-email documentation](https://resend.com/docs/api-reference/emails/send-email)
and [idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Review and intentional differences

Vaelix checks cover desktop/mobile geometry, both tabs, multiple selections,
budget deselection, required-field focus, valid field editing, attachment add
and remove, state preservation, no horizontal overflow and the real local 503
fallback. `node --test scripts/contact-api.test.cjs` runs seven groups of tests
against the actual route with an injected network mock: validation, uploads,
proxy origins, unconfigured delivery, Resend payload/acceptance/errors and the
webhook contract. A temporary browser fetch mock also verified disabled busy
fields/tabs, accepted-success dialog, dismissal and returned submit focus. This
was an isolated UX check, not delivery verification. No test sends mail to a
real provider or recipient.

The studio identity/email and honest delivery/privacy notice replace competitor
details. `src/config/studio.ts` owns `studioContact`: its optional address comes
from `NEXT_PUBLIC_STUDIO_ADDRESS`; missing address retains a blank reserved row.
Optional HTTPS social destinations use `NEXT_PUBLIC_STUDIO_BEHANCE_URL`,
`NEXT_PUBLIC_STUDIO_UPWORK_URL`, `NEXT_PUBLIC_STUDIO_INSTAGRAM_URL`,
`NEXT_PUBLIC_STUDIO_TELEGRAM_URL` and `NEXT_PUBLIC_STUDIO_WHATSAPP_URL`. Invalid
or missing values retain icons with a "profile not configured" label and no
click target. Public env changes require a rebuild. No link contacts AM-ARC.
Source reCAPTCHA is replaced by a matching-size privacy notice and
server validation. Upload bounds protect the deployment's request limit. The
native dialog adds accessible focus behavior. Delivery credentials are absent
from this checkout, so an actual accepted email has not been verified. Launch
requires configuring a provider and performing a controlled delivery check.
