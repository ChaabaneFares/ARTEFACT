/**
 * The one table that decides which language a URL serves.
 *
 * English keeps the bare URLs; every other language lives under its own
 * prefix with translated route segments. A URL always maps to exactly one
 * language, so a CDN can cache it without varying on headers. The rewrites,
 * detection redirects, sitemap, hreflang alternates and the header switcher
 * are all derived from this module, so a route can never be translated in one
 * place and forgotten in another.
 *
 * Deliberately dependency-free: `next.config.ts` and the Node tests import it
 * directly, and the language switcher ships it to the browser.
 */

export const LOCALES = ["en", "fr", "es", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Set only by an explicit choice in the switcher; it outranks the browser. */
export const LOCALE_COOKIE = "locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

export function localeDirection(locale: Locale): "ltr" | "rtl" {
  return locale === "ar" ? "rtl" : "ltr";
}

/** Each language in its own name and script, the same in every interface. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  es: "Español",
  ar: "العربية",
};

export const LOCALE_CODES: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
  es: "ES",
  ar: "AR",
};

/**
 * Public segment for each route folder under `src/app/[locale]`. The keys are
 * the folder names, which are also the English segments.
 */
export const ROUTE_SEGMENTS = {
  services: { en: "services", fr: "services", es: "servicios", ar: "خدمات" },
  projects: { en: "projects", fr: "projets", es: "proyectos", ar: "مشاريع" },
  about: { en: "about", fr: "a-propos", es: "sobre-nosotros", ar: "من-نحن" },
  contact: {
    en: "contact",
    fr: "contact",
    es: "contacto",
    ar: "تواصل-معنا",
  },
  faq: {
    en: "faq",
    fr: "faq",
    es: "preguntas-frecuentes",
    ar: "الأسئلة-الشائعة",
  },
  privacyandpolicy: {
    en: "privacyandpolicy",
    fr: "confidentialite",
    es: "privacidad",
    ar: "سياسة-الخصوصية",
  },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof ROUTE_SEGMENTS;

const ROUTE_KEYS = Object.keys(ROUTE_SEGMENTS) as RouteKey[];

function isRouteKey(value: string): value is RouteKey {
  return (ROUTE_KEYS as string[]).includes(value);
}

function localePrefix(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "" : `/${locale}`;
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function splitSuffix(path: string): [pathname: string, suffix: string] {
  const index = path.search(/[?#]/);
  return index < 0 ? [path, ""] : [path.slice(0, index), path.slice(index)];
}

/**
 * Maps an English, unprefixed path (`/projects/pr15-1?x#y`) to the public URL
 * for `locale` (`/fr/projets/pr15-1?x#y`). Segments come back percent-encoded,
 * which is what `location.pathname` and `usePathname()` compare against.
 */
export function localizePath(path: string, locale: Locale): string {
  const [pathname, suffix] = splitSuffix(path);
  const segments = pathname.split("/").filter(Boolean).map(decodeSegment);
  const [first, ...rest] = segments;
  const translated =
    first && isRouteKey(first)
      ? [ROUTE_SEGMENTS[first][locale], ...rest]
      : segments;
  const body = translated
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const prefix = localePrefix(locale);
  if (!body) return `${prefix || "/"}${suffix}`;
  return `${prefix}/${body}${suffix}`;
}

/**
 * The inverse of `localizePath`: which language a public pathname serves and
 * the English path it corresponds to. Accepts encoded or decoded segments.
 *
 * It also accepts the internal forms the rewrites produce (`/en/about`,
 * `/fr/about`): `usePathname()` returns those while a page is prerendered and
 * the public form in the browser, so both must resolve to the same route.
 */
export function parseLocalizedPath(pathname: string): {
  locale: Locale;
  path: string;
} {
  const segments = pathname.split("/").filter(Boolean).map(decodeSegment);
  const prefixed = isLocale(segments[0]);
  const locale = prefixed ? (segments[0] as Locale) : DEFAULT_LOCALE;
  if (prefixed) segments.shift();
  const [first, ...rest] = segments;
  const key = first
    ? ROUTE_KEYS.find(
        (candidate) =>
          ROUTE_SEGMENTS[candidate][locale] === first || candidate === first,
      )
    : undefined;
  const english = key ? [key, ...rest] : segments;
  return {
    locale,
    path: `/${english.map((segment) => encodeURIComponent(segment)).join("/")}`,
  };
}

/**
 * Whether two pathnames are the same page, regardless of percent-encoding or
 * of being the public or the internal (rewritten) form of the URL.
 */
export function isSamePath(a: string, b: string): boolean {
  const left = parseLocalizedPath(a);
  const right = parseLocalizedPath(b);
  return left.locale === right.locale && left.path === right.path;
}

/** Every language's public URL for one English path. */
export function alternatePaths(path: string): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, localizePath(path, locale)]),
  ) as Record<Locale, string>;
}

type RouteCondition = {
  type: "header" | "cookie";
  key: string;
  value?: string;
};
type RewriteRule = { source: string; destination: string };
type RedirectRule = RewriteRule & {
  permanent: boolean;
  has?: RouteCondition[];
  missing?: RouteCondition[];
};

const NON_DEFAULT_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
);

