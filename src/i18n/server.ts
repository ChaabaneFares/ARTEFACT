import { notFound } from "next/navigation";
import { isLocale, type Locale } from "./routing";

/** Route props for every segment under `src/app/[locale]`. */
export type LocaleParams = { params: Promise<{ locale: string }> };

/**
 * The `[locale]` layout only generates known languages, so an unknown value
 * cannot reach a page in production. The guard keeps `Locale` honest in types
 * and turns a malformed request into the 404 it should be.
 */
export async function resolveLocale(
  params: LocaleParams["params"],
): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}
