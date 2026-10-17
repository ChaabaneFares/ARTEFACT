import type { Metadata } from "next";
import { preload } from "react-dom";
import "../globals.css";

import Initializer from "@/components/initializer/initializer";
import Layout from "@/components/layout/layout";
import { ARABIC_FONT_URL, poppins } from "@/config/fonts";
import { buildSiteMetadata } from "@/config/metadata";
import { LOCALES, localeDirection } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";

// Every language is prerendered. Any other first segment reaches
// `resolveLocale` and becomes a 404. The fallback stays enabled: disabling it
// would make Next log an internal error for every unknown URL, the same
// reason the project route keeps its own fallback.
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  return buildSiteMetadata(await resolveLocale(params));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<LocaleParams & { children: React.ReactNode }>) {
  const locale = await resolveLocale(params);
  if (locale === "ar") {
    preload(ARABIC_FONT_URL, {
      as: "font",
      type: "font/woff2",
      crossOrigin: "anonymous",
    });
  }
  return (
    <html lang={locale} dir={localeDirection(locale)}>
      <body
        className={
          // Arabic takes its stack from --font-family-base in globals.css.
          locale === "ar"
            ? poppins.variable
            : `${poppins.variable} ${poppins.className}`
        }
      >
        <Initializer />
        <Layout locale={locale}>{children}</Layout>
      </body>
    </html>
  );
}
