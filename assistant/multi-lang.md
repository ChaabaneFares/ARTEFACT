# Multi-language + RTL playbook (EN/FR/AR)

Use this file as the instructions for any new page/component. The goal is: full i18n coverage + correct RTL layout for Arabic with no flicker and no missing keys.

## Project context (fixed)
- Stack: Vite (rolldown-vite) + React + TypeScript, CSR only.
- Routing: React Router v7 (createBrowserRouter).
- Styling: CSS Modules + global main.css.
- i18n: i18next + react-i18next only.
- Namespaces: common (default) and routes (route labels only).
- Locales: src/i18n/locales/{en,fr,ar}/{common,routes}.json
- Supported languages: ["en","fr","ar"], fallback "en".
- Language storage: localStorage key "lng".
- Resolution order: localStorage -> navigator.language -> "en".
- RTL: setHtmlLangDir() sets documentElement.lang + dir; Arabic uses dir="rtl".
- Lazy load: import.meta.glob in src/i18n/index.ts loads only active language + namespace.
- Init: initI18n() is awaited before first render (no flicker).
- React Aria: wrap app in I18nProvider to localize date/time inputs.

## Inputs required from user
- Page/component name and file paths.
- What changed in UI (new strings, new UI states, new menus, new popovers).
- Any special layout behavior (dropdowns, overlays, transforms, mobile breakpoints).

## Work plan (do every time)
1) Replace all user-facing strings with t(...) keys.
2) Update locale JSON for EN/FR/AR with those keys.
3) Fix RTL layout using logical CSS properties and RTL overrides.
4) Verify direction, overlay positioning, and mobile behavior.
5) Make as mush git commits as possible using assistant/commiter.md format.

## Translation checklist
- Replace ALL user-facing text:
  - labels, placeholders, headings, buttons
  - empty/error/loading states
  - aria-labels, title attributes, tooltips
  - modal title/description, menu items
- Do not call useTranslation in non-component files.
  - Pass t() or precomputed strings into hooks/utilities instead.
- Format numbers/dates with locale:
  - count.toLocaleString(i18n.language || undefined)
  - date.toLocaleDateString(i18n.language || undefined, opts)
- Keep French strings ASCII-only (no accents) to match existing style.
- Arabic strings should be real Arabic text in ar/common.json.

## Key naming
- Group keys by page/component prefix:
  - compose.*, header.*, sidebar.*, forms.*, etc.
- Use routes.json only for route labels.
  - Route config stores handle: { i18nKey: "routes.something" }.
  - Breadcrumbs read i18nKey and fallback to humanized segments.

## RTL CSS checklist
- Replace direction-specific props with logical props:
  - left/right -> inset-inline-start/end
  - margin-left/right -> margin-inline-start/end
  - padding-left/right -> padding-inline-start/end
  - border-left/right -> border-inline-start/end
  - text-align left/right -> text-align start/end
- Mirror directional transforms in RTL:
  - translateX(-100%) -> [dir="rtl"] translateX(100%)
  - slideInLeft/Right animations swap in RTL
- Flip directional icons in RTL:
  - [dir="rtl"] .chevron { transform: scaleX(-1); }
- Popovers/dropdowns must align in RTL:
  - use logical inset, or add [dir="rtl"] overrides
- Mobile overlays: ensure open-state transform is mirrored in RTL.

## Bidi content (user/external text)
- Any user-generated or external text that could be in a different language than the UI must use auto direction.
- Use `dir="auto"` on the element that renders the text (inputs, textareas, contentEditable, question titles, doc names, AI messages).
- For inline fragments inside a larger sentence, prefer `<bdi dir="auto">...</bdi>` to isolate punctuation.
- Keep overall Arabic layout unchanged; only apply auto direction to the dynamic text node itself.

## Known pitfalls from Compose (copy these checks)
- Tablet AI panel (<=1024px): open-state transform MUST be mirrored in RTL.
  - Example pattern: `[dir="rtl"] .layoutAiOpen .aiColumn { transform: translate(0,-50%); }`
  - Without this, overlay shows but panel stays offscreen in Arabic.
- Slide animations that depend on direction (supporting docs forward/back):
  - Swap slideInLeft/slideInRight for RTL to preserve expected motion.
- Directional micro-elements:
  - Arrows/chevrons in lists or toggles must be flipped in RTL.
  - Date-field reveal transforms should be mirrored in RTL (translateX).
- Absolute positioned badges/buttons:
  - Use logical inset for clear buttons, dropdown anchors, chip measures.
- Text alignment:
  - Replace text-align left/right with start/end in list rows, menus, buttons.

## i18n files to update
- src/i18n/locales/en/common.json
- src/i18n/locales/fr/common.json (ASCII-only)
- src/i18n/locales/ar/common.json (Arabic UTF-8)
- src/i18n/locales/*/routes.json (only for route labels)

## Verification checklist
- Switch EN -> FR -> AR and confirm:
  - no raw keys displayed
  - numbers/dates localized
  - layout does not break in RTL
  - dropdowns/overlays align in RTL
  - mobile overlays actually open in RTL
  - aria labels read correctly
- Specific to Arabic:
  - tablet (<=1024px) AI panel opens and animates in RTL
  - mobile (<=600px) overlays and drawers are visible and aligned
  - directional icons and slide animations feel correct

## When to add a new namespace (rare)
- Default: keep everything in common.
- Only add a new namespace if the page is large AND reused across bundles.
- If you add one:
  - update src/i18n/namespaces.ts
  - ensure initI18n loads it lazily

## Commit rules (only if asked)
- Follow assistant/commiter.md:
  - format: component(type): subject
  - subject in imperative, no period
  - add 3-6 bullet points for real changes
  - many small commits are preferred

## Minimal request template (user -> AI)
Page/Component: [name + paths]
What changed: [new UI, new strings, new layout]
Notes: [dropdowns, popovers, mobile overlays, icons]
