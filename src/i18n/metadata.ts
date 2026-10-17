import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/config/site";
import { alternatePaths, LOCALES, type Locale, localizePath } from "./routing";

export const OPEN_GRAPH_LOCALES: Record<Locale, string> = {
  en: "en_US",
  fr: "fr_FR",
  es: "es_ES",
  ar: "ar_AR",
};

/**
 * Canonical plus one hreflang entry per language for an English path. Paths
 * stay relative; the layout's `metadataBase` makes them absolute.
 */
export function localizedAlternates(
  path: string,
  locale: Locale,
): NonNullable<Metadata["alternates"]> {
  const paths = alternatePaths(path);
  return {
    canonical: paths[locale],
    languages: {
      ...Object.fromEntries(LOCALES.map((item) => [item, paths[item]])),
      "x-default": paths.en,
    },
  };
}

type PageMetadataInput = {
  locale: Locale;
  path: string;
  title: string;
  description?: string;
};

const SHARE_IMAGE_ALT: Record<Locale, string> = {
  en: "Artefact Studio: step inside your project before it’s built. Architecture, design and 360° virtual tours.",
  fr: "Artefact Studio : visitez votre projet avant le chantier. Architecture, design et visites virtuelles 360°.",
  es: "Artefact Studio: recorre tu proyecto antes de la obra. Arquitectura, diseño y tours virtuales 360°.",
  ar: "Artefact Studio: تجوّل في مشروعك قبل أن يُبنى. عمارة وتصميم وجولات افتراضية 360°.",
};

/**
 * The 1200×630 link-preview card for a language. Baseline JPEGs well under
 * 300 KB, so WhatsApp, Messenger, Discord, Slack, LinkedIn, iMessage and X
 * all render them; the URL is absolute because several crawlers ignore
 * relative image paths.
 */
export function shareImage(locale: Locale) {
  const url = `${SITE_URL}/og/artefact-studio-${locale}.jpg`;
  return {
    url,
    secureUrl: url,
    type: "image/jpeg",
    width: 1200,
    height: 630,
    alt: SHARE_IMAGE_ALT[locale],
  };
}

/**
 * Open Graph and Twitter tags for one page. A page that sets `openGraph`
 * replaces the layout's object instead of merging into it, so every page
 * restates the site name, languages and card image here.
 */
export function shareMetadata({
  locale,
  path,
  title,
  description,
}: PageMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  const image = shareImage(locale);
  return {
    openGraph: {
      type: "website",
      url: `${SITE_URL}${localizePath(path, locale)}`,
      title,
      description,
      siteName: SITE_NAME,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: LOCALES.filter((item) => item !== locale).map(
        (item) => OPEN_GRAPH_LOCALES[item],
      ),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: image.url, alt: image.alt, width: 1200, height: 630 }],
    },
  };
}

export function pageMetadata({
  locale,
  path,
  title,
  description,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: localizedAlternates(path, locale),
    ...shareMetadata({ locale, path, title, description }),
  };
}
