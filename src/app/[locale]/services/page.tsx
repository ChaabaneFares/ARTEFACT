import type { Metadata } from "next";
import Footer from "@/components/layout/footer/footer";
import VSlider from "@/components/ui/VSlider/Vslider";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";
import ServicesHero from "./_components/services-hero/services-hero";
import { getServices } from "./_data/services";
import { servicesPageCopy } from "./services-page.copy";
import styles from "./services-page.module.css";

const meta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Services | Artefact Studio",
    description:
      "Interior and exterior design, 3D rendering, CG animation, and immersive virtual tours from Artefact Studio.",
  },
  fr: {
    title: "Services | Artefact Studio",
    description:
      "Design intérieur et extérieur, rendu 3D, animation CG et visites virtuelles immersives par Artefact Studio.",
  },
  es: {
    title: "Servicios | Artefact Studio",
    description:
      "Diseño interior y exterior, renderizado 3D, animación CG y tours virtuales inmersivos de Artefact Studio.",
  },
  ar: {
    title: "الخدمات | Artefact Studio",
    description:
      "تصميم داخلي وخارجي، وتصيير ثلاثي الأبعاد، وتحريك CG، وجولات افتراضية غامرة من Artefact Studio.",
  },
};

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata({ locale, path: "/services", ...meta[locale] });
}

export default async function ServicesPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  return (
    <>
      <main className={styles.page} data-services-page>
        <ServicesHero locale={locale} />
        <VSlider
          items={getServices(locale)}
          buttonLabel={servicesPageCopy[locale].buttonLabel}
          variant="services"
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
