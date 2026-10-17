"use client";

import type { ReactNode } from "react";
import { useFaqSection } from "./faq-section.client.logic";
import { FaqContext } from "./faq-section.context";
import styles from "./faq-section.module.css";

export default function FaqSectionClient({
  children,
  label,
  fade,
}: {
  children: ReactNode;
  label: string;
  fade: boolean;
}) {
  const state = useFaqSection();
  return (
    <FaqContext.Provider value={state}>
      <section className={styles.section} aria-label={label} data-faq-section>
        {fade && (
          <div
            className={styles.fade}
            data-dismissed={state.fadeDismissed}
            data-faq-mobile-fade
            aria-hidden="true"
          />
        )}
        {children}
      </section>
    </FaqContext.Provider>
  );
}
