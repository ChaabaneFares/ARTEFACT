"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import type {
  ContactFormLabels,
  ContactMode,
} from "../../_data/contact-runtime";
import ContactSuccess from "../contact-success/contact-success";
import { useContactForm } from "./contact-form.client.logic";
import { FormContext } from "./contact-form.context";
import styles from "./contact-form.module.css";

export default function ContactFormClient({
  initialMode,
  locale,
  labels,
  optionLabels,
  closeLabel,
  children,
  successContent,
}: {
  initialMode: ContactMode;
  locale: Locale;
  labels: ContactFormLabels;
  optionLabels: Record<string, string>;
  closeLabel: string;
  children: ReactNode;
  successContent: ReactNode;
}) {
  const state = useContactForm(initialMode, locale, labels, optionLabels);
  return (
    <FormContext.Provider value={state}>
      <section
        className={styles.section}
        data-mode={state.mode}
        data-contact-form
      >
        {children}
        {state.success && (
          <ContactSuccess onClose={state.closeSuccess} closeLabel={closeLabel}>
            {successContent}
          </ContactSuccess>
        )}
      </section>
    </FormContext.Provider>
  );
}
