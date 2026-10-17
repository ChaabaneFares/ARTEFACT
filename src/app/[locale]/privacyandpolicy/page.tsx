import type { Metadata } from "next";
import Footer from "@/components/layout/footer/footer";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";
import PrivacyMotion from "./_components/privacy-motion/privacy-motion";
import { getPrivacy } from "./_data/privacy";
import styles from "./privacy.module.css";

const meta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Privacy policy | Artefact Studio",
    description:
      "How Artefact Studio handles contact requests and website information.",
  },
  fr: {
    title: "Politique de confidentialité | Artefact Studio",
    description:
      "Comment Artefact Studio traite les demandes de contact et les informations du site.",
  },
  es: {
    title: "Política de privacidad | Artefact Studio",
    description:
      "Cómo gestiona Artefact Studio las solicitudes de contacto y la información del sitio web.",
  },
  ar: {
    title: "سياسة الخصوصية | Artefact Studio",
    description: "كيف يتعامل Artefact Studio مع طلبات التواصل ومعلومات الموقع.",
  },
};

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata({ locale, path: "/privacyandpolicy", ...meta[locale] });
}

export default async function PrivacyPage({ params }: LocaleParams) {
  const locale = await resolveLocale(params);
  const { title, blocks } = getPrivacy(locale);
  return (
    <>
      <main className={styles.page} data-privacy-page>
        <div className={styles.content} data-privacy-content>
          <PrivacyMotion />
          <h1
            data-privacy-title
            data-privacy-parallax="0.4"
            data-page-transition-item
          >
            {title}
          </h1>
          {blocks.map((block) =>
            block.tag === "h2" ? (
              <h2 key={block.id} data-privacy-parallax="0.4">
                {block.text}
              </h2>
            ) : block.tag === "h3" ? (
              <h3 key={block.id}>{block.text}</h3>
            ) : block.tag === "ul" ? (
              <ul key={block.id} data-privacy-parallax="-0.3">
                {block.items?.map((item, index) => (
                  <li key={`${block.id}-${index}`}>
                    <span aria-hidden="true">•</span> {item.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p
                key={block.id}
                data-privacy-parallax={
                  block.id === "policy-26" ? "-0.3" : undefined
                }
              >
                {block.text?.includes("chaabane@artefactstudio.org") ? (
                  <>
                    {block.text.replace("chaabane@artefactstudio.org", "")}
                    <a href="mailto:chaabane@artefactstudio.org">
                      chaabane@artefactstudio.org
                    </a>
                  </>
                ) : (
                  block.text
                )}
              </p>
            ),
          )}
        </div>
      </main>
      <Footer locale={locale} />
    </>
  );
}
