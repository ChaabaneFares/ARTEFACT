import type { Locale } from "@/i18n/routing";
import { getServiceLinks } from "../../../../_data/services";
import styles from "./service-navigation.module.css";
import ServiceNavigationButton from "./service-navigation-button";

export default function ServiceNavigation({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const serviceLinks = getServiceLinks(locale);
  return (
    <nav className={styles.navigation} aria-label={label}>
      <div className={styles.links} data-lenis-prevent>
        <div aria-hidden="true" />
        {serviceLinks.map((link) => (
          <ServiceNavigationButton key={link.id} targetId={link.id}>
            {link.label}
          </ServiceNavigationButton>
        ))}
        <div aria-hidden="true" />
      </div>
    </nav>
  );
}
