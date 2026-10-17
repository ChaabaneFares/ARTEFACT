import Image from "next/image";
import Link from "next/link";
import { studioContact } from "@/config/studio";

import { type Locale, localizePath } from "@/i18n/routing";
import ContactEmail from "./contact-email";
import { contactInfoCopy } from "./contact-info.copy";
import styles from "./contact-info.module.css";

const iconSizes = {
  be: [19, 11],
  up: [16, 11],
  insta: [12, 12],
  telegram: [13, 11],
  whs: [13, 14],
} as const;

export default function ContactInfo({ locale }: { locale: Locale }) {
  const copy = contactInfoCopy[locale];
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.left}>
          <ContactEmail
            labels={{
              emailCopied: copy.emailCopied,
              copied: copy.copied,
              click: copy.click,
              email: copy.email,
            }}
          />
          <p className={styles.address} aria-hidden={!studioContact.address}>
            {studioContact.address || "\u00a0"}
          </p>
          <Link
            className={styles.mobilePrivacy}
            href={localizePath("/privacyandpolicy", locale)}
          >
            {copy.privacy}
          </Link>
        </div>
        <div className={styles.right}>
          <div className={styles.socials}>
            {studioContact.socials.map((social) =>
              social.href ? (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                >
                  <Image
                    src={`/assets/layout/footer/${social.key}.svg`}
                    alt=""
                    width={iconSizes[social.key][0]}
                    height={iconSizes[social.key][1]}
                    className={styles.icon}
                    data-icon={social.key}
                  />
                </a>
              ) : (
                <span
                  key={social.label}
                  aria-disabled="true"
                  role="img"
                  aria-label={copy.unconfigured.replace(
                    "{social}",
                    social.label,
                  )}
                  title={copy.unconfigured.replace("{social}", social.label)}
                >
                  <Image
                    src={`/assets/layout/footer/${social.key}.svg`}
                    alt=""
                    width={iconSizes[social.key][0]}
                    height={iconSizes[social.key][1]}
                    className={styles.icon}
                    data-icon={social.key}
                  />
                </span>
              ),
            )}
          </div>
          <Link
            className={styles.desktopPrivacy}
            href={localizePath("/privacyandpolicy", locale)}
          >
            {copy.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
