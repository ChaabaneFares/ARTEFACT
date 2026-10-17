import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { alternatePaths, LOCALES } from "@/i18n/routing";
import { projects } from "./[locale]/projects/_data/projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/services",
    "/projects",
    "/about",
    "/contact",
    "/faq",
    "/privacyandpolicy",
    ...projects.flatMap((project) =>
      project.slug ? [`/projects/${project.slug}`] : [],
    ),
  ];
  // One entry per language, each listing every translation of the page.
  return paths.flatMap((path) => {
    const alternates = alternatePaths(path);
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [locale, `${SITE_URL}${alternates[locale]}`]),
    );
    return LOCALES.map((locale) => ({
      url: `${SITE_URL}${alternates[locale]}`,
      alternates: { languages },
    }));
  });
}
