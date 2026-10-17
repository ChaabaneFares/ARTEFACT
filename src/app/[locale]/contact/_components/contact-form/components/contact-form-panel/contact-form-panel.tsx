"use client";

import type { ReactNode } from "react";
import styles from "../../contact-form.module.css";
import { useContactFormPanel } from "./contact-form-panel.logic";

export default function ContactFormPanel({
  children,
}: {
  children: ReactNode;
}) {
  const { state } = useContactFormPanel();
  return (
    <div
      id="contact-form-panel"
      role="tabpanel"
      aria-labelledby={`${state.mode}-tab`}
    >
      <form
        ref={state.formRef}
        className={styles.form}
        data-page-transition-item
        onSubmit={state.handleSubmit}
        noValidate
        aria-busy={state.busy}
      >
        {children}
      </form>
    </div>
  );
}
