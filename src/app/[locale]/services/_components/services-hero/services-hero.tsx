import type { Locale } from "@/i18n/routing";
import ServiceNavigation from "./components/service-navigation/service-navigation";
import { servicesHeroCopy } from "./services-hero.copy";
import styles from "./services-hero.module.css";

export default function ServicesHero({ locale }: { locale: Locale }) {
  const copy = servicesHeroCopy[locale];
  return (
    <section className={styles.hero} aria-labelledby="services-title">
      <div className={styles.content}>
        <p className={styles.eyebrow} data-page-transition-item>
          {copy.eyebrow}
        </p>
        <h1
          id="services-title"
          className={styles.title}
          data-page-transition-group
        >
          <span data-page-transition-item>{copy.lines[0]}</span>{" "}
          <span data-page-transition-item>{copy.lines[1]}</span>{" "}
          <span data-page-transition-item>{copy.lines[2]}</span>
        </h1>
        <ServiceNavigation locale={locale} label={copy.eyebrow} />
      </div>
    </section>
  );
}
