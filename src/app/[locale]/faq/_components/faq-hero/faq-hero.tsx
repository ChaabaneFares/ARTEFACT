import type { Locale } from "@/i18n/routing";
import { faqHeroCopy } from "./faq-hero.copy";
import styles from "./faq-hero.module.css";

export default function FaqHero({ locale }: { locale: Locale }) {
  const copy = faqHeroCopy[locale];
  return (
    <section className={styles.hero} data-faq-hero>
      <div className={styles.content} data-faq-hero-content>
        <div className={styles.dark} data-faq-hero-dark aria-hidden="true" />
        <h1 className={styles.title} data-page-transition-item>
          {`${copy.questions} `}
          <span className={styles.desktopAnd}>{copy.desktopAnd}</span>
          <span className={styles.mobileAnd}>{copy.mobileAnd}</span>
          {copy.answers}
        </h1>
        <p className={styles.description}>
          <span data-page-transition-item>{copy.intro}</span>
          <span data-page-transition-item>
            <strong>{copy.scroll}</strong>
            {copy.connector}
            <em>{copy.click}</em>
            {copy.ending}
          </span>
        </p>
      </div>
    </section>
  );
}
