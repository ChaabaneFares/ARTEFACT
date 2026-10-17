import type { Locale } from "@/i18n/routing";
import styles from "./landing.module.css";
import LandingClient from "./landing-client";
import Hero from "./sections/1-hero/hero";
import Design from "./sections/2-design/design";
import Visualization from "./sections/3-visualization/visualization";
import Vr from "./sections/4-vr/vr";
import Media from "./sections/5-media/media";
import HowItWorks from "./sections/6-how-it-works/how-it-works";
import Process from "./sections/7-process/process";

export default function Landing({ locale }: { locale: Locale }) {
  return (
    <LandingClient locale={locale}>
      <div
        className={styles.sectionNoiseOverlay}
        data-section-noise-overlay=""
        aria-hidden="true"
      />
      <main className={styles.landing}>
        <Hero locale={locale} />
        <Design locale={locale} />
        <Visualization locale={locale} />
        <Vr locale={locale} />
        <Media locale={locale} />
        <HowItWorks locale={locale} />
        <Process locale={locale} />
      </main>
    </LandingClient>
  );
}
