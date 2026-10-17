"use client";

import styles from "../../contact-form.module.css";
import { useContactFeedback } from "./contact-feedback.logic";

export default function ContactFeedback({
  website,
  draft,
  manualAttachments,
}: {
  website: string;
  draft: string;
  manualAttachments: string;
}) {
  const { state, handleWebsiteChange } = useContactFeedback();
  return (
    <>
      <label className={styles.honeypot} aria-hidden="true">
        {website}
        <input
          name="website"
          value={state.website}
          onChange={handleWebsiteChange}
          autoComplete="off"
          tabIndex={-1}
        />
      </label>
      {state.deliveryError && (
        <div className={styles.deliveryError} role="alert">
          <p>{state.deliveryError}</p>
          <a href={state.emailDraft}>{draft}</a>
          {state.attachments.length > 0 && <p>{manualAttachments}</p>}
        </div>
      )}
    </>
  );
}
