# Privacy route architecture

`/privacyandpolicy` preserves the source footer destination and information-page
layout. Its server route renders all headings, paragraphs, lists and the studio
email link from `_data/privacy.ts`. A small private client loader imports only
the optional scroll controller. Follow the
[page cloning manual](page-cloning-manual.doc.md) for architecture and testing.

The controller uses the existing scroll manager and cached smart style writes.
It caches untransformed positions on initialization, content resize and viewport
resize. Visible desktop title/section headings use the source speed 0.4;
lists and the sharing paragraph use -0.3. Scroll frames perform arithmetic and
write transforms without layout reads. Phone and reduced-motion views remain
static. Route exit disconnects the observer/listeners, unregisters its own
instance and removes transforms.

Source geometry is retained in single-line CSS modules: a centered 50% content
column, 82% on phones, source paragraph/heading spacings and a local source font
unit for the large top/bottom margins. This measured visual exception follows
the existing menu/services pattern instead of changing the global root font.
At 1364 × 781 the title's initial parallax displacement is 6.3075px.

## Content adaptations

The policy is deliberately not a verbatim legal clone. Company identity,
website and contact email refer to Artefact Studio. The update date is October
11, 2026. Competitor Kyiv address/country and registered-account definition are
removed. Claims about Flash cookies, advertising trackers, account management,
marketing newsletters and behavioral marketing analysis are removed or replaced
by descriptions of hosting information, browser cookie controls and third-party
content. The contact paragraph describes actual form fields and attachments;
sharing describes the configured delivery provider and optional email draft.
Unsupported SMS and mobile push contact claims are replaced with email replies.
The duplicate source "Transfer" heading is corrected to "Retention". This
changes document height and some wrapping while preserving layout and motion.

The page does not claim a specific unprovided legal entity/address or configured
analytics integration. Remaining general retention, transfer, security and
disclosure language requires the studio's legal/content review before launch.
This document records the copy changes and makes no claim of legal compliance.

Vaelix compared desktop and phone geometry with the reference. At 412 × 915
the title starts at 329.546875px and is 59.140625px tall; the update paragraph
starts at 460.6875px and the first policy paragraph at 513.03125px, matching the
source. Desktop title top is 510.994995px. Scroll review verified section
parallax, the shared footer, studio mail link, absent competitor destinations,
no failed local assets, no horizontal overflow and a clean browser console.
