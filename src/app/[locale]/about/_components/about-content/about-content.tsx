import FadeInImage from "@/components/ui/fadeInImage";
import type { Locale } from "@/i18n/routing";
import { getAboutContent } from "../../_data/about";
import { aboutContentCopy } from "./about-content.copy";
import styles from "./about-content.module.css";
import AboutAnimationLoader from "./components/about-animation-loader/about-animation-loader";

export default function AboutContent({ locale }: { locale: Locale }) {
  const aboutContent = getAboutContent(locale);
  const copy = aboutContentCopy[locale];
  return (
    <main className={styles.page} data-about-page>
      <div className={styles.headline} data-about-headline>
        <div className={styles.darkLayer} data-about-dark aria-hidden="true" />
        <p
          className={styles.eyebrow}
          data-about-eyebrow
          data-page-transition-item
        >
          {copy.eyebrow}
        </p>
        <h1
          className={styles.title}
          aria-label={aboutContent.title.join(" ")}
          data-about-title
          data-page-transition-group
        >
          {aboutContent.title.map((line) => (
            <span key={line} data-page-transition-item>
              {line}
            </span>
          ))}
        </h1>
        <p className={styles.introduction} data-about-introduction>
          {aboutContent.introduction}
        </p>
      </div>
      <div className={`${styles.photo} ${styles.firstPhoto}`} data-about-photo>
        <FadeInImage
          src="/assets/about/hero.jpg"
          alt={copy.heroAlt}
          width={1200}
          height={1200}
          sizes="(max-width: 768px) 100vw, 75vw"
          priority
          className={styles.image}
        />
      </div>
      <div className={styles.members} data-about-members>
        {[0, 1].map((row) => (
          <div className={styles.memberRow} data-about-row key={row}>
            {aboutContent.portraits.slice(row * 3, row * 3 + 3).map((src) => (
              <div className={styles.portrait} key={src}>
                <FadeInImage
                  src={src}
                  alt={copy.memberAlt}
                  fill
                  sizes="(max-width: 768px) 45vw, 20vw"
                  className={styles.portraitImage}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.clients}>
        <p>{aboutContent.clients}</p>
      </div>
      <div className={styles.photo} data-about-photo>
        <FadeInImage
          src="/assets/about/studio.jpg"
          alt={copy.studioAlt}
          width={1200}
          height={1200}
          sizes="(max-width: 768px) 100vw, 75vw"
          className={styles.image}
        />
      </div>
      <div className={styles.philosophy}>
        <div className={styles.statement} data-about-statement>
          <p>
            <span>{copy.philosophy}</span>
            {copy.less}
          </p>
        </div>
        <div className={styles.statement} data-about-statement>
          <p>
            {copy.worldwide}
            <br className={styles.mobileBreak} />
            {copy.work}
          </p>
        </div>
      </div>
      <AboutAnimationLoader />
    </main>
  );
}
