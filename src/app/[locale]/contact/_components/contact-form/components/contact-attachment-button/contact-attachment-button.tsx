"use client";

import type { ReactNode } from "react";
import SelectionPill from "@/components/ui/selection-pill/selection-pill";
import styles from "../../contact-form.module.css";
import { useContactAttachmentButton } from "./contact-attachment-button.logic";

export default function ContactAttachmentButton({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const { state, openAttachments } = useContactAttachmentButton();
  return (
    <SelectionPill
      label={label}
      onClick={openAttachments}
      className={`${styles.pill} ${styles.attachmentButton}`}
      disabled={state.busy}
    >
      {children}
    </SelectionPill>
  );
}
