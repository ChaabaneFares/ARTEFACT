import type { Metadata } from "next";
import Footer from "@/components/layout/footer/footer";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";
import ProjectCatalog from "./_components/project-catalog/project-catalog";

const meta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Projects | Artefact Studio",
    description:
      "Explore interior and exterior design, rendering, animation, concepts, and immersive virtual tours.",
  },
  fr: {
    title: "Projets | Artefact Studio",
    description:
      "Découvrez nos projets de design intérieur et extérieur, rendus, animations, concepts et visites virtuelles immersives.",
  },
  es: {
    title: "Proyectos | Artefact Studio",
    description:
      "Explora proyectos de diseño interior y exterior, renderizado, animación, conceptos y tours virtuales inmersivos.",
  },
  ar: {
    title: "المشاريع | Artefact Studio",
    description:
      "استكشف مشاريع التصميم الداخلي والخارجي والتصيير والتحريك والتصاميم المفاهيمية والجولات الافتراضية الغامرة.",
  },
};

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata({ locale, path: "/projects", ...meta[locale] });
}

export default async function ProjectsPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return (
    <>
      <main data-projects-page>
        <ProjectCatalog locale={locale} />
      </main>
      <Footer locale={locale} />
    </>
  );
}
