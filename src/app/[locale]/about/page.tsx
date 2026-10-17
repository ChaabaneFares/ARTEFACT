import type { Metadata } from "next";
import Footer from "@/components/layout/footer/footer";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";
import AboutContent from "./_components/about-content/about-content";

const meta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "About | Artefact Studio",
    description:
      "A team of architects and designers creating cozy, modern, and minimalist spaces.",
  },
  fr: {
    title: "À propos | Artefact Studio",
    description:
      "Une équipe d’architectes et de designers qui crée des espaces chaleureux, modernes et minimalistes.",
  },
  es: {
    title: "Sobre nosotros | Artefact Studio",
    description:
      "Un equipo de arquitectos y diseñadores que crea espacios acogedores, modernos y minimalistas.",
  },
  ar: {
    title: "من نحن | Artefact Studio",
    description:
      "فريق من المعماريين والمصممين يبتكر مساحات دافئة وعصرية وبسيطة.",
  },
};

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata({ locale, path: "/about", ...meta[locale] });
}

export default async function AboutPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return (
    <>
      <AboutContent locale={locale} />
      <Footer locale={locale} />
    </>
  );
}
