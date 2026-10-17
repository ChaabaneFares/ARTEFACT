import Link from "next/link";
import { localizePath } from "@/i18n/routing";
import type { LandingSectionProps } from "../../landing.types";
import { heroCopy } from "./hero.copy";
import styles from "./hero.module.css";
import HeroAnimateLoader from "./heroAnimateLoader";
import HeroVideoReveal from "./heroVideoReveal";

export default function Hero({ locale }: LandingSectionProps) {
  const copy = heroCopy[locale];
  return (
    <div id="sti" className={styles.stickyArea} data-hero-sticky-area>
      <section
        className={`${styles.hero} head revealed`}
        data-scroll=""
        data-scroll-sticky=""
        data-scroll-target="#sti"
        data-hero-root
      >
        <HeroAnimateLoader />
        <HeroVideoReveal />
        <div className={`${styles.background} backg`} aria-hidden="true">
          <picture>
            <source
              media="(max-width: 500px)"
              srcSet="/assets/video/hero-poster-mobile.webp"
            />
            <img
              className={styles.video}
              src="/assets/video/hero-poster-desktop.webp"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <video
            id="homevid"
            className={styles.video}
            playsInline
            muted
            loop
            autoPlay
            preload="auto"
            data-hero-video
          >
            <source
              src="/assets/video/allLow1.m4v"
              type="video/mp4"
              media="(min-width: 501px)"
            />
            <source
              src="/assets/video/all-mobile1.m4v"
              type="video/mp4"
              media="(max-width: 500px)"
            />
          </video>
        </div>

        <div className={`${styles.darkLayer} darkLay`} aria-hidden="true" />
        <div
          className={`${styles.scrollDarkLayer} darkLay2`}
          aria-hidden="true"
          data-hero-scroll-layer
        />

        <div className={`${styles.titleShell} h1`} data-hero-title>
          <h1>
            <span className={`${styles.headSpan} headSpan`}>
              <span className={styles.headSpanInner} data-page-transition-item>
                {copy.architecture}
              </span>
            </span>
            <span className={`${styles.headSpan} headSpan`}>
              <span className={styles.headSpanInner} data-page-transition-item>
                {copy.design}
              </span>
            </span>
            <span className={`${styles.headSpan} headSpan`}>
              <span className={styles.headSpanInner} data-page-transition-item>
                {copy.visualization}
              </span>
            </span>
            <div className={`${styles.callAction} call-action`}>
              <Link
                className={`${styles.estimateButton} estimate-btn btn`}
                href={localizePath("/contact", locale)}
              >
                {copy.estimate}
              </Link>
              <Link
                className={`${styles.viewProjectsButton} view-projects-btn`}
                href={localizePath("/projects", locale)}
              >
                {copy.projects}
              </Link>
            </div>
          </h1>
        </div>

        <div className={`${styles.copyWrapper} h2-wrapper`}>
          <div className={`${styles.copyContainer} h2-con`} data-hero-copy>
            <div className={`${styles.copy} h2 home`}>
              <h6>{copy.eyebrow}</h6>
              <h3>{copy.description}</h3>
            </div>

            <div className={`${styles.buttonContainer} btn-container`}>
              <div className={styles.buttonMouseArea}>
                <Link
                  className={`${styles.moreButton} btn-more`}
                  href={localizePath("/about", locale)}
                >
                  <span className={styles.moreButtonTitle}>
                    <span data-text={copy.more}>{copy.more}</span>
                  </span>
                  <span className={styles.moreButtonRipple} aria-hidden="true">
                    <span />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
