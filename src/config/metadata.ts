import type { Metadata } from "next";
import { localizedAlternates, shareMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "./site";

const siteDescriptions: Record<Locale, string> = {
  en: SITE_DESCRIPTION,
  fr: "Architecture, design intérieur et extérieur, et visualisation immersive par Artefact Studio.",
  es: "Arquitectura, diseño interior y exterior, y visualización inmersiva de Artefact Studio.",
  ar: "عمارة وتصميم داخلي وخارجي وإظهار معماري غامر من Artefact Studio.",
};

export function buildSiteMetadata(locale: Locale): Metadata {
  const description = siteDescriptions[locale];
  return {
    title: SITE_NAME,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: localizedAlternates("/", locale),
    ...shareMetadata({ locale, path: "/", title: SITE_NAME, description }),
  };
}
