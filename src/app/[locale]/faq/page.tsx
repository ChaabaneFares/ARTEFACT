import type { Metadata } from "next";
import Footer from "@/components/layout/footer/footer";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";
import FaqEffects from "./_components/faq-effects/faq-effects";
import FaqHero from "./_components/faq-hero/faq-hero";
import FaqSection from "./_components/faq-section/faq-section";
import { getGeneralQuestions, getGlossaryQuestions } from "./_data/faq";
import { faqCopy } from "./faq.copy";
import styles from "./faq.module.css";

const meta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "FAQ | Artefact Studio",
    description:
      "Answers to common questions about CGI, architectural design, and the studio's process.",
  },
  fr: {
    title: "FAQ | Artefact Studio",
    description:
      "Réponses aux questions fréquentes sur la CGI, la conception architecturale et la méthode du studio.",
  },
  es: {
    title: "Preguntas frecuentes | Artefact Studio",
    description:
      "Respuestas a las preguntas frecuentes sobre CGI, diseño arquitectónico y el proceso del estudio.",
  },
  ar: {
    title: "الأسئلة الشائعة | Artefact Studio",
    description:
      "إجابات عن الأسئلة الشائعة حول الصور المولّدة بالحاسوب (CGI) والتصميم المعماري وطريقة عمل الاستوديو.",
  },
};

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata({ locale, path: "/faq", ...meta[locale] });
}

export default async function FaqPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const copy = faqCopy[locale];
  return (
    <>
      <main className={styles.page} data-faq-page>
        <FaqEffects />
        <FaqHero locale={locale} />
        <FaqSection
          entries={getGeneralQuestions(locale)}
          label={copy.generalLabel}
          fade
        />
        <section className={styles.separator} aria-label={copy.separatorLabel}>
          <h2>{copy.separator}</h2>
        </section>
        <FaqSection
          entries={getGlossaryQuestions(locale)}
          label={copy.glossaryLabel}
        />
      </main>
      <Footer locale={locale} />
    </>
  );
}
