"use client";

import type { ReactNode } from "react";
import styles from "../../contact-form.module.css";
import { useContactSubmit } from "./contact-submit.logic";

export default function ContactSubmit({
  label,
  sending,
  children,
}: {
  label: string;
  sending: string;
  children: ReactNode;
}) {
  const { state, text, handleSubmitEnter, handleSubmitLeave } =
    useContactSubmit(label, sending);
  return (
    <button
      ref={state.submitRef}
      className={styles.submit}
      type="submit"
      disabled={state.busy}
      onPointerEnter={handleSubmitEnter}
      onPointerLeave={handleSubmitLeave}
    >
      <span className={styles.submitMask}>
        <span className={styles.submitLabel} data-text={text}>
          {text}
        </span>
      </span>
      {children}
    </button>
  );
}
