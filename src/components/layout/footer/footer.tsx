import Image from "next/image";
import Link from "next/link";
import { studioContact } from "@/config/studio";
import { type Locale, localizePath } from "@/i18n/routing";
import { footerCopy } from "./footer.copy";
import styles from "./footer.module.css";
import FooterAnimateLoader from "./footerAnimateLoader";
import FooterButton from "./footerButton";

const SOCIAL_ICONS = {
  be: { className: styles.behanceIcon, width: 19, height: 11 },
  up: { className: styles.upworkIcon, width: 16, height: 11 },
  insta: { className: styles.instagramIcon, width: 12, height: 12 },
  telegram: { className: styles.telegramIcon, width: 13, height: 11 },
  whs: { className: styles.whatsappIcon, width: 14, height: 14 },
} as const;

export default function Footer({ locale }: { locale: Locale }) {
  const copy = footerCopy[locale];
  const contactHref = localizePath("/contact", locale);
  const privacyHref = localizePath("/privacyandpolicy", locale);
  const notConfigured = (label: string) =>
    copy.profileNotConfigured.replace("{label}", label);
  return (
    <section
      id="bab"
      className={`${styles.footer} sec-form footer-sec fot`}
      data-footer-root
      aria-label={copy.label}
    >
      <FooterAnimateLoader />

      <div
        className={`${styles.background} backgr`}
        data-footer-background
        data-scroll
        data-scroll-sticky
        data-scroll-target="#bab"
        aria-hidden="true"
      />

      <div className={`${styles.trig} trig`} data-footer-trig>
        <div className={`${styles.footerMain} footer-main`}>
          <h6 className={styles.headline} data-footer-headline>
            {copy.headline.start}
            <br />{" "}
            <span className={styles.headlineLine}>
              {copy.headline.line}{" "}
              <span className={styles.headlineAccent}>
                {copy.headline.accent}
              </span>
            </span>
          </h6>

          <div
            className={`${styles.tabsHolder} tabs-holder`}
            data-footer-tabs
            data-scroll
            data-scroll-speed=".8"
          >
            <FooterButton href={contactHref}>{copy.sendBrief}</FooterButton>
            <FooterButton href={localizePath("/contact?mode=contact", locale)}>
              {copy.contactUs}
            </FooterButton>
          </div>
        </div>

        <div className={`${styles.footerFoot} footer-foot`} data-footer-content>
          <div
            className={`${styles.footerSection} ${styles.left} footer-secs l`}
          >
            <button
              type="button"
              className={styles.emailButton}
              data-footer-email
              data-copy-value={studioContact.email}
              data-copy-hover={copy.copyFeedback.hover}
              data-copy-done={copy.copyFeedback.copied}
              data-copy-failed={copy.copyFeedback.failed}
              data-copy-unavailable={copy.copyFeedback.unavailable}
            >
              {studioContact.email}
            </button>
            <span
              className={styles.metaLine}
              aria-hidden={!studioContact.address || undefined}
            >
              {studioContact.address || "\u00a0"}
            </span>
            <Link
              className={`${styles.metaLine} ${styles.mobilePrivacy}`}
              href={privacyHref}
              data-footer-cursor
            >
              {copy.privacy}
            </Link>
          </div>

          <div
            className={`${styles.footerSection} ${styles.right} footer-secs r`}
          >
            <FooterButton
              className={styles.mobileButtonMotion}
              href={contactHref}
            >
              {copy.estimate}
            </FooterButton>

            <div className={styles.socialLinks}>
              {studioContact.socials.map((social) => {
                const icon = SOCIAL_ICONS[social.key];
                const image = (
                  <Image
                    key={social.key}
                    className={icon.className}
                    src={`/assets/layout/footer/${social.key}.svg`}
                    alt=""
                    width={icon.width}
                    height={icon.height}
                  />
                );
                return social.href ? (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={social.label}
                    data-footer-cursor
                  >
                    {image}
                  </a>
                ) : (
                  <span
                    key={social.key}
                    role="img"
                    aria-disabled="true"
                    aria-label={notConfigured(social.label)}
                    title={notConfigured(social.label)}
                  >
                    {image}
                  </span>
                );
              })}
            </div>

            <Link
              className={`${styles.metaLine} ${styles.desktopPrivacy}`}
              href={privacyHref}
              data-footer-cursor
            >
              {copy.privacy}
            </Link>
          </div>
        </div>

        <div className={`${styles.developerMark} vawzen`} data-footer-content>
          <span>{copy.credit}</span>
          <a
            className={styles.creditLogo}
            href="https://vawzen.org/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vawzen"
            data-footer-cursor
          >
            <Image
              src="/assets/brand/vawzen-wordmark-stacked.svg"
              alt="Vawzen"
              width={32}
              height={20}
            />
          </a>
        </div>

        <span
          className={styles.copyStatus}
          data-footer-copy-status
          aria-live="polite"
        />
      </div>
    </section>
  );
}