function publicRoot(key: RouteKey, locale: Locale): string {
  return `${localePrefix(locale)}/${encodeURIComponent(ROUTE_SEGMENTS[key][locale])}`;
}

/**
 * Public URLs onto the `[locale]` folders. English gets its prefix added;
 * translated segments get mapped back to their folder.
 */
export function buildLocaleRewrites(): RewriteRule[] {
  const rules: RewriteRule[] = [
    { source: "/", destination: `/${DEFAULT_LOCALE}` },
  ];
  for (const locale of LOCALES) {
    for (const key of ROUTE_KEYS) {
      const source = publicRoot(key, locale);
      const destination = `/${locale}/${key}`;
      if (source === destination) continue;
      rules.push({ source, destination });
      rules.push({
        source: `${source}/:rest*`,
        destination: `${destination}/:rest*`,
      });
    }
  }
  return rules;
}

/**
 * Header values are regular expressions. Next anchors them itself; the
 * explicit anchors keep the match whole wherever a router does not.
 */
function primaryLanguagePattern(locale: Locale): string {
  const letters = [...locale]
    .map((letter) => `[${letter}${letter.toUpperCase()}]`)
    .join("");
  return `^${letters}(?:[-_;,].*)?$`;
}

/**
 * Redirects, in the order they must run:
 *
 * 1. `/en/...` is the internal form of an English URL, never a public one.
 * 2. An English segment under another language goes to its translation.
 * 3. Detection, for bare English URLs only. A `locale` cookie (an explicit
 *    choice) wins; without one, the browser's first language decides.
 *    Prefixed URLs are never redirected, so a shared link opens as sent.
 */
export function buildLocaleRedirects(): RedirectRule[] {
  const rules: RedirectRule[] = [
    { source: `/${DEFAULT_LOCALE}`, destination: "/", permanent: true },
    {
      source: `/${DEFAULT_LOCALE}/:rest*`,
      destination: "/:rest*",
      permanent: true,
    },
  ];
  for (const locale of NON_DEFAULT_LOCALES) {
    for (const key of ROUTE_KEYS) {
      if (ROUTE_SEGMENTS[key][locale] === key) continue;
      const destination = publicRoot(key, locale);
      rules.push({ source: `/${locale}/${key}`, destination, permanent: true });
      rules.push({
        source: `/${locale}/${key}/:rest*`,
        destination: `${destination}/:rest*`,
        permanent: true,
      });
    }
  }
  const detected: [source: string, target: (locale: Locale) => string][] = [
    ["/", (locale) => localePrefix(locale)],
    ...ROUTE_KEYS.flatMap((key): [string, (locale: Locale) => string][] => [
      [`/${key}`, (locale) => publicRoot(key, locale)],
      [`/${key}/:rest*`, (locale) => `${publicRoot(key, locale)}/:rest*`],
    ]),
  ];
  for (const [source, target] of detected) {
    for (const locale of NON_DEFAULT_LOCALES) {
      rules.push({
        source,
        destination: target(locale),
        permanent: false,
        has: [{ type: "cookie", key: LOCALE_COOKIE, value: `^${locale}$` }],
      });
    }
    for (const locale of NON_DEFAULT_LOCALES) {
      rules.push({
        source,
        destination: target(locale),
        permanent: false,
        missing: [{ type: "cookie", key: LOCALE_COOKIE }],
        has: [
          {
            type: "header",
            key: "accept-language",
            value: primaryLanguagePattern(locale),
          },
        ],
      });
    }
  }
  return rules;
}
