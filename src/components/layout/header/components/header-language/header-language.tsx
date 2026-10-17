"use client";

import {
  LOCALE_CODES,
  LOCALE_NAMES,
  LOCALES,
  type Locale,
  localeDirection,
} from "@/i18n/routing";
import styles from "../../header.module.css";
import { useHeaderLanguage } from "./header-language.logic";

export default function HeaderLanguage({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const { choose, hrefs, isVisible } = useHeaderLanguage(locale);
  return (
    <ul className={styles.language} aria-label={label} inert={!isVisible}>
      {LOCALES.map((item) => (
        <li key={item}>
          <a
            href={hrefs[item]}
            hrefLang={item}
            lang={item}
            dir={localeDirection(item)}
            aria-label={LOCALE_NAMES[item]}
            aria-current={item === locale ? "true" : undefined}
            title={LOCALE_NAMES[item]}
            data-locale-switch
            onClick={(event) => choose(event, item)}
          >
            {LOCALE_CODES[item]}
          </a>
        </li>
      ))}
    </ul>
  );
}
