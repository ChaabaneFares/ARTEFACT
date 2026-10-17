"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALES,
  type Locale,
  localizePath,
  parseLocalizedPath,
} from "@/i18n/routing";
import { useHeaderState } from "../../header.context";

export function useHeaderLanguage(locale: Locale) {
  const { phase } = useHeaderState();
  const pathname = usePathname() ?? "/";
  const { path } = parseLocalizedPath(pathname);
  const hrefs = Object.fromEntries(
    LOCALES.map((item) => [item, localizePath(path, item)]),
  ) as Record<Locale, string>;

  // An explicit choice outranks the browser language from now on. The full
  // document navigation replays the introduction and boots every scene in the
  // new language, exactly as a reload of that page would.
  const choose = (event: MouseEvent<HTMLAnchorElement>, target: Locale) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    if (target === locale) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is missing from some supported browsers, and the cookie must exist before the navigation request leaves.
    document.cookie = `${LOCALE_COOKIE}=${target}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
    window.location.assign(
      `${hrefs[target]}${window.location.search}${window.location.hash}`,
    );
  };

  // The languages belong to the open menu: hidden and unreachable otherwise.
  return { choose, hrefs, isVisible: phase === "open" };
}
