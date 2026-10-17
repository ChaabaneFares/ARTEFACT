import assert from "node:assert/strict";
import test from "node:test";
import {
  alternatePaths,
  buildLocaleRedirects,
  buildLocaleRewrites,
  isSamePath,
  LOCALES,
  localizePath,
  parseLocalizedPath,
  ROUTE_SEGMENTS,
} from "../src/i18n/routing.ts";

const englishPaths = [
  "/",
  ...Object.keys(ROUTE_SEGMENTS).map((key) => `/${key}`),
  "/projects/pr15-1",
];

test("every English path round-trips through every language", () => {
  for (const path of englishPaths) {
    for (const locale of LOCALES) {
      const localized = localizePath(path, locale);
      assert.deepEqual(
        parseLocalizedPath(localized),
        { locale, path },
        localized,
      );
      assert.deepEqual(
        parseLocalizedPath(decodeURIComponent(localized)),
        { locale, path },
        `decoded ${localized}`,
      );
    }
  }
});

test("English stays unprefixed and other languages get their segment", () => {
  assert.equal(localizePath("/", "en"), "/");
  assert.equal(localizePath("/", "fr"), "/fr");
  assert.equal(localizePath("/about", "en"), "/about");
  assert.equal(localizePath("/about", "fr"), "/fr/a-propos");
  assert.equal(localizePath("/projects/pr15-1", "es"), "/es/proyectos/pr15-1");
  assert.equal(
    decodeURIComponent(localizePath("/projects/pr15-1", "ar")),
    "/ar/مشاريع/pr15-1",
  );
});

test("query strings and hashes survive localization", () => {
  assert.equal(
    localizePath("/contact?mode=contact", "es"),
    "/es/contacto?mode=contact",
  );
  assert.equal(
    localizePath("/projects#interior", "fr"),
    "/fr/projets#interior",
  );
});

test("translated segments are unique within each language", () => {
  for (const locale of LOCALES) {
    const segments = Object.values(ROUTE_SEGMENTS).map(
      (entry) => entry[locale],
    );
    assert.equal(new Set(segments).size, segments.length, locale);
    assert.ok(
      segments.every((segment) => !LOCALES.includes(segment)),
      `${locale} segment collides with a language prefix`,
    );
  }
});

test("alternates list one URL per language", () => {
  assert.deepEqual(Object.keys(alternatePaths("/faq")), [...LOCALES]);
});

test("rewrites map every public URL onto its locale folder", () => {
  const rewrites = buildLocaleRewrites();
  assert.ok(
    rewrites.some((rule) => rule.source === "/" && rule.destination === "/en"),
  );
  for (const locale of LOCALES) {
    for (const [key, segments] of Object.entries(ROUTE_SEGMENTS)) {
      const source = localizePath(`/${key}`, locale);
      if (source === `/${locale}/${key}`) continue;
      assert.ok(
        rewrites.some(
          (rule) =>
            rule.source === source && rule.destination === `/${locale}/${key}`,
        ),
        `${source} (${segments[locale]})`,
      );
    }
  }
});

test("detection only redirects bare English URLs, cookie before header", () => {
  const redirects = buildLocaleRedirects();
  const detection = redirects.filter((rule) => rule.has || rule.missing);
  assert.ok(detection.length > 0);
  for (const rule of detection) {
    assert.equal(rule.permanent, false);
    assert.ok(
      !LOCALES.some((locale) => rule.source.startsWith(`/${locale}`)),
      rule.source,
    );
  }
  const home = detection.filter((rule) => rule.source === "/");
  const firstHeader = home.findIndex(
    (rule) => rule.has?.[0]?.type === "header",
  );
  const lastCookie = home.findLastIndex(
    (rule) => rule.has?.[0]?.type === "cookie",
  );
  assert.ok(
    lastCookie < firstHeader,
    "cookie rules must run before header rules",
  );
});

test("the Accept-Language patterns match only the primary language", () => {
  const redirects = buildLocaleRedirects().filter(
    (rule) => rule.source === "/" && rule.has?.[0]?.type === "header",
  );
  const match = (header) =>
    redirects.find((rule) => new RegExp(rule.has[0].value).test(header))
      ?.destination;
  assert.equal(match("fr-FR,fr;q=0.9,en;q=0.8"), "/fr");
  assert.equal(match("ES-419,es;q=0.9"), "/es");
  assert.equal(match("ar"), "/ar");
  assert.equal(match("en-US,fr;q=0.9"), undefined);
  assert.equal(match("de-DE"), undefined);
});

test("prerender pathnames resolve to the same route as public ones", () => {
  // usePathname() returns the rewritten form while a page is prerendered.
  assert.deepEqual(parseLocalizedPath("/en/about"), {
    locale: "en",
    path: "/about",
  });
  assert.deepEqual(parseLocalizedPath("/en"), { locale: "en", path: "/" });
  assert.deepEqual(parseLocalizedPath("/fr/about"), {
    locale: "fr",
    path: "/about",
  });
  assert.ok(isSamePath("/en/about", "/about"));
  assert.ok(isSamePath("/fr/about", "/fr/a-propos"));
  assert.ok(isSamePath(localizePath("/projects", "ar"), "/ar/projects"));
  assert.ok(!isSamePath("/fr/a-propos", "/about"));
  assert.ok(!isSamePath("/services", "/fr/services"));
});
