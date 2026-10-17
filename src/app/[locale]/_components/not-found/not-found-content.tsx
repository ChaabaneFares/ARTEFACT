import Link from "next/link";
import { LOCALES, type Locale, localizePath } from "@/i18n/routing";
import styles from "./not-found.module.css";

const copy: Record<Locale, { message: string; home: string }> = {
  en: { message: "the page you want is not found", home: "Back to home" },
  fr: {
    message: "la page demandée est introuvable",
    home: "Retour à l’accueil",
  },
  es: { message: "la página que buscas no existe", home: "Ir al inicio" },
  ar: {
    message: "الصفحة التي تبحث عنها غير موجودة",
    home: "العودة إلى الرئيسية",
  },
};

/**
 * A not-found boundary receives no route params, so every language is
 * rendered and the stylesheet keeps the one matching `<html lang>`. No
 * JavaScript decides which copy shows, so it is right from first paint.
 */
export default function NotFoundContent() {
  return (
    <main className={styles.page}>
      <h1 data-page-transition-item>404</h1>
      {LOCALES.map((locale) => (
        <div className={styles.copy} lang={locale} key={locale}>
          <h2>{copy[locale].message}</h2>
          <Link href={localizePath("/", locale)}>{copy[locale].home}</Link>
        </div>
      ))}
    </main>
  );
}
