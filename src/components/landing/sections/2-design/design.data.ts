import { type Locale, localizePath } from "@/i18n/routing";
import { designCopy } from "./design.copy";
import items from "./design.data.json";

export function getDesignItems(locale: Locale) {
  const copy = designCopy[locale].items;
  return (Object.keys(items) as Array<keyof typeof items>).map((id) => ({
    ...items[id],
    ...copy[id],
    tags: copy[id].tags.join(locale === "ar" ? "، " : ", "),
    href: localizePath(items[id].href, locale),
  }));
}
