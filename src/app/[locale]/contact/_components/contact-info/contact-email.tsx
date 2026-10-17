"use client";

import { studioEmail } from "../../_data/contact-runtime";
import { type ContactEmailLabels, useContactInfo } from "./contact-email.logic";
import styles from "./contact-info.module.css";

export default function ContactEmail({
  labels,
}: {
  labels: ContactEmailLabels;
}) {
  const { copyEmail, handleEnter, handleLeave, status } =
    useContactInfo(labels);
  return (
    <>
      <button
        type="button"
        className={styles.email}
        onClick={copyEmail}
        onPointerEnter={handleEnter}
        onPointerLeave={handleLeave}
      >
        {studioEmail}
      </button>
      <span className={styles.status} aria-live="polite">
        {status}
      </span>
    </>
  );
}
