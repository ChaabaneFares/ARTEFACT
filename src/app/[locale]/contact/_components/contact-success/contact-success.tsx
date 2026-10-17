"use client";

import type { ReactNode } from "react";
import { useContactSuccess } from "./contact-success.logic";
import styles from "./contact-success.module.css";

export default function ContactSuccess({
  onClose,
  closeLabel,
  children,
}: {
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
}) {
  const { dialogRef, close } = useContactSuccess(onClose);
  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="contact-thanks"
      aria-describedby="contact-thanks-message"
    >
      <button
        type="button"
        className={styles.close}
        onClick={close}
        aria-label={closeLabel}
      >
        ×
      </button>
      {children}
    </dialog>
  );
}
