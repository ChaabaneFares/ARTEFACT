import Image from "next/image";
import { studioContact } from "@/config/studio";
import { type Locale, localizePath } from "@/i18n/routing";
import { headerCopy, headerLinks } from "../header.copy";
import MenuEmail from "./components/menu-email/menu-email";
import MenuEstimate from "./components/menu-estimate/menu-estimate";
import MenuLink from "./components/menu-link/menu-link";
import MenuClient from "./menu.client";
import styles from "./menu.module.css";

const socials = ["insta", "whs", "telegram", "be", "up"]
  .map((key) => studioContact.socials.find((social) => social.key === key))
  .filter((social) => social !== undefined);
const mobileSocials = ["up", "be", "whs", "telegram", "insta"]
  .map((key) => studioContact.socials.find((social) => social.key === key))
  .filter((social) => social !== undefined);

export default function Menu({ locale }: { locale: Locale }) {
  const copy = headerCopy[locale];
  const notConfigured = (label: string) =>
    copy.profileNotConfigured.replace("{label}", label);
  return (
    <MenuClient closeLabel={copy.closeMenuBackground}>
      <div className={styles.viewport}>
        <div className={styles.content} data-lenis-prevent>
          <div className={styles.contact}>
            <div>
              <span className={styles.label}>{copy.getInTouch}</span>
              <MenuEmail
                email={studioContact.email}
                label={copy.copyEmail.replace("{email}", studioContact.email)}
                feedback={copy.emailFeedback}
              >
                <span>{studioContact.email}</span>
              </MenuEmail>
            </div>
            <div className={styles.socials}>
              <span className={styles.label}>{copy.social}</span>
              {socials.map((social) =>
                social.href ? (
                  <MenuLink key={social.key} href={social.href} social>
                    <span>{social.label}</span>
                  </MenuLink>
                ) : (
                  <span
                    className={styles.socialLink}
                    key={social.key}
                    aria-disabled="true"
                    title={notConfigured(social.label)}
                  >
                    <span>{social.label}</span>
                  </span>
                ),
              )}
            </div>
            <div />
          </div>
          <div className={styles.mainLinks}>
            {headerLinks.main.map((link) => (
              <MenuLink key={link.key} href={localizePath(link.href, locale)}>
                {copy.links[link.key]}
              </MenuLink>
            ))}
          </div>
          <div className={styles.bottom}>
            <MenuEstimate href={localizePath(headerLinks.estimate, locale)}>
              {copy.menuEstimate}
            </MenuEstimate>
            <div className={styles.mobileSocials}>
              {mobileSocials.map((social) =>
                social.href ? (
                  <a
                    key={social.key}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                  >
                    <Image
                      src={`/assets/layout/menu/${social.label.toLowerCase()}.svg`}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </a>
                ) : (
                  <span
                    key={social.key}
                    role="img"
                    aria-disabled="true"
                    aria-label={notConfigured(social.label)}
                    title={notConfigured(social.label)}
                  >
                    <Image
                      src={`/assets/layout/menu/${social.label.toLowerCase()}.svg`}
                      alt=""
                      width={24}
                      height={24}
                    />
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </MenuClient>
  );
}
