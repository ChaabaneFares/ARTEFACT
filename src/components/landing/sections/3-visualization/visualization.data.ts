import { type Locale, localizePath } from "@/i18n/routing";
import { visualizationCopy } from "./visualization.copy";
import items from "./visualization.data.json";

export function getVisualizationItems(locale: Locale) {
  const copy = visualizationCopy[locale].items;
  return (Object.keys(items) as Array<keyof typeof items>).map((id) => ({
    ...items[id],
    ...copy[id],
    tags: copy[id].tags.join(locale === "ar" ? "، " : ", "),
    href: localizePath(items[id].href, locale),
  }));
}
