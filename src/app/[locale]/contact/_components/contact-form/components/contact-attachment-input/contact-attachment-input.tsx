"use client";

import styles from "../../contact-form.module.css";
import { useContactAttachmentInput } from "./contact-attachment-input.logic";

export default function ContactAttachmentInput({ label }: { label: string }) {
  const { state } = useContactAttachmentInput();
  return (
    <input
      ref={state.attachmentRef}
      id="contact-attachments"
      type="file"
      multiple
      onChange={state.addAttachments}
      aria-label={label}
      className={styles.fileInput}
      disabled={state.busy}
    />
  );
}
