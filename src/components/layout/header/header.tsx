import Image from "next/image";
import { type Locale, localizePath } from "@/i18n/routing";
import HeaderHome from "./components/header-home/header-home";
import HeaderLanguage from "./components/header-language/header-language";
import HeaderMenuToggle from "./components/header-menu-toggle/header-menu-toggle";
import HeaderQuote from "./components/header-quote/header-quote";
import HeaderTopLink from "./components/header-top-link/header-top-link";
import HeaderTopLinks from "./components/header-top-links/header-top-links";
import HeaderClient from "./header.client";
import { headerCopy, headerLinks } from "./header.copy";
import styles from "./header.module.css";
import Menu from "./menu/menu";

function MenuButtonSvg() {
  return (
    <svg aria-hidden="true" viewBox="0 0 27 3">
      <rect width="25" height="2.5" rx="1.5" fill="currentColor" />
    </svg>
  );
}

export default function Header({ locale }: { locale: Locale }) {
  const copy = headerCopy[locale];
  return (
    <HeaderClient label={copy.navigation}>
      <HeaderHome href={localizePath("/", locale)}>
        <Image
          className={styles.logoMark}
          src="/assets/brand/artefact-mark-white.svg"
          alt=""
          width={30}
          height={35}
          priority
          unoptimized
        />
        <Image
          className={styles.logoSlot}
          src="/assets/brand/artefact-logo.svg"
          alt=""
          width={72}
          height={35}
          priority
          unoptimized
        />
        <span className={styles.srOnly}>{copy.home}</span>
      </HeaderHome>
      <div className={styles.linksContainer}>
        <HeaderMenuToggle openLabel={copy.openMenu} closeLabel={copy.closeMenu}>
          <MenuButtonSvg />
          <MenuButtonSvg />
        </HeaderMenuToggle>
        <HeaderLanguage locale={locale} label={copy.language} />
        <HeaderQuote href={localizePath(headerLinks.estimate, locale)}>
          {copy.estimate}
        </HeaderQuote>
        <HeaderTopLinks>
          {headerLinks.top.map((key) => (
            <HeaderTopLink key={key} href={localizePath(`/${key}`, locale)}>
              {copy.links[key]}
            </HeaderTopLink>
          ))}
        </HeaderTopLinks>
      </div>
      <Menu locale={locale} />
    </HeaderClient>
  );
}
