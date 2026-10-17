import type { Locale } from "./routing";

/**
 * The tag to hand `Intl` for a page language. Arabic keeps Western digits
 * (0-9), the convention in Tunisia and the Maghreb, so figures read the same
 * in every language; `ar` alone may select Arabic-Indic digits in some
 * runtimes.
 */
export function intlLocale(locale: Locale): string {
  return locale === "ar" ? "ar-u-nu-latn" : locale;
}
