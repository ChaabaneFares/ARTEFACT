import { intlLocale } from "@/i18n/format";
import type { Locale } from "@/i18n/routing";
import ar from "./privacy/ar";
import en from "./privacy/en";
import es from "./privacy/es";
import fr from "./privacy/fr";

export type PrivacyBlock = {
  id: string;
  tag: "h2" | "h3" | "p" | "ul";
  text?: string;
  items?: readonly { tag: "li" | "p"; text: string }[];
};

const copy: Record<Locale, typeof en> = { en, fr, es, ar };
const structure = [
  {
    id: "policy-1",
    tag: "p",
    key: "policy-1",
  },
  {
    id: "policy-2",
    tag: "p",
    key: "policy-2",
  },
  {
    id: "policy-3",
    tag: "p",
    key: "policy-3",
  },
  {
    id: "policy-4",
    tag: "h2",
    key: "policy-4",
  },
  {
    id: "policy-5",
    tag: "p",
    key: "policy-5",
  },
  {
    id: "policy-6",
    tag: "h2",
    key: "policy-6",
  },
  {
    id: "policy-7",
    tag: "p",
    key: "policy-7",
  },
  {
    id: "policy-8",
    tag: "ul",
    items: [
      {
        tag: "li",
        key: "policy-8-0",
      },
      {
        tag: "li",
        key: "policy-8-1",
      },
      {
        tag: "li",
        key: "policy-8-2",
      },
      {
        tag: "li",
        key: "policy-8-3",
      },
      {
        tag: "li",
        key: "policy-8-4",
      },
      {
        tag: "li",
        key: "policy-8-5",
      },
      {
        tag: "li",
        key: "policy-8-6",
      },
      {
        tag: "li",
        key: "policy-8-7",
      },
      {
        tag: "li",
        key: "policy-8-8",
      },
    ],
  },
  {
    id: "policy-9",
    tag: "h2",
    key: "policy-9",
  },
  {
    id: "policy-10",
    tag: "h3",
    key: "policy-10",
  },
  {
    id: "policy-11",
    tag: "p",
    key: "policy-11",
  },
  {
    id: "policy-12",
    tag: "ul",
    items: [
      {
        tag: "li",
        key: "policy-12-0",
      },
      {
        tag: "li",
        key: "policy-12-1",
      },
      {
        tag: "li",
        key: "policy-12-2",
      },
    ],
  },
  {
    id: "policy-13",
    tag: "h3",
    key: "policy-13",
  },
  {
    id: "policy-14",
    tag: "p",
    key: "policy-14",
  },
  {
    id: "policy-15",
    tag: "p",
    key: "policy-15",
  },
  {
    id: "policy-16",
    tag: "p",
    key: "policy-16",
  },
  {
    id: "policy-17",
    tag: "h3",
    key: "policy-17",
  },
  {
    id: "policy-tracking-practices",
    tag: "p",
    key: "policy-tracking-practices",
  },
  {
    id: "policy-cookie-choices",
    tag: "p",
    key: "policy-cookie-choices",
  },
  {
    id: "policy-23",
    tag: "h2",
    key: "policy-23",
  },
  {
    id: "policy-24",
    tag: "p",
    key: "policy-24",
  },
  {
    id: "policy-25",
    tag: "ul",
    items: [
      {
        tag: "li",
        key: "policy-25-0",
      },
      {
        tag: "li",
        key: "policy-25-1",
      },
      {
        tag: "li",
        key: "policy-25-2",
      },
      {
        tag: "li",
        key: "policy-25-3",
      },
      {
        tag: "li",
        key: "policy-25-4",
      },
    ],
  },
  {
    id: "policy-26",
    tag: "p",
    key: "policy-26",
  },
  {
    id: "policy-sharing",
    tag: "ul",
    items: [
      {
        tag: "li",
        key: "policy-sharing-0",
      },
      {
        tag: "li",
        key: "policy-sharing-1",
      },
      {
        tag: "li",
        key: "policy-sharing-2",
      },
    ],
  },
  {
    id: "policy-28",
    tag: "h2",
    key: "policy-28",
  },
  {
    id: "policy-29",
    tag: "p",
    key: "policy-29",
  },
  {
    id: "policy-30",
    tag: "p",
    key: "policy-30",
  },
  {
    id: "policy-31",
    tag: "h2",
    key: "policy-31",
  },
  {
    id: "policy-32",
    tag: "p",
    key: "policy-32",
  },
  {
    id: "policy-33",
    tag: "p",
    key: "policy-33",
  },
  {
    id: "policy-34",
    tag: "p",
    key: "policy-34",
  },
  {
    id: "policy-35",
    tag: "h2",
    key: "policy-35",
  },
  {
    id: "policy-36",
    tag: "h3",
    key: "policy-36",
  },
  {
    id: "policy-37",
    tag: "p",
    key: "policy-37",
  },
  {
    id: "policy-38",
    tag: "h3",
    key: "policy-38",
  },
  {
    id: "policy-39",
    tag: "p",
    key: "policy-39",
  },
  {
    id: "policy-40",
    tag: "h3",
    key: "policy-40",
  },
  {
    id: "policy-41",
    tag: "p",
    key: "policy-41",
  },
  {
    id: "policy-42",
    tag: "ul",
    items: [
      {
        tag: "li",
        key: "policy-42-0",
      },
      {
        tag: "li",
        key: "policy-42-1",
      },
      {
        tag: "li",
        key: "policy-42-2",
      },
      {
        tag: "li",
        key: "policy-42-3",
      },
      {
        tag: "li",
        key: "policy-42-4",
      },
    ],
  },
  {
    id: "policy-43",
    tag: "h2",
    key: "policy-43",
  },
  {
    id: "policy-44",
    tag: "p",
    key: "policy-44",
  },
  {
    id: "policy-45",
    tag: "h2",
    key: "policy-45",
  },
  {
    id: "policy-46",
    tag: "p",
    key: "policy-46",
  },
  {
    id: "policy-47",
    tag: "p",
    key: "policy-47",
  },
  {
    id: "policy-48",
    tag: "h2",
    key: "policy-48",
  },
  {
    id: "policy-49",
    tag: "p",
    key: "policy-49",
  },
  {
    id: "policy-50",
    tag: "p",
    key: "policy-50",
  },
  {
    id: "policy-51",
    tag: "h2",
    key: "policy-51",
  },
  {
    id: "policy-52",
    tag: "p",
    key: "policy-52",
  },
  {
    id: "policy-53",
    tag: "p",
    key: "policy-53",
  },
  {
    id: "policy-54",
    tag: "p",
    key: "policy-54",
  },
  {
    id: "policy-55",
    tag: "h2",
    key: "policy-55",
  },
  {
    id: "policy-56",
    tag: "p",
    key: "policy-56",
  },
] as const;

export function getPrivacy(locale: Locale) {
  const text = copy[locale];
  const tag = intlLocale(locale);
  const date = new Intl.DateTimeFormat(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date("2026-10-11T00:00:00Z"));
  const age = new Intl.NumberFormat(tag).format(13);
  const percent = new Intl.NumberFormat(tag, { style: "percent" }).format(1);
  const format = (key: keyof typeof en) =>
    text[key]
      .replaceAll("{date}", date)
      .replaceAll("{age}", age)
      .replaceAll("{percent}", percent);
  const blocks: readonly PrivacyBlock[] = structure.map((block) =>
    "items" in block
      ? {
          id: block.id,
          tag: block.tag,
          items: block.items.map((item) => ({
            tag: item.tag,
            text: format(item.key),
          })),
        }
      : { id: block.id, tag: block.tag, text: format(block.key) },
  );
  return { title: text.title, blocks };
}
