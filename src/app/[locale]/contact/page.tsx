import type { Metadata } from "next";
import { pageMetadata } from "@/i18n/metadata";
import type { Locale } from "@/i18n/routing";
import { type LocaleParams, resolveLocale } from "@/i18n/server";
import ContactForm from "./_components/contact-form/contact-form";
import ContactInfo from "./_components/contact-info/contact-info";
import styles from "./contact.module.css";

const meta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Contact | Artefact Studio",
    description:
      "Tell Artefact Studio about your project or send a design brief.",
  },
  fr: {
    title: "Contact | Artefact Studio",
    description:
      "Parlez de votre projet à Artefact Studio ou envoyez un brief de design.",
  },
  es: {
    title: "Contacto | Artefact Studio",
    description:
      "Cuéntale tu proyecto a Artefact Studio o envíale un brief de diseño.",
  },
  ar: {
    title: "تواصل معنا | Artefact Studio",
    description: "أخبر Artefact Studio عن مشروعك أو أرسل موجز التصميم.",
  },
};

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return pageMetadata({ locale, path: "/contact", ...meta[locale] });
}

type ContactPageProps = LocaleParams & {
  searchParams: Promise<{ mode?: string }>;
};

export default async function ContactPage({
  params,
  searchParams,
}: ContactPageProps) {
  const locale = await resolveLocale(params);
  const { mode } = await searchParams;
  return (
    <main className={styles.page} data-contact-page>
      <div className={styles.background} aria-hidden="true" />
      <ContactForm
        locale={locale}
        initialMode={mode === "contact" ? "contact" : "brief"}
      />
      <ContactInfo locale={locale} />
    </main>
  );
}
